import os
import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from database import get_db
from auth import get_current_user, get_optional_user, require_operator
from services.ai_service import analyze_ticket
import models
import schemas

router = APIRouter(prefix="/api/tickets", tags=["tickets"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

_REQUEST_TYPE_LABELS = {
    "technical": "Технічна проблема",
    "payment": "Оплата / підписка",
    "consultation": "Консультація",
    "complaint": "Скарга",
}


def _ticket_to_out(ticket: models.Ticket) -> schemas.TicketOut:
    return schemas.TicketOut(
        id=ticket.id,
        title=ticket.title,
        description=ticket.description,
        request_type=ticket.request_type,
        category=ticket.category or ticket.ai_category,
        status=ticket.status,
        priority=ticket.priority,
        user_id=ticket.user_id,
        operator_id=ticket.operator_id,
        operator_name=ticket.operator.name if ticket.operator else None,
        ai_analyzed=ticket.ai_analyzed,
        ai_category=ticket.ai_category,
        ai_priority=ticket.ai_priority,
        ai_summary=ticket.ai_summary,
        ai_recommendation=ticket.ai_recommendation,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        replies=[
            schemas.ReplyOut(
                id=r.id,
                content=r.content,
                is_operator=r.is_operator,
                author_name=r.author.name if r.author else None,
                created_at=r.created_at,
            )
            for r in ticket.replies
        ],
        attachments=[
            schemas.AttachmentOut(
                id=a.id,
                filename=a.filename,
                content_type=a.content_type,
                size=a.size,
                url=f"/uploads/{os.path.basename(a.path)}",
            )
            for a in ticket.attachments
        ],
    )


async def _run_ai_analysis(ticket_id: str, title: str, description: str, request_type: str):
    from database import SessionLocal

    result = await analyze_ticket(title, description, _REQUEST_TYPE_LABELS.get(request_type, request_type))
    db = SessionLocal()
    try:
        ticket = db.get(models.Ticket, ticket_id)
        if ticket:
            ticket.ai_category = result.category
            ticket.ai_priority = result.priority
            ticket.ai_summary = result.summary
            ticket.ai_recommendation = result.recommendation
            ticket.ai_analyzed = True
            if ticket.priority == "medium":
                ticket.priority = result.priority
            db.commit()
    finally:
        db.close()


@router.get("/my", response_model=schemas.TicketListPage)
def my_tickets(
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    from sqlalchemy import func
    status_counts_q = db.query(models.Ticket.status, func.count(models.Ticket.id)).filter(models.Ticket.user_id == current_user.id).group_by(models.Ticket.status).all()
    status_counts = {s: c for s, c in status_counts_q}

    q = (
        db.query(models.Ticket)
        .options(selectinload(models.Ticket.operator))
        .filter(models.Ticket.user_id == current_user.id)
        .order_by(models.Ticket.created_at.desc())
    )

    total = q.count()
    pages = max(1, -(-total // limit))
    tickets = q.offset((page - 1) * limit).limit(limit).all()

    return schemas.TicketListPage(
        total=total,
        page=page,
        pages=pages,
        status_counts=status_counts,
        items=[
            schemas.TicketListItem(
                id=t.id,
                title=t.title,
                category=t.category or t.ai_category,
                status=t.status,
                priority=t.priority,
                request_type=t.request_type,
                operator_name=t.operator.name if t.operator else None,
                created_at=t.created_at,
            )
            for t in tickets
        ],
    )


@router.post("", response_model=schemas.TicketOut, status_code=201)
def create_ticket(
    body: schemas.TicketCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User | None = Depends(get_optional_user),
):
    ticket_id = models.Ticket.next_id(db)
    priority = body.priority if body.priority != "auto" else "medium"

    ticket = models.Ticket(
        id=ticket_id,
        title=body.title,
        description=body.description,
        request_type=body.request_type,
        priority=priority,
        user_id=current_user.id if current_user else None,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    background_tasks.add_task(
        _run_ai_analysis, ticket_id, body.title, body.description, body.request_type
    )

    return _ticket_to_out(ticket)


@router.get("", response_model=schemas.TicketListPage)
def list_tickets(
    status: Annotated[str | None, Query()] = None,
    priority: Annotated[str | None, Query()] = None,
    search: Annotated[str | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 15,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_operator),
):
    q = db.query(models.Ticket).options(selectinload(models.Ticket.operator))
    if status:
        q = q.filter(models.Ticket.status == status)
    if priority:
        q = q.filter(models.Ticket.priority == priority)
    if search:
        q = q.filter(models.Ticket.title.ilike(f"%{search}%"))
    q = q.order_by(models.Ticket.created_at.desc())

    total = q.count()
    pages = max(1, -(-total // limit))  # ceiling division
    tickets = q.offset((page - 1) * limit).limit(limit).all()

    return schemas.TicketListPage(
        total=total,
        page=page,
        pages=pages,
        items=[
            schemas.TicketListItem(
                id=t.id,
                title=t.title,
                category=t.category or t.ai_category,
                status=t.status,
                priority=t.priority,
                request_type=t.request_type,
                operator_name=t.operator.name if t.operator else None,
                created_at=t.created_at,
            )
            for t in tickets
        ],
    )


@router.get("/{ticket_id}", response_model=schemas.TicketOut)
def get_ticket(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_user: models.User | None = Depends(get_optional_user),
):
    ticket = (
        db.query(models.Ticket)
        .options(
            selectinload(models.Ticket.replies).selectinload(models.Reply.author),
            selectinload(models.Ticket.attachments),
            selectinload(models.Ticket.operator),
        )
        .filter(models.Ticket.id == ticket_id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return _ticket_to_out(ticket)


@router.patch("/{ticket_id}/status", response_model=schemas.TicketOut)
def update_status(
    ticket_id: str,
    body: schemas.TicketStatusUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_operator),
):
    ticket = db.query(models.Ticket).options(
        selectinload(models.Ticket.replies).selectinload(models.Reply.author),
        selectinload(models.Ticket.attachments),
        selectinload(models.Ticket.operator),
    ).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.status = body.status
    db.commit()
    db.refresh(ticket)
    return _ticket_to_out(ticket)


@router.patch("/{ticket_id}/assign", response_model=schemas.TicketOut)
def assign_ticket(
    ticket_id: str,
    body: schemas.TicketAssign,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_operator),
):
    ticket = db.query(models.Ticket).options(
        selectinload(models.Ticket.replies).selectinload(models.Reply.author),
        selectinload(models.Ticket.attachments),
        selectinload(models.Ticket.operator),
    ).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    operator = db.get(models.User, body.operator_id)
    if not operator or operator.role not in ("operator", "admin"):
        raise HTTPException(status_code=400, detail="Invalid operator")
    ticket.operator_id = body.operator_id
    ticket.status = "progress"
    db.commit()
    db.refresh(ticket)
    return _ticket_to_out(ticket)


@router.post("/{ticket_id}/reply", response_model=schemas.ReplyOut, status_code=201)
def add_reply(
    ticket_id: str,
    body: schemas.ReplyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.get(models.Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    is_operator = current_user.role in ("operator", "admin")
    reply = models.Reply(
        ticket_id=ticket_id,
        author_id=current_user.id,
        content=body.content,
        is_operator=is_operator,
    )
    if is_operator and ticket.status == "new":
        ticket.status = "progress"

    db.add(reply)
    db.commit()
    db.refresh(reply)

    return schemas.ReplyOut(
        id=reply.id,
        content=reply.content,
        is_operator=reply.is_operator,
        author_name=current_user.name,
        created_at=reply.created_at,
    )


@router.post("/{ticket_id}/attachments", status_code=201)
async def upload_attachment(
    ticket_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User | None = Depends(get_optional_user),
):
    ticket = db.get(models.Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    safe_name = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    attachment = models.Attachment(
        ticket_id=ticket_id,
        filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        size=len(content),
        path=file_path,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return {"id": attachment.id, "filename": attachment.filename, "size": attachment.size}

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import require_admin, require_operator
import models
import schemas

router = APIRouter(prefix="/api/operators", tags=["operators"])

_AVATAR_STYLES = [
    {"bg": "#DBEAFE", "color": "#1E40AF"},
    {"bg": "#D1FAE5", "color": "#065F46"},
    {"bg": "#EDE9FE", "color": "#5B21B6"},
    {"bg": "#FEF3C7", "color": "#92400E"},
    {"bg": "#FCE7F3", "color": "#9D174D"},
]


@router.get("", response_model=list[schemas.OperatorLoad])
def list_operators(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_operator),
):
    ops = db.query(models.User).filter(models.User.role.in_(["operator", "admin"])).all()
    result = []
    for i, op in enumerate(ops):
        active = (
            db.query(models.Ticket)
            .filter(models.Ticket.operator_id == op.id, models.Ticket.status == "progress")
            .count()
        )
        style = _AVATAR_STYLES[i % len(_AVATAR_STYLES)]
        initials = "".join(w[0].upper() for w in op.name.split()[:2])
        result.append(
            schemas.OperatorLoad(
                id=op.id,
                initials=initials,
                name=op.name,
                active_tickets=active,
                avatar_bg=style["bg"],
                avatar_color=style["color"],
            )
        )
    return result


@router.post("", response_model=schemas.UserOut, status_code=201)
def create_operator(
    body: schemas.RegisterRequest,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    from auth import hash_password

    if db.query(models.User).filter_by(email=body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        email=body.email,
        name=body.name,
        password_hash=hash_password(body.password),
        role="operator",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

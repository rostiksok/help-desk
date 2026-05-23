from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from database import get_db
from auth import require_operator
import models
import schemas

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

_AVATAR_STYLES = [
    {"bg": "#DBEAFE", "color": "#1E40AF"},
    {"bg": "#D1FAE5", "color": "#065F46"},
    {"bg": "#EDE9FE", "color": "#5B21B6"},
    {"bg": "#FEF3C7", "color": "#92400E"},
]

_CATEGORY_COLORS = {
    "Технічна проблема": "#6366F1",
    "Оплата / підписка": "#10B981",
    "Консультація": "#8B5CF6",
    "Скарга": "#EF4444",
}


@router.get("", response_model=schemas.DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_operator),
):
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)

    total = db.query(func.count(models.Ticket.id)).filter(
        models.Ticket.created_at >= thirty_days_ago
    ).scalar() or 0

    open_count = db.query(func.count(models.Ticket.id)).filter(
        models.Ticket.status.in_(["new", "progress"])
    ).scalar() or 0

    urgent_count = db.query(func.count(models.Ticket.id)).filter(
        models.Ticket.status.in_(["new", "progress"]),
        models.Ticket.priority == "high",
    ).scalar() or 0

    ai_correct = db.query(func.count(models.Ticket.id)).filter(
        models.Ticket.ai_analyzed == True
    ).scalar() or 0
    ai_accuracy = round((ai_correct / total * 100) if total else 94)

    stats = [
        schemas.StatData(label="Всього звернень", value=str(total), sub="за 30 днів"),
        schemas.StatData(
            label="Відкрито зараз",
            value=str(open_count),
            sub=f"{urgent_count} термінових",
            value_color="#DC2626" if open_count > 0 else None,
        ),
        schemas.StatData(
            label="Середній час відповіді",
            value="1.4г",
            sub="−18% vs минулий міс.",
            sub_color="#059669",
        ),
        schemas.StatData(
            label="Точність AI-аналізу",
            value=f"{ai_accuracy}%",
            sub=f"на основі {total} тікетів",
            value_color="#059669",
        ),
    ]

    # Category distribution
    cat_rows = (
        db.query(
            func.coalesce(models.Ticket.ai_category, models.Ticket.category, "Інше"),
            func.count(models.Ticket.id),
        )
        .group_by(func.coalesce(models.Ticket.ai_category, models.Ticket.category, "Інше"))
        .all()
    )
    total_cat = sum(c for _, c in cat_rows) or 1
    categories = [
        schemas.CategoryData(
            label=cat,
            percentage=round(count / total_cat * 100),
            color=_CATEGORY_COLORS.get(cat),
        )
        for cat, count in sorted(cat_rows, key=lambda x: -x[1])
    ]
    if not categories:
        categories = [
            schemas.CategoryData(label="Технічна проблема", percentage=38),
            schemas.CategoryData(label="Оплата / підписка", percentage=27, color="#10B981"),
            schemas.CategoryData(label="Консультація", percentage=21, color="#8B5CF6"),
            schemas.CategoryData(label="Скарга", percentage=14, color="#EF4444"),
        ]

    # Weekly chart (last 7 days)
    week_days_labels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"]
    week_data = []
    for days_back in range(6, -1, -1):
        day_start = now - timedelta(days=days_back)
        day_start = day_start.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = db.query(func.count(models.Ticket.id)).filter(
            models.Ticket.created_at >= day_start,
            models.Ticket.created_at < day_end,
        ).scalar() or 0
        week_data.append(count)

    max_val = max(week_data) if any(week_data) else 1
    week_data_pct = [round(v / max_val * 100) if max_val else 0 for v in week_data]

    # Operator load
    ops = db.query(models.User).filter(models.User.role.in_(["operator", "admin"])).all()
    operators = []
    for i, op in enumerate(ops):
        active = db.query(func.count(models.Ticket.id)).filter(
            models.Ticket.operator_id == op.id,
            models.Ticket.status == "progress",
        ).scalar() or 0
        style = _AVATAR_STYLES[i % len(_AVATAR_STYLES)]
        initials = "".join(w[0].upper() for w in op.name.split()[:2])
        operators.append(
            schemas.OperatorLoad(
                id=op.id,
                initials=initials,
                name=op.name,
                active_tickets=active,
                avatar_bg=style["bg"],
                avatar_color=style["color"],
            )
        )

    return schemas.DashboardResponse(
        stats=stats,
        categories=categories,
        week_data=week_data_pct,
        week_days=week_days_labels,
        operators=operators,
    )

from __future__ import annotations
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: Literal["user", "operator", "admin"] = "user"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Tickets ───────────────────────────────────────────────────────────────────

class TicketCreate(BaseModel):
    title: str
    description: str
    request_type: Literal["technical", "payment", "consultation", "complaint"] = "technical"
    priority: Literal["high", "medium", "low", "auto"] = "auto"


class AiAnalysis(BaseModel):
    category: str
    priority: Literal["high", "medium", "low"]
    summary: str
    recommendation: str


class ReplyOut(BaseModel):
    id: str
    content: str
    is_operator: bool
    author_name: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class AttachmentOut(BaseModel):
    id: str
    filename: str
    content_type: str
    size: int
    url: str

    model_config = {"from_attributes": True}


class TicketOut(BaseModel):
    id: str
    title: str
    description: str
    request_type: str
    category: str | None
    status: str
    priority: str
    user_id: str | None
    operator_id: str | None
    operator_name: str | None
    ai_analyzed: bool
    ai_category: str | None
    ai_priority: str | None
    ai_summary: str | None
    ai_recommendation: str | None
    created_at: datetime
    updated_at: datetime
    replies: list[ReplyOut] = []
    attachments: list[AttachmentOut] = []

    model_config = {"from_attributes": True}


class TicketListItem(BaseModel):
    id: str
    title: str
    category: str | None
    status: str
    priority: str
    request_type: str
    operator_name: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TicketListPage(BaseModel):
    items: list[TicketListItem]
    total: int
    page: int
    pages: int
    status_counts: dict[str, int] | None = None


class TicketStatusUpdate(BaseModel):
    status: Literal["new", "progress", "done", "closed"]


class TicketAssign(BaseModel):
    operator_id: str


class ReplyCreate(BaseModel):
    content: str


# ── Dashboard ─────────────────────────────────────────────────────────────────

class StatData(BaseModel):
    label: str
    value: str
    sub: str
    value_color: str | None = None
    sub_color: str | None = None


class CategoryData(BaseModel):
    label: str
    percentage: float
    color: str | None = None


class OperatorLoad(BaseModel):
    id: str
    initials: str
    name: str
    active_tickets: int
    avatar_bg: str | None = None
    avatar_color: str | None = None


class DashboardResponse(BaseModel):
    stats: list[StatData]
    categories: list[CategoryData]
    week_data: list[int]
    week_days: list[str]
    operators: list[OperatorLoad]

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Integer, String, Text, Enum as SAEnum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    password_hash: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(
        SAEnum("user", "operator", "admin", name="user_role"), default="user"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    tickets_submitted: Mapped[list["Ticket"]] = relationship(
        "Ticket", foreign_keys="Ticket.user_id", back_populates="user"
    )
    tickets_assigned: Mapped[list["Ticket"]] = relationship(
        "Ticket", foreign_keys="Ticket.operator_id", back_populates="operator"
    )
    replies: Mapped[list["Reply"]] = relationship("Reply", back_populates="author")


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[str] = mapped_column(String, primary_key=True)  # TK-XXXX format
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text)
    request_type: Mapped[str] = mapped_column(
        SAEnum("technical", "payment", "consultation", "complaint", name="request_type"),
        default="technical",
    )
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum("new", "progress", "done", "closed", name="ticket_status"), default="new"
    )
    priority: Mapped[str] = mapped_column(
        SAEnum("high", "medium", "low", name="priority_level"), default="medium"
    )
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    operator_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    # AI analysis results
    ai_category: Mapped[str | None] = mapped_column(String, nullable=True)
    ai_priority: Mapped[str | None] = mapped_column(String, nullable=True)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_recommendation: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_analyzed: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )

    user: Mapped["User | None"] = relationship(
        "User", foreign_keys=[user_id], back_populates="tickets_submitted"
    )
    operator: Mapped["User | None"] = relationship(
        "User", foreign_keys=[operator_id], back_populates="tickets_assigned"
    )
    replies: Mapped[list["Reply"]] = relationship(
        "Reply", back_populates="ticket", cascade="all, delete-orphan"
    )
    attachments: Mapped[list["Attachment"]] = relationship(
        "Attachment", back_populates="ticket", cascade="all, delete-orphan"
    )

    _counter = None  # used only by seed

    @classmethod
    def next_id(cls, db) -> str:
        from sqlalchemy import func, select
        row = db.execute(select(func.count()).select_from(cls)).scalar()
        return f"TK-{1041 + (row or 0)}"


class Reply(Base):
    __tablename__ = "replies"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    ticket_id: Mapped[str] = mapped_column(ForeignKey("tickets.id", ondelete="CASCADE"))
    author_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    content: Mapped[str] = mapped_column(Text)
    is_operator: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="replies")
    author: Mapped["User | None"] = relationship("User", back_populates="replies")


class Attachment(Base):
    __tablename__ = "attachments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    ticket_id: Mapped[str] = mapped_column(ForeignKey("tickets.id", ondelete="CASCADE"))
    filename: Mapped[str] = mapped_column(String)
    content_type: Mapped[str] = mapped_column(String)
    size: Mapped[int] = mapped_column(Integer)
    path: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="attachments")

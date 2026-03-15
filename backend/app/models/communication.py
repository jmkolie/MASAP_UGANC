import enum
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, ForeignKey,
    Integer, String, Text
)
from sqlalchemy.orm import relationship

from app.database import Base


class AudienceType(str, enum.Enum):
    all = "all"
    students = "students"
    teachers = "teachers"
    program = "program"
    module = "module"
    cohort = "cohort"


class NotificationType(str, enum.Enum):
    info = "info"
    warning = "warning"
    success = "success"
    error = "error"


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    audience = Column(Enum(AudienceType), default=AudienceType.all)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=True)
    cohort_id = Column(Integer, ForeignKey("cohorts.id"), nullable=True)
    is_pinned = Column(Boolean, default=False)
    is_published = Column(Boolean, default=True)
    published_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    author = relationship("User", back_populates="announcements")
    program = relationship("Program", back_populates="announcements")
    module = relationship("Module", back_populates="announcements")
    cohort = relationship("Cohort", back_populates="announcements")


class CourseDocument(Base):
    __tablename__ = "course_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)
    file_type = Column(String(100), nullable=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_type = Column(String(50), default="course")  # course, td, tp, exam, other
    is_visible = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    module = relationship("Module", back_populates="course_documents")
    uploaded_by_user = relationship("User", back_populates="uploaded_documents")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sender = relationship("User", back_populates="sent_messages", foreign_keys=[sender_id])
    recipient = relationship("User", back_populates="received_messages", foreign_keys=[recipient_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    type = Column(Enum(NotificationType), default=NotificationType.info)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    link = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")

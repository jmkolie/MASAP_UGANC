from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

from app.models.communication import AudienceType, NotificationType


class AnnouncementBase(BaseModel):
    title: str
    content: str
    audience: AudienceType = AudienceType.all
    program_id: Optional[int] = None
    module_id: Optional[int] = None
    cohort_id: Optional[int] = None
    is_pinned: bool = False
    is_published: bool = True
    expires_at: Optional[datetime] = None


class AnnouncementCreate(AnnouncementBase):
    pass


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_published: Optional[bool] = None
    expires_at: Optional[datetime] = None


class AnnouncementResponse(AnnouncementBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    author_id: int
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class CourseDocumentBase(BaseModel):
    title: str
    description: Optional[str] = None
    module_id: int
    document_type: str = "course"
    is_visible: bool = True


class CourseDocumentCreate(CourseDocumentBase):
    pass


class CourseDocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    document_type: Optional[str] = None
    is_visible: Optional[bool] = None


class CourseDocumentResponse(CourseDocumentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    file_path: str
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    uploaded_by: int
    created_at: datetime


class MessageCreate(BaseModel):
    recipient_id: int
    subject: str
    content: str


class MessageUserInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    first_name: str
    last_name: str
    email: str


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    sender_id: int
    recipient_id: int
    subject: str
    content: str
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    sender: Optional[MessageUserInfo] = None
    recipient: Optional[MessageUserInfo] = None


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    title: str
    content: Optional[str] = None
    type: NotificationType
    is_read: bool
    read_at: Optional[datetime] = None
    link: Optional[str] = None
    created_at: datetime

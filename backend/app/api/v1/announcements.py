from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.user import User, StudentProfile, RoleEnum
from app.models.communication import Announcement, Message, Notification
from app.models.academic import Module, Cohort, Program
from app.core.deps import get_current_user, get_teacher_or_above, log_action
from app.schemas.communication import (
    AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse,
    MessageCreate, MessageResponse, NotificationResponse,
)
from app.utils.helpers import paginate

router = APIRouter()


# ─── Announcements ────────────────────────────────────────────────────────────

@router.get("", response_model=dict)
async def list_announcements(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    module_id: Optional[int] = None,
    program_id: Optional[int] = None,
    cohort_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get announcements relevant to the current user."""
    now = datetime.utcnow()
    query = db.query(Announcement).filter(
        Announcement.is_published == True,
        (Announcement.expires_at == None) | (Announcement.expires_at > now),
    )

    if current_user.role == RoleEnum.student:
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
        if profile:
            query = query.filter(
                (Announcement.audience == "all") |
                (Announcement.audience == "students") |
                (Announcement.program_id == profile.program_id) |
                (Announcement.cohort_id == profile.cohort_id)
            )
        else:
            query = query.filter(Announcement.audience.in_(["all", "students"]))
    elif current_user.role == RoleEnum.teacher:
        query = query.filter(
            (Announcement.audience == "all") |
            (Announcement.audience == "teachers") |
            (Announcement.author_id == current_user.id)
        )
    # Admin/dept_head see all

    if module_id:
        query = query.filter(Announcement.module_id == module_id)
    if program_id:
        query = query.filter(Announcement.program_id == program_id)
    if cohort_id:
        query = query.filter(Announcement.cohort_id == cohort_id)

    query = query.order_by(Announcement.is_pinned.desc(), Announcement.created_at.desc())
    result = paginate(query, page, per_page)
    result["items"] = [AnnouncementResponse.model_validate(a) for a in result["items"]]
    return result


@router.post("", response_model=AnnouncementResponse, status_code=201)
async def create_announcement(
    payload: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_teacher_or_above),
):
    announcement = Announcement(
        **payload.model_dump(),
        author_id=current_user.id,
        published_at=datetime.utcnow() if payload.is_published else None,
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    log_action(db, current_user.id, "CREATE_ANNOUNCEMENT", "Announcement", announcement.id)
    return announcement


@router.get("/{announcement_id}", response_model=AnnouncementResponse)
async def get_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ann = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    return ann


@router.put("/{announcement_id}", response_model=AnnouncementResponse)
async def update_announcement(
    announcement_id: int,
    payload: AnnouncementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_teacher_or_above),
):
    ann = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    if current_user.role == RoleEnum.teacher and ann.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez modifier que vos propres annonces")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(ann, k, v)
    ann.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ann)
    return ann


@router.delete("/{announcement_id}", status_code=204)
async def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_teacher_or_above),
):
    ann = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    if current_user.role == RoleEnum.teacher and ann.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")
    db.delete(ann)
    db.commit()


# ─── Messages ─────────────────────────────────────────────────────────────────

@router.get("/messages/inbox", response_model=dict)
async def get_inbox(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Message)
        .options(joinedload(Message.sender), joinedload(Message.recipient))
        .filter(Message.recipient_id == current_user.id)
        .order_by(Message.created_at.desc())
    )
    result = paginate(query, page, per_page)
    result["items"] = [MessageResponse.model_validate(m) for m in result["items"]]
    return result


@router.get("/messages/sent", response_model=dict)
async def get_sent_messages(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Message)
        .options(joinedload(Message.sender), joinedload(Message.recipient))
        .filter(Message.sender_id == current_user.id)
        .order_by(Message.created_at.desc())
    )
    result = paginate(query, page, per_page)
    result["items"] = [MessageResponse.model_validate(m) for m in result["items"]]
    return result


@router.post("/messages", response_model=MessageResponse, status_code=201)
async def send_message(
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    recipient = db.query(User).filter(User.id == payload.recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Destinataire non trouvé")

    message = Message(
        sender_id=current_user.id,
        recipient_id=payload.recipient_id,
        subject=payload.subject,
        content=payload.content,
    )
    db.add(message)
    db.flush()

    # Create notification for recipient
    notification = Notification(
        user_id=payload.recipient_id,
        title=f"Nouveau message de {current_user.full_name}",
        content=payload.subject,
        type="info",
        link=f"/messages/{message.id}",
    )
    db.add(notification)
    db.commit()
    db.refresh(message)
    return message


@router.put("/messages/{message_id}/read")
async def mark_message_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message = db.query(Message).filter(
        Message.id == message_id,
        Message.recipient_id == current_user.id,
    ).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message non trouvé")
    message.is_read = True
    message.read_at = datetime.utcnow()
    db.commit()
    return {"message": "Message marqué comme lu"}


# ─── Notifications ────────────────────────────────────────────────────────────

@router.get("/notifications/my", response_model=dict)
async def get_my_notifications(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    query = query.order_by(Notification.created_at.desc())
    result = paginate(query, page, per_page)
    result["items"] = [NotificationResponse.model_validate(n) for n in result["items"]]
    return result


@router.put("/notifications/{notif_id}/read")
async def mark_notification_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == current_user.id,
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification non trouvée")
    notif.is_read = True
    notif.read_at = datetime.utcnow()
    db.commit()
    return {"message": "Notification marquée comme lue"}

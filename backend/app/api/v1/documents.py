from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path

from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.communication import CourseDocument
from app.models.academic import Module
from app.core.deps import get_current_user, get_teacher_or_above, log_action
from app.schemas.communication import CourseDocumentCreate, CourseDocumentResponse
from app.services.file_service import save_upload_file, get_file_path
from app.utils.helpers import paginate
from app.config import settings

router = APIRouter()


@router.get("", response_model=dict)
async def list_documents(
    module_id: Optional[int] = None,
    document_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(CourseDocument).filter(CourseDocument.is_visible == True)
    if module_id:
        query = query.filter(CourseDocument.module_id == module_id)
    if document_type:
        query = query.filter(CourseDocument.document_type == document_type)
    query = query.order_by(CourseDocument.created_at.desc())
    result = paginate(query, page, per_page)
    result["items"] = [CourseDocumentResponse.model_validate(d) for d in result["items"]]
    return result


@router.post("/upload", response_model=CourseDocumentResponse, status_code=201)
async def upload_document(
    module_id: int = Form(...),
    title: str = Form(...),
    description: str = Form(None),
    document_type: str = Form("course"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_teacher_or_above),
):
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module non trouvé")

    file_info = await save_upload_file(file, sub_dir="documents")

    doc = CourseDocument(
        title=title,
        description=description,
        file_path=file_info["file_path"],
        file_size=file_info["file_size"],
        file_type=file_info["file_type"],
        module_id=module_id,
        uploaded_by=current_user.id,
        document_type=document_type,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    log_action(db, current_user.id, "UPLOAD_DOCUMENT", "CourseDocument", doc.id, title)
    return doc


@router.get("/{document_id}", response_model=CourseDocumentResponse)
async def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(CourseDocument).filter(CourseDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    return doc


@router.get("/{document_id}/download")
async def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(CourseDocument).filter(CourseDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    if not doc.is_visible and current_user.role == RoleEnum.student:
        raise HTTPException(status_code=403, detail="Document non disponible")

    file_path = get_file_path(doc.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier non trouvé sur le serveur")

    return FileResponse(
        path=str(file_path),
        filename=doc.title,
        media_type=doc.file_type or "application/octet-stream",
    )


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_teacher_or_above),
):
    doc = db.query(CourseDocument).filter(CourseDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    # Teachers can only delete their own documents
    if current_user.role == RoleEnum.teacher and doc.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez supprimer que vos propres documents")
    db.delete(doc)
    db.commit()


@router.post("/profile-picture", status_code=200)
async def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.file_service import ALLOWED_IMAGE_TYPES
    file_info = await save_upload_file(
        file, sub_dir="profiles", allowed_types=ALLOWED_IMAGE_TYPES
    )
    current_user.profile_picture = file_info["file_path"]
    db.commit()
    return {"file_path": file_info["file_path"], "message": "Photo de profil mise à jour"}

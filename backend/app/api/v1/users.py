import csv
import io
import os
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, UploadFile, File, status
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.user import User, StudentProfile, TeacherProfile, RoleEnum, AuditLog
from app.core.security import get_password_hash
from app.core.deps import get_current_user, get_admin, get_teacher_or_above, log_action
from app.config import settings
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse, UserListResponse,
    StudentCreate, StudentUpdate, StudentResponse,
    TeacherCreate, TeacherUpdate, TeacherResponse,
    AuditLogResponse,
)
from app.utils.helpers import generate_student_id, generate_teacher_id, paginate

router = APIRouter()


# ─── Users ────────────────────────────────────────────────────────────────────

@router.get("", response_model=dict)
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    role: Optional[RoleEnum] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_admin),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.first_name.ilike(search_term)) |
            (User.last_name.ilike(search_term)) |
            (User.email.ilike(search_term))
        )
    query = query.order_by(User.created_at.desc())
    result = paginate(query, page, per_page)
    result["items"] = [UserListResponse.model_validate(u) for u in result["items"]]
    return result


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    payload: UserCreate,
    current_user: User = Depends(get_admin),
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Un utilisateur avec cet email existe déjà")

    user = User(
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        role=payload.role,
        is_active=payload.is_active,
    )
    db.add(user)
    db.flush()

    log_action(db, current_user.id, "CREATE_USER", "User", user.id, f"Created user {user.email}")
    db.commit()
    db.refresh(user)
    return user


@router.get("/me/profile", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image")
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "jpg"
    if ext not in ("jpg", "jpeg", "png", "webp", "gif"):
        raise HTTPException(status_code=400, detail="Format non supporté (jpg, png, webp)")
    filename = f"{current_user.id}.{ext}"
    save_path = os.path.join(settings.UPLOAD_DIR, "profiles", filename)
    contents = await file.read()
    with open(save_path, "wb") as f:
        f.write(contents)
    current_user.profile_picture = f"/uploads/profiles/{filename}"
    db.commit()
    db.refresh(current_user)
    return current_user


# ─── Students ──────────────────────────────────────────────────────────────────

@router.get("/students/list", response_model=dict)
async def list_students(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    program_id: Optional[int] = None,
    cohort_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_teacher_or_above),
    db: Session = Depends(get_db),
):
    query = (
        db.query(User)
        .join(StudentProfile, User.id == StudentProfile.user_id)
        .options(joinedload(User.student_profile))
        .filter(User.role == RoleEnum.student)
    )
    if search:
        term = f"%{search}%"
        query = query.filter(
            (User.first_name.ilike(term)) |
            (User.last_name.ilike(term)) |
            (User.email.ilike(term)) |
            (StudentProfile.student_id.ilike(term))
        )
    if program_id:
        query = query.filter(StudentProfile.program_id == program_id)
    if cohort_id:
        query = query.filter(StudentProfile.cohort_id == cohort_id)
    if status:
        query = query.filter(StudentProfile.enrollment_status == status)
    query = query.order_by(User.last_name)
    result = paginate(query, page, per_page)
    result["items"] = [StudentResponse.model_validate(u) for u in result["items"]]
    return result


@router.post("/students", response_model=StudentResponse, status_code=201)
async def create_student(
    payload: StudentCreate,
    current_user: User = Depends(get_admin),
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    user = User(
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        role=RoleEnum.student,
    )
    db.add(user)
    db.flush()

    profile_data = payload.profile or {}
    profile_dict = profile_data.model_dump() if hasattr(profile_data, 'model_dump') else {}
    student_profile = StudentProfile(
        user_id=user.id,
        student_id=generate_student_id(db),
        **profile_dict,
    )
    db.add(student_profile)
    log_action(db, current_user.id, "CREATE_STUDENT", "User", user.id)
    db.commit()
    db.refresh(user)
    return user


@router.get("/students/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: int,
    current_user: User = Depends(get_teacher_or_above),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .options(joinedload(User.student_profile))
        .filter(User.id == student_id, User.role == RoleEnum.student)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Étudiant non trouvé")
    return user


# ─── Teachers ──────────────────────────────────────────────────────────────────

@router.get("/teachers/list", response_model=dict)
async def list_teachers(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    department_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        db.query(User)
        .options(joinedload(User.teacher_profile))
        .filter(User.role == RoleEnum.teacher)
    )
    if search:
        term = f"%{search}%"
        query = query.filter(
            (User.first_name.ilike(term)) |
            (User.last_name.ilike(term)) |
            (User.email.ilike(term))
        )
    if department_id:
        query = query.join(TeacherProfile).filter(TeacherProfile.department_id == department_id)
    query = query.order_by(User.last_name)
    result = paginate(query, page, per_page)
    result["items"] = [TeacherResponse.model_validate(u) for u in result["items"]]
    return result


@router.post("/teachers", response_model=TeacherResponse, status_code=201)
async def create_teacher(
    payload: TeacherCreate,
    current_user: User = Depends(get_admin),
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    user = User(
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        role=RoleEnum.teacher,
    )
    db.add(user)
    db.flush()

    profile_data = payload.profile
    profile_dict = profile_data.model_dump() if profile_data else {}
    teacher_profile = TeacherProfile(
        user_id=user.id,
        teacher_id=generate_teacher_id(db),
        **profile_dict,
    )
    db.add(teacher_profile)
    log_action(db, current_user.id, "CREATE_TEACHER", "User", user.id)
    db.commit()
    db.refresh(user)
    return user


# ─── Audit Logs ────────────────────────────────────────────────────────────────

@router.get("/audit-logs", response_model=dict)
async def list_audit_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_admin),
    db: Session = Depends(get_db),
):
    query = db.query(AuditLog).order_by(AuditLog.created_at.desc())
    result = paginate(query, page, per_page)
    result["items"] = [AuditLogResponse.model_validate(log) for log in result["items"]]
    return result


# ─── CSV Import ────────────────────────────────────────────────────────────────

@router.post("/import-students-csv")
async def import_students_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_admin),
    db: Session = Depends(get_db),
):
    """Import students from a CSV file.
    Expected columns: email, first_name, last_name, phone (optional), password (optional)
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Seuls les fichiers CSV sont acceptés")

    content = await file.read()
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    created = 0
    errors = []

    for i, row in enumerate(reader, start=2):
        email = row.get("email", "").strip().lower()
        if not email:
            errors.append(f"Ligne {i}: email manquant")
            continue

        existing = db.query(User).filter(User.email == email).first()
        if existing:
            errors.append(f"Ligne {i}: {email} existe déjà")
            continue

        password = row.get("password", "Etud@2024!").strip() or "Etud@2024!"
        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            first_name=row.get("first_name", "").strip(),
            last_name=row.get("last_name", "").strip(),
            phone=row.get("phone", "").strip() or None,
            role=RoleEnum.student,
        )
        db.add(user)
        db.flush()

        student_profile = StudentProfile(
            user_id=user.id,
            student_id=generate_student_id(db),
        )
        db.add(student_profile)
        db.flush()
        created += 1

    db.commit()
    log_action(db, current_user.id, "IMPORT_CSV_STUDENTS", details=f"{created} students imported")

    return {
        "message": f"{created} étudiant(s) importé(s) avec succès",
        "created": created,
        "errors": errors,
    }


# ─── Export CSV ────────────────────────────────────────────────────────────────

@router.get("/export-csv")
async def export_users_csv(
    role: Optional[RoleEnum] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_admin),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        term = f"%{search}%"
        query = query.filter(
            (User.first_name.ilike(term)) |
            (User.last_name.ilike(term)) |
            (User.email.ilike(term))
        )
    users = query.order_by(User.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "email", "first_name", "last_name", "phone", "role", "is_active", "created_at"])
    for u in users:
        writer.writerow([
            u.id, u.email, u.first_name, u.last_name,
            u.phone or "", u.role.value,
            "oui" if u.is_active else "non",
            u.created_at.strftime("%Y-%m-%d %H:%M") if u.created_at else "",
        ])
    csv_bytes = output.getvalue().encode("utf-8-sig")  # utf-8-sig = BOM pour Excel

    return Response(
        content=csv_bytes,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=utilisateurs.csv"},
    )


# ─── Import CSV générique ───────────────────────────────────────────────────────

@router.post("/import-csv")
async def import_users_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_admin),
    db: Session = Depends(get_db),
):
    """Import utilisateurs depuis un CSV.
    Colonnes attendues: email, first_name, last_name, phone (opt), password (opt), role (opt, défaut: student)
    """
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Seuls les fichiers CSV sont acceptés")

    content = await file.read()
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    created = 0
    errors: List[str] = []
    valid_roles = {r.value for r in RoleEnum}

    for i, row in enumerate(reader, start=2):
        email = row.get("email", "").strip().lower()
        if not email:
            errors.append(f"Ligne {i}: email manquant")
            continue

        existing = db.query(User).filter(User.email == email).first()
        if existing:
            errors.append(f"Ligne {i}: {email} existe déjà")
            continue

        raw_role = row.get("role", "student").strip().lower()
        role = raw_role if raw_role in valid_roles else "student"

        password = row.get("password", "").strip() or "Masap@2024!"
        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            first_name=row.get("first_name", "").strip(),
            last_name=row.get("last_name", "").strip(),
            phone=row.get("phone", "").strip() or None,
            role=RoleEnum(role),
        )
        db.add(user)
        db.flush()

        if role == "student":
            db.add(StudentProfile(user_id=user.id, student_id=generate_student_id(db)))
            db.flush()

        created += 1

    db.commit()
    log_action(db, current_user.id, "IMPORT_CSV_USERS", details=f"{created} users imported")

    return {
        "message": f"{created} utilisateur(s) importé(s) avec succès",
        "created": created,
        "errors": errors,
    }


# ─── Pending registrations ─────────────────────────────────────────────────────

@router.get("/students/pending", response_model=dict)
async def list_pending_students(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_admin),
    db: Session = Depends(get_db),
):
    """List students awaiting admin approval (is_active=False)."""
    query = (
        db.query(User)
        .options(joinedload(User.student_profile))
        .filter(User.role == RoleEnum.student, User.is_active.is_(False))
        .order_by(User.created_at.desc())
    )
    result = paginate(query, page, per_page)
    result["items"] = [StudentResponse.model_validate(u) for u in result["items"]]
    return result


@router.post("/students/{student_id}/approve", response_model=StudentResponse)
async def approve_student(
    student_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_admin),
    db: Session = Depends(get_db),
):
    """Approve a pending student registration."""
    from app.services.email_service import send_account_approved_email

    user = db.query(User).filter(
        User.id == student_id, User.role == RoleEnum.student
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Étudiant non trouvé")
    if user.is_active:
        raise HTTPException(status_code=400, detail="Ce compte est déjà actif")

    user.is_active = True
    user.is_verified = True
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    log_action(db, current_user.id, "APPROVE_STUDENT", "User", user.id)
    background_tasks.add_task(
        send_account_approved_email,
        to=user.email,
        first_name=user.first_name,
    )
    return user


@router.post("/students/{student_id}/reject", status_code=204)
async def reject_student(
    student_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_admin),
    db: Session = Depends(get_db),
):
    """Reject and delete a pending student registration."""
    from app.services.email_service import send_account_rejected_email

    user = db.query(User).filter(
        User.id == student_id, User.role == RoleEnum.student, User.is_active.is_(False)
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Inscription en attente non trouvée")

    email, first_name = user.email, user.first_name
    log_action(db, current_user.id, "REJECT_STUDENT", "User", user.id, f"Rejected {email}")
    db.delete(user)
    db.commit()

    background_tasks.add_task(send_account_rejected_email, to=email, first_name=first_name)


# ─── User CRUD (avec paramètre dynamique — doit être EN DERNIER) ────────────────

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == RoleEnum.student and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Accès refusé")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != RoleEnum.super_admin and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Accès refusé")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    update_data = payload.model_dump(exclude_unset=True)
    if current_user.role != RoleEnum.super_admin:
        update_data.pop("role", None)
    for field, value in update_data.items():
        setattr(user, field, value)
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_admin),
    db: Session = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre compte")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    log_action(db, current_user.id, "DELETE_USER", "User", user_id, f"Deleted user {user.email}")
    db.delete(user)
    db.commit()

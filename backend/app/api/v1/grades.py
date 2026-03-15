import os
from datetime import datetime
from decimal import Decimal
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.database import get_db
from app.models.user import User, StudentProfile, RoleEnum
from app.models.academic import Module, AcademicYear, Semester
from app.models.grades import (
    Grade, GradeComponent, ModuleResult,
    Thesis, Internship, Assignment, AssignmentSubmission
)
from app.core.deps import (
    get_current_user, get_admin, get_dept_head_or_admin,
    get_teacher_or_above, log_action
)
from app.schemas.grades import (
    GradeComponentCreate, GradeComponentResponse,
    GradeCreate, GradeUpdate, GradeResponse,
    BulkGradeCreate, ModuleResultResponse,
    ThesisCreate, ThesisUpdate, ThesisResponse,
    InternshipCreate, InternshipUpdate, InternshipResponse,
    AssignmentCreate, AssignmentUpdate, AssignmentResponse,
    AssignmentSubmissionResponse, TranscriptData,
)
from app.utils.helpers import calculate_weighted_average, get_grade_mention, is_passing

router = APIRouter()


# ─── Grade Components ───────────────────────────────────────────────────────────

@router.get("/components/{module_id}", response_model=List[GradeComponentResponse])
async def get_grade_components(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return [GradeComponentResponse.model_validate(c) for c in
            db.query(GradeComponent).filter(GradeComponent.module_id == module_id).all()]


@router.post("/components", response_model=GradeComponentResponse, status_code=201)
async def create_grade_component(
    payload: GradeComponentCreate,
    current_user: User = Depends(get_teacher_or_above),
    db: Session = Depends(get_db),
):
    component = GradeComponent(**payload.model_dump())
    db.add(component)
    db.commit()
    db.refresh(component)
    return component


@router.delete("/components/{component_id}", status_code=204)
async def delete_grade_component(
    component_id: int,
    current_user: User = Depends(get_teacher_or_above),
    db: Session = Depends(get_db),
):
    component = db.query(GradeComponent).filter(GradeComponent.id == component_id).first()
    if not component:
        raise HTTPException(status_code=404, detail="Composante non trouvée")
    db.delete(component)
    db.commit()


# ─── Grades ─────────────────────────────────────────────────────────────────────

@router.get("/module/{module_id}", response_model=List[dict])
async def get_module_grades(
    module_id: int,
    academic_year_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_teacher_or_above),
):
    """Get all grades for a specific module."""
    query = db.query(Grade).filter(Grade.module_id == module_id)
    if academic_year_id:
        query = query.filter(Grade.academic_year_id == academic_year_id)
    grades = query.all()

    # Group by student
    student_grades = {}
    for g in grades:
        sid = g.student_id
        if sid not in student_grades:
            student_grades[sid] = {"student_id": sid, "grades": []}
        student_grades[sid]["grades"].append({
            "id": g.id,
            "component_id": g.component_id,
            "score": float(g.score) if g.score else None,
            "is_validated": g.is_validated,
        })

    return list(student_grades.values())


@router.get("/student/{student_profile_id}", response_model=List[dict])
async def get_student_grades(
    student_profile_id: int,
    academic_year_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all grades for a student."""
    # Students can only see their own grades
    if current_user.role == RoleEnum.student:
        profile = db.query(StudentProfile).filter(
            StudentProfile.user_id == current_user.id
        ).first()
        if not profile or profile.id != student_profile_id:
            raise HTTPException(status_code=403, detail="Accès refusé")

    query = db.query(Grade).filter(Grade.student_id == student_profile_id)
    if academic_year_id:
        query = query.filter(Grade.academic_year_id == academic_year_id)

    grades = query.all()
    result = []
    for g in grades:
        result.append({
            "id": g.id,
            "module_id": g.module_id,
            "component_id": g.component_id,
            "score": float(g.score) if g.score else None,
            "max_score": float(g.max_score) if g.max_score else 20,
            "is_validated": g.is_validated,
            "academic_year_id": g.academic_year_id,
        })
    return result


@router.post("/bulk", status_code=200)
async def submit_bulk_grades(
    payload: BulkGradeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_teacher_or_above),
):
    """Submit grades for multiple students in bulk."""
    # Verify the component belongs to the module
    component = db.query(GradeComponent).filter(
        GradeComponent.id == payload.component_id,
        GradeComponent.module_id == payload.module_id,
    ).first()
    if not component:
        raise HTTPException(status_code=404, detail="Composante non trouvée")

    created = 0
    updated = 0
    for entry in payload.grades:
        student_id = entry.get("student_id")
        score_val = entry.get("score")
        if score_val is not None:
            score = Decimal(str(score_val))
        else:
            score = None

        existing = db.query(Grade).filter(
            Grade.student_id == student_id,
            Grade.module_id == payload.module_id,
            Grade.component_id == payload.component_id,
            Grade.academic_year_id == payload.academic_year_id,
        ).first()

        if existing:
            existing.score = score
            existing.updated_at = datetime.utcnow()
            updated += 1
        else:
            grade = Grade(
                student_id=student_id,
                module_id=payload.module_id,
                component_id=payload.component_id,
                score=score,
                academic_year_id=payload.academic_year_id,
                semester_id=payload.semester_id,
            )
            db.add(grade)
            created += 1

    db.commit()
    log_action(db, current_user.id, "SUBMIT_GRADES", "Module", payload.module_id,
               f"Submitted {created + updated} grades")
    return {"message": f"{created} note(s) créée(s), {updated} note(s) mise(s) à jour"}


@router.post("/validate/{module_id}")
async def validate_module_grades(
    module_id: int,
    academic_year_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_dept_head_or_admin),
):
    """Validate all grades for a module (dept head only)."""
    grades = db.query(Grade).filter(
        Grade.module_id == module_id,
        Grade.academic_year_id == academic_year_id,
    ).all()

    validated_count = 0
    for grade in grades:
        if not grade.is_validated:
            grade.is_validated = True
            grade.validated_by = current_user.id
            grade.validated_at = datetime.utcnow()
            validated_count += 1

    db.commit()
    log_action(db, current_user.id, "VALIDATE_GRADES", "Module", module_id,
               f"Validated {validated_count} grades")
    return {"message": f"{validated_count} note(s) validée(s)"}


@router.post("/results/calculate")
async def calculate_module_results(
    module_id: int,
    academic_year_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_teacher_or_above),
):
    """Calculate and save module results (averages) for all students."""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module non trouvé")

    components = db.query(GradeComponent).filter(GradeComponent.module_id == module_id).all()
    if not components:
        raise HTTPException(status_code=400, detail="Aucune composante de note définie")

    # Get all students with grades in this module
    student_ids = db.query(Grade.student_id).filter(
        Grade.module_id == module_id,
        Grade.academic_year_id == academic_year_id,
    ).distinct().all()

    calculated = 0
    for (student_id,) in student_ids:
        grades_for_student = {}
        for comp in components:
            g = db.query(Grade).filter(
                Grade.student_id == student_id,
                Grade.module_id == module_id,
                Grade.component_id == comp.id,
                Grade.academic_year_id == academic_year_id,
            ).first()
            grades_for_student[comp.id] = {
                "score": g.score if g else None,
                "weight": comp.weight,
            }

        scores = [v["score"] for v in grades_for_student.values()]
        weights = [v["weight"] for v in grades_for_student.values()]
        average = calculate_weighted_average(scores, weights)

        passed = is_passing(average) if average is not None else False
        credits_earned = module.credits if passed else 0

        existing_result = db.query(ModuleResult).filter(
            ModuleResult.student_id == student_id,
            ModuleResult.module_id == module_id,
            ModuleResult.academic_year_id == academic_year_id,
        ).first()

        if existing_result:
            existing_result.average = average
            existing_result.is_passed = passed
            existing_result.credits_earned = credits_earned
        else:
            result = ModuleResult(
                student_id=student_id,
                module_id=module_id,
                academic_year_id=academic_year_id,
                average=average,
                is_passed=passed,
                credits_earned=credits_earned,
            )
            db.add(result)
        calculated += 1

    db.commit()
    return {"message": f"Résultats calculés pour {calculated} étudiant(s)"}


@router.get("/results/module/{module_id}", response_model=list)
async def get_module_results(
    module_id: int,
    academic_year_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_teacher_or_above),
):
    """Get all module results (averages) for a given module."""
    query = db.query(ModuleResult).filter(ModuleResult.module_id == module_id)
    if academic_year_id:
        query = query.filter(ModuleResult.academic_year_id == academic_year_id)
    results = query.all()

    out = []
    for r in results:
        student = db.query(StudentProfile).filter(StudentProfile.id == r.student_id).first()
        user = db.query(User).filter(User.id == student.user_id).first() if student else None
        out.append({
            "id": r.id,
            "module_id": r.module_id,
            "student_id": r.student_id,
            "student_name": f"{user.first_name} {user.last_name}" if user else "—",
            "student_matricule": student.student_id if student else "—",
            "average": float(r.average) if r.average is not None else None,
            "is_passed": r.is_passed,
            "credits_earned": r.credits_earned,
        })
    return out


@router.get("/transcript/{student_profile_id}", response_model=dict)
async def get_transcript_data(
    student_profile_id: int,
    academic_year_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get transcript data for a student."""
    profile = db.query(StudentProfile).filter(StudentProfile.id == student_profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil étudiant non trouvé")

    # Access control
    if current_user.role == RoleEnum.student:
        my_profile = db.query(StudentProfile).filter(
            StudentProfile.user_id == current_user.id
        ).first()
        if not my_profile or my_profile.id != student_profile_id:
            raise HTTPException(status_code=403, detail="Accès refusé")

    user = db.query(User).filter(User.id == profile.user_id).first()

    query = db.query(ModuleResult).filter(ModuleResult.student_id == student_profile_id)
    if academic_year_id:
        query = query.filter(ModuleResult.academic_year_id == academic_year_id)
    results = query.all()

    modules_data = []
    for r in results:
        module = db.query(Module).filter(Module.id == r.module_id).first()
        if module:
            modules_data.append({
                "id": module.id,
                "name": module.name,
                "code": module.code,
                "credits": module.credits,
                "coefficient": module.coefficient,
                "average": float(r.average) if r.average else None,
                "is_passed": r.is_passed,
                "credits_earned": r.credits_earned,
                "is_validated": r.is_validated,
            })

    academic_year = None
    if academic_year_id:
        year = db.query(AcademicYear).filter(AcademicYear.id == academic_year_id).first()
        academic_year = year.name if year else None

    return {
        "student_id": profile.id,
        "student_name": f"{user.first_name} {user.last_name}",
        "student_matricule": profile.student_id,
        "program": profile.program.name if profile.program else "N/A",
        "academic_year": academic_year or "Toutes les années",
        "modules": modules_data,
        "total_credits": sum(m["credits"] for m in modules_data),
        "credits_earned": sum(m["credits_earned"] for m in modules_data),
    }


@router.get("/pv/{module_id}")
async def get_pv_data(
    module_id: int,
    academic_year_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_teacher_or_above),
):
    """Get PV data for a module."""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module non trouvé")

    # Fallback to current academic year if not specified
    if not academic_year_id:
        current_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()
        if not current_year:
            current_year = db.query(AcademicYear).order_by(AcademicYear.id.desc()).first()
        if current_year:
            academic_year_id = current_year.id

    results = db.query(ModuleResult).filter(
        ModuleResult.module_id == module_id,
        ModuleResult.academic_year_id == academic_year_id,
    ).all()

    grades_list = []
    for r in results:
        profile = db.query(StudentProfile).filter(StudentProfile.id == r.student_id).first()
        user = db.query(User).filter(User.id == profile.user_id).first() if profile else None

        # Get individual component scores for CC/Exam
        cc_score = None
        exam_score = None
        cc_comp = db.query(GradeComponent).filter(
            GradeComponent.module_id == module_id,
            GradeComponent.component_type == "cc",
        ).first()
        exam_comp = db.query(GradeComponent).filter(
            GradeComponent.module_id == module_id,
            GradeComponent.component_type == "exam",
        ).first()
        if cc_comp:
            g = db.query(Grade).filter(
                Grade.student_id == r.student_id,
                Grade.component_id == cc_comp.id,
            ).first()
            if g:
                cc_score = float(g.score) if g.score else None
        if exam_comp:
            g = db.query(Grade).filter(
                Grade.student_id == r.student_id,
                Grade.component_id == exam_comp.id,
            ).first()
            if g:
                exam_score = float(g.score) if g.score else None

        grades_list.append({
            "student_id": profile.student_id if profile else "N/A",
            "student_name": f"{user.first_name} {user.last_name}" if user else "N/A",
            "cc": cc_score,
            "exam": exam_score,
            "average": float(r.average) if r.average else None,
            "is_passed": r.is_passed,
        })

    academic_year = db.query(AcademicYear).filter(AcademicYear.id == academic_year_id).first()
    return {
        "module": {"id": module.id, "name": module.name, "code": module.code},
        "academic_year": academic_year.name if academic_year else "N/A",
        "grades": grades_list,
    }


# ─── Thesis ─────────────────────────────────────────────────────────────────────

@router.get("/thesis/my", response_model=Optional[ThesisResponse])
async def get_my_thesis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil étudiant non trouvé")
    thesis = db.query(Thesis).filter(Thesis.student_id == profile.id).first()
    return ThesisResponse.model_validate(thesis) if thesis else None


@router.post("/thesis", response_model=ThesisResponse, status_code=201)
async def create_thesis(
    payload: ThesisCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    thesis = Thesis(**payload.model_dump())
    db.add(thesis)
    db.commit()
    db.refresh(thesis)
    return thesis


@router.put("/thesis/{thesis_id}", response_model=ThesisResponse)
async def update_thesis(
    thesis_id: int, payload: ThesisUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    thesis = db.query(Thesis).filter(Thesis.id == thesis_id).first()
    if not thesis:
        raise HTTPException(status_code=404, detail="Mémoire non trouvé")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(thesis, k, v)
    thesis.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(thesis)
    return thesis


# ─── Assignments ──────────────────────────────────────────────────────────────

@router.get("/assignments", response_model=list)
async def list_assignments(
    module_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Assignment)
    if current_user.role == RoleEnum.teacher:
        query = query.filter(Assignment.teacher_id == current_user.id)
    if module_id:
        query = query.filter(Assignment.module_id == module_id)
    assignments = query.order_by(Assignment.created_at.desc()).all()
    result = []
    for a in assignments:
        result.append({
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "module_id": a.module_id,
            "teacher_id": a.teacher_id,
            "due_date": a.due_date.isoformat() if a.due_date else None,
            "max_score": float(a.max_score) if a.max_score else 20,
            "is_active": a.is_active,
            "file_path": a.file_path,
            "submission_count": len(a.submissions),
            "created_at": a.created_at.isoformat(),
        })
    return result


@router.post("/assignments", status_code=201)
async def create_assignment(
    payload: dict,
    current_user: User = Depends(get_teacher_or_above),
    db: Session = Depends(get_db),
):
    from dateutil import parser as dtparser
    due_date = None
    if payload.get("due_date"):
        try:
            due_date = dtparser.parse(payload["due_date"])
        except Exception:
            due_date = None

    a = Assignment(
        title=payload["title"],
        description=payload.get("description", ""),
        module_id=payload["module_id"],
        teacher_id=current_user.id,
        due_date=due_date,
        max_score=Decimal(str(payload.get("max_score", 20))),
        is_active=payload.get("is_active", True),
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return {
        "id": a.id, "title": a.title, "module_id": a.module_id,
        "due_date": a.due_date.isoformat() if a.due_date else None,
        "max_score": float(a.max_score), "is_active": a.is_active,
    }


@router.put("/assignments/{assignment_id}", status_code=200)
async def update_assignment(
    assignment_id: int, payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    a = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Devoir non trouvé")
    if a.teacher_id != current_user.id and current_user.role not in [RoleEnum.super_admin, RoleEnum.dept_head]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    for k, v in payload.items():
        if hasattr(a, k):
            setattr(a, k, v)
    a.updated_at = datetime.utcnow()
    db.commit()
    return {"id": a.id, "is_active": a.is_active}


@router.post("/assignments/{assignment_id}/file", status_code=200)
async def upload_assignment_file(
    assignment_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_teacher_or_above),
    db: Session = Depends(get_db),
):
    a = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Devoir non trouvé")
    if a.teacher_id != current_user.id and current_user.role not in [RoleEnum.super_admin, RoleEnum.dept_head]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "bin"
    filename = f"assignment_{assignment_id}_{current_user.id}.{ext}"
    save_path = os.path.join(settings.UPLOAD_DIR, "assignments", filename)
    contents = await file.read()
    with open(save_path, "wb") as f:
        f.write(contents)
    a.file_path = f"/uploads/assignments/{filename}"
    a.updated_at = datetime.utcnow()
    db.commit()
    return {"id": a.id, "file_path": a.file_path}

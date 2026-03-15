from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, StudentProfile, RoleEnum
from app.models.academic import AcademicYear, Module
from app.models.grades import ModuleResult, Grade, GradeComponent, ComponentType
from app.core.deps import get_current_user, get_teacher_or_above
from app.services.pdf_service import generate_transcript, generate_pv

router = APIRouter()


@router.get("/transcript/{student_profile_id}")
async def download_transcript(
    student_profile_id: int,
    academic_year_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate and download a student transcript as PDF."""
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

    # Get module results
    query = db.query(ModuleResult).filter(ModuleResult.student_id == student_profile_id)
    if academic_year_id:
        query = query.filter(ModuleResult.academic_year_id == academic_year_id)
    results = query.all()

    modules_data = []
    for r in results:
        module = db.query(Module).filter(Module.id == r.module_id).first()
        if module:
            modules_data.append({
                "name": module.name,
                "code": module.code,
                "credits": module.credits,
                "coefficient": module.coefficient,
                "average": r.average,
                "is_passed": r.is_passed,
                "credits_earned": r.credits_earned,
            })

    academic_year = "Toutes les années"
    if academic_year_id:
        yr = db.query(AcademicYear).filter(AcademicYear.id == academic_year_id).first()
        if yr:
            academic_year = yr.name

    student_dict = {
        "first_name": user.first_name,
        "last_name": user.last_name,
        "student_id": profile.student_id,
        "date_of_birth": str(profile.date_of_birth) if profile.date_of_birth else "N/A",
    }

    program_name = profile.program.name if profile.program else "N/A"

    pdf_bytes = generate_transcript(
        student=student_dict,
        modules=modules_data,
        program_name=program_name,
        academic_year=academic_year,
    )

    filename = f"releve_{profile.student_id}_{academic_year.replace('/', '-')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/pv/{module_id}")
async def download_pv(
    module_id: int,
    academic_year_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_teacher_or_above),
):
    """Generate and download a PV PDF for a module."""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module non trouvé")

    # Fallback to current academic year
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

    if not results:
        raise HTTPException(status_code=404, detail="Aucun résultat trouvé. Calculez d'abord les moyennes.")

    grades_list = []
    for r in results:
        profile = db.query(StudentProfile).filter(StudentProfile.id == r.student_id).first()
        student_user = db.query(User).filter(User.id == profile.user_id).first() if profile else None

        cc_comp = db.query(GradeComponent).filter(
            GradeComponent.module_id == module_id,
            GradeComponent.component_type == ComponentType.cc,
        ).first()
        exam_comp = db.query(GradeComponent).filter(
            GradeComponent.module_id == module_id,
            GradeComponent.component_type == ComponentType.exam,
        ).first()

        cc_score = None
        exam_score = None
        if cc_comp:
            g = db.query(Grade).filter(
                Grade.student_id == r.student_id,
                Grade.component_id == cc_comp.id,
                Grade.academic_year_id == academic_year_id,
            ).first()
            cc_score = float(g.score) if g and g.score else None
        if exam_comp:
            g = db.query(Grade).filter(
                Grade.student_id == r.student_id,
                Grade.component_id == exam_comp.id,
                Grade.academic_year_id == academic_year_id,
            ).first()
            exam_score = float(g.score) if g and g.score else None

        grades_list.append({
            "student_id": profile.student_id if profile else "N/A",
            "student_name": f"{student_user.first_name} {student_user.last_name}" if student_user else "N/A",
            "cc": cc_score,
            "exam": exam_score,
            "average": r.average,
            "is_passed": r.is_passed,
        })

    # Sort by average descending (highest first), students without average at the end
    grades_list.sort(key=lambda x: (x["average"] is None, -(x["average"] or 0)))

    academic_year_obj = db.query(AcademicYear).filter(AcademicYear.id == academic_year_id).first()
    academic_year = academic_year_obj.name if academic_year_obj else "N/A"

    module_dict = {"name": module.name, "code": module.code}

    pdf_bytes = generate_pv(
        module=module_dict,
        grades_list=grades_list,
        academic_year=academic_year,
    )

    filename = f"pv_{module.code}_{academic_year.replace('/', '-')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.user import User, StudentProfile, TeacherProfile, RoleEnum
from app.models.academic import (
    Faculty, Department, Program, AcademicYear, Semester,
    Cohort, Module, TeachingAssignment, Enrollment
)
from app.core.deps import get_current_user, get_admin, get_dept_head_or_admin, log_action
from app.schemas.academic import (
    FacultyCreate, FacultyUpdate, FacultyResponse,
    DepartmentCreate, DepartmentUpdate, DepartmentResponse,
    ProgramCreate, ProgramUpdate, ProgramResponse,
    AcademicYearCreate, AcademicYearUpdate, AcademicYearResponse,
    SemesterCreate, SemesterUpdate, SemesterResponse,
    CohortCreate, CohortUpdate, CohortResponse,
    ModuleCreate, ModuleUpdate, ModuleResponse,
    TeachingAssignmentCreate, TeachingAssignmentResponse,
    EnrollmentCreate, EnrollmentResponse,
    DashboardStats,
)
from app.utils.helpers import paginate

router = APIRouter()


# ─── Dashboard Stats ────────────────────────────────────────────────────────────

@router.get("/dashboard-stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()
    return DashboardStats(
        total_students=db.query(User).filter(User.role == RoleEnum.student).count(),
        total_teachers=db.query(User).filter(User.role == RoleEnum.teacher).count(),
        total_programs=db.query(Program).filter(Program.is_active == True).count(),
        total_modules=db.query(Module).filter(Module.is_active == True).count(),
        total_cohorts=db.query(Cohort).count(),
        active_academic_year=current_year.name if current_year else None,
        enrollments_count=db.query(Enrollment).count(),
    )


# ─── Faculties ──────────────────────────────────────────────────────────────────

@router.get("/faculties", response_model=list)
async def list_faculties(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return [FacultyResponse.model_validate(f) for f in db.query(Faculty).all()]


@router.post("/faculties", response_model=FacultyResponse, status_code=201)
async def create_faculty(
    payload: FacultyCreate,
    current_user: User = Depends(get_admin),
    db: Session = Depends(get_db),
):
    existing = db.query(Faculty).filter(Faculty.code == payload.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Code de faculté déjà utilisé")
    faculty = Faculty(name=payload.name, code=payload.code.upper(), description=payload.description)
    db.add(faculty)
    db.commit()
    db.refresh(faculty)
    return faculty


@router.put("/faculties/{faculty_id}", response_model=FacultyResponse)
async def update_faculty(
    faculty_id: int, payload: FacultyUpdate,
    current_user: User = Depends(get_admin), db: Session = Depends(get_db),
):
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculté non trouvée")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(faculty, k, v)
    db.commit()
    db.refresh(faculty)
    return faculty


@router.delete("/faculties/{faculty_id}", status_code=204)
async def delete_faculty(
    faculty_id: int, current_user: User = Depends(get_admin), db: Session = Depends(get_db),
):
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculté non trouvée")
    db.delete(faculty)
    db.commit()


# ─── Departments ────────────────────────────────────────────────────────────────

@router.get("/departments", response_model=list)
async def list_departments(
    faculty_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Department)
    if faculty_id:
        query = query.filter(Department.faculty_id == faculty_id)
    return [DepartmentResponse.model_validate(d) for d in query.all()]


@router.post("/departments", response_model=DepartmentResponse, status_code=201)
async def create_department(
    payload: DepartmentCreate,
    current_user: User = Depends(get_admin), db: Session = Depends(get_db),
):
    dept = Department(**payload.model_dump())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@router.put("/departments/{dept_id}", response_model=DepartmentResponse)
async def update_department(
    dept_id: int, payload: DepartmentUpdate,
    current_user: User = Depends(get_admin), db: Session = Depends(get_db),
):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Département non trouvé")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(dept, k, v)
    db.commit()
    db.refresh(dept)
    return dept


@router.delete("/departments/{dept_id}", status_code=204)
async def delete_department(
    dept_id: int, current_user: User = Depends(get_admin), db: Session = Depends(get_db),
):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Département non trouvé")
    db.delete(dept)
    db.commit()


# ─── Programs ───────────────────────────────────────────────────────────────────

@router.get("/programs", response_model=list)
async def list_programs(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Program)
    if department_id:
        query = query.filter(Program.department_id == department_id)
    return [ProgramResponse.model_validate(p) for p in query.all()]


@router.post("/programs", response_model=ProgramResponse, status_code=201)
async def create_program(
    payload: ProgramCreate,
    current_user: User = Depends(get_admin), db: Session = Depends(get_db),
):
    program = Program(**payload.model_dump())
    db.add(program)
    db.commit()
    db.refresh(program)
    return program


@router.put("/programs/{program_id}", response_model=ProgramResponse)
async def update_program(
    program_id: int, payload: ProgramUpdate,
    current_user: User = Depends(get_admin), db: Session = Depends(get_db),
):
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Programme non trouvé")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(program, k, v)
    db.commit()
    db.refresh(program)
    return program


# ─── Program → Modules & Specialties ───────────────────────────────────────────

@router.get("/programs/{program_id}/modules", response_model=list)
async def get_program_modules(
    program_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Programme non trouvé")
    modules = db.query(Module).filter(Module.program_id == program_id).order_by(Module.specialty, Module.name).all()
    return [ModuleResponse.model_validate(m) for m in modules]


@router.get("/programs/{program_id}/specialties", response_model=list)
async def get_program_specialties(
    program_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retourne la liste des spécialités distinctes du programme (hors null)."""
    rows = (
        db.query(Module.specialty)
        .filter(Module.program_id == program_id, Module.specialty.isnot(None))
        .distinct()
        .order_by(Module.specialty)
        .all()
    )
    return [r[0] for r in rows]


@router.get("/programs/{program_id}/students", response_model=list)
async def get_program_students(
    program_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.schemas.user import StudentResponse
    students = (
        db.query(User)
        .join(StudentProfile, User.id == StudentProfile.user_id)
        .options(joinedload(User.student_profile))
        .filter(StudentProfile.program_id == program_id)
        .order_by(User.last_name)
        .all()
    )
    return [StudentResponse.model_validate(s) for s in students]


@router.patch("/students/{student_id}/specialty")
async def set_student_specialty(
    student_id: int,
    payload: dict,
    current_user: User = Depends(get_dept_head_or_admin),
    db: Session = Depends(get_db),
):
    """Orienter un étudiant vers une spécialité."""
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == student_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Étudiant non trouvé")
    profile.specialty = payload.get("specialty")
    db.commit()
    return {"id": student_id, "specialty": profile.specialty}


# ─── Academic Years ─────────────────────────────────────────────────────────────

@router.get("/academic-years", response_model=list)
async def list_academic_years(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    return [AcademicYearResponse.model_validate(y) for y in db.query(AcademicYear).order_by(AcademicYear.name.desc()).all()]


@router.get("/academic-years/current", response_model=AcademicYearResponse)
async def get_current_academic_year(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()
    if not year:
        raise HTTPException(status_code=404, detail="Aucune année académique active")
    return year


@router.post("/academic-years", response_model=AcademicYearResponse, status_code=201)
async def create_academic_year(
    payload: AcademicYearCreate,
    current_user: User = Depends(get_admin), db: Session = Depends(get_db),
):
    if payload.is_current:
        db.query(AcademicYear).update({"is_current": False})
    year = AcademicYear(**payload.model_dump())
    db.add(year)
    db.commit()
    db.refresh(year)
    return year


@router.put("/academic-years/{year_id}", response_model=AcademicYearResponse)
async def update_academic_year(
    year_id: int, payload: AcademicYearUpdate,
    current_user: User = Depends(get_admin), db: Session = Depends(get_db),
):
    year = db.query(AcademicYear).filter(AcademicYear.id == year_id).first()
    if not year:
        raise HTTPException(status_code=404, detail="Année académique non trouvée")
    if payload.is_current:
        db.query(AcademicYear).update({"is_current": False})
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(year, k, v)
    db.commit()
    db.refresh(year)
    return year


# ─── Semesters ──────────────────────────────────────────────────────────────────

@router.get("/semesters", response_model=list)
async def list_semesters(
    academic_year_id: Optional[int] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    query = db.query(Semester)
    if academic_year_id:
        query = query.filter(Semester.academic_year_id == academic_year_id)
    return [SemesterResponse.model_validate(s) for s in query.all()]


@router.post("/semesters", response_model=SemesterResponse, status_code=201)
async def create_semester(
    payload: SemesterCreate,
    current_user: User = Depends(get_admin), db: Session = Depends(get_db),
):
    sem = Semester(**payload.model_dump())
    db.add(sem)
    db.commit()
    db.refresh(sem)
    return sem


# ─── Cohorts ────────────────────────────────────────────────────────────────────

@router.get("/cohorts", response_model=list)
async def list_cohorts(
    program_id: Optional[int] = None,
    academic_year_id: Optional[int] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    query = db.query(Cohort)
    if program_id:
        query = query.filter(Cohort.program_id == program_id)
    if academic_year_id:
        query = query.filter(Cohort.academic_year_id == academic_year_id)
    return [CohortResponse.model_validate(c) for c in query.all()]


@router.post("/cohorts", response_model=CohortResponse, status_code=201)
async def create_cohort(
    payload: CohortCreate,
    current_user: User = Depends(get_dept_head_or_admin), db: Session = Depends(get_db),
):
    cohort = Cohort(**payload.model_dump())
    db.add(cohort)
    db.commit()
    db.refresh(cohort)
    return cohort


@router.get("/cohorts/{cohort_id}", response_model=CohortResponse)
async def get_cohort(
    cohort_id: int,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    cohort = db.query(Cohort).filter(Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Promotion non trouvée")
    return cohort


@router.put("/cohorts/{cohort_id}", response_model=CohortResponse)
async def update_cohort(
    cohort_id: int, payload: CohortUpdate,
    current_user: User = Depends(get_dept_head_or_admin), db: Session = Depends(get_db),
):
    cohort = db.query(Cohort).filter(Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Promotion non trouvée")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(cohort, k, v)
    db.commit()
    db.refresh(cohort)
    return cohort


@router.get("/cohorts/{cohort_id}/students", response_model=list)
async def get_cohort_students(
    cohort_id: int,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    from app.schemas.user import StudentResponse
    students = (
        db.query(User)
        .join(StudentProfile, User.id == StudentProfile.user_id)
        .filter(StudentProfile.cohort_id == cohort_id)
        .all()
    )
    return [StudentResponse.model_validate(s) for s in students]


# ─── Modules ────────────────────────────────────────────────────────────────────

@router.get("/modules", response_model=list)
async def list_modules(
    program_id: Optional[int] = None,
    semester_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    query = db.query(Module)
    if program_id:
        query = query.filter(Module.program_id == program_id)
    if semester_id:
        query = query.filter(Module.semester_id == semester_id)
    if is_active is not None:
        query = query.filter(Module.is_active == is_active)
    return [ModuleResponse.model_validate(m) for m in query.order_by(Module.name).all()]


@router.get("/modules/{module_id}", response_model=ModuleResponse)
async def get_module(
    module_id: int,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module non trouvé")
    return module


@router.post("/modules", response_model=ModuleResponse, status_code=201)
async def create_module(
    payload: ModuleCreate,
    current_user: User = Depends(get_dept_head_or_admin), db: Session = Depends(get_db),
):
    existing = db.query(Module).filter(Module.code == payload.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Code de module déjà utilisé")
    module = Module(**{**payload.model_dump(), "code": payload.code.upper()})
    db.add(module)
    db.commit()
    db.refresh(module)
    return module


@router.put("/modules/{module_id}", response_model=ModuleResponse)
async def update_module(
    module_id: int, payload: ModuleUpdate,
    current_user: User = Depends(get_dept_head_or_admin), db: Session = Depends(get_db),
):
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module non trouvé")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(module, k, v)
    db.commit()
    db.refresh(module)
    return module


@router.delete("/modules/{module_id}", status_code=204)
async def delete_module(
    module_id: int, current_user: User = Depends(get_admin), db: Session = Depends(get_db),
):
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module non trouvé")
    db.delete(module)
    db.commit()


# ─── Teaching Assignments ───────────────────────────────────────────────────────

@router.post("/modules/{module_id}/assign-teacher", response_model=TeachingAssignmentResponse, status_code=201)
async def assign_teacher_to_module(
    module_id: int,
    payload: TeachingAssignmentCreate,
    current_user: User = Depends(get_dept_head_or_admin),
    db: Session = Depends(get_db),
):
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module non trouvé")
    assignment = TeachingAssignment(
        teacher_id=payload.teacher_id,
        module_id=module_id,
        academic_year_id=payload.academic_year_id,
        is_primary=payload.is_primary,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.get("/modules/{module_id}/teachers", response_model=list)
async def get_module_teachers(
    module_id: int,
    academic_year_id: Optional[int] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    query = db.query(TeachingAssignment).filter(TeachingAssignment.module_id == module_id)
    if academic_year_id:
        query = query.filter(TeachingAssignment.academic_year_id == academic_year_id)
    return [TeachingAssignmentResponse.model_validate(a) for a in query.all()]


# ─── Enrollments ────────────────────────────────────────────────────────────────

@router.post("/enrollments", response_model=EnrollmentResponse, status_code=201)
async def create_enrollment(
    payload: EnrollmentCreate,
    current_user: User = Depends(get_dept_head_or_admin),
    db: Session = Depends(get_db),
):
    from app.models.academic import Enrollment
    enrollment = Enrollment(**payload.model_dump())
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


# ─── Teacher's Modules ──────────────────────────────────────────────────────────

@router.get("/my-modules", response_model=list)
async def get_my_modules(
    academic_year_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get modules assigned to the current teacher."""
    if current_user.role != RoleEnum.teacher:
        raise HTTPException(status_code=403, detail="Réservé aux enseignants")

    query = (
        db.query(Module)
        .join(TeachingAssignment, Module.id == TeachingAssignment.module_id)
        .filter(TeachingAssignment.teacher_id == current_user.id)
    )
    if academic_year_id:
        query = query.filter(TeachingAssignment.academic_year_id == academic_year_id)
    return [ModuleResponse.model_validate(m) for m in query.all()]


# ─── Student's Modules ──────────────────────────────────────────────────────────

@router.get("/modules/{module_id}/students", response_model=list)
async def get_module_students(
    module_id: int,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    """Get students enrolled in a specific module (via cohort)."""
    from app.schemas.user import StudentResponse
    from app.models.academic import ModuleEnrollment
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module non trouvé")
    students = (
        db.query(User)
        .join(StudentProfile, User.id == StudentProfile.user_id)
        .join(ModuleEnrollment, StudentProfile.id == ModuleEnrollment.student_id)
        .filter(ModuleEnrollment.module_id == module_id)
        .all()
    )
    if not students and module.program_id:
        # Fallback: return students in any cohort for this program
        students = (
            db.query(User)
            .join(StudentProfile, User.id == StudentProfile.user_id)
            .filter(StudentProfile.program_id == module.program_id)
            .all()
        )
    return [StudentResponse.model_validate(s) for s in students]


@router.get("/my-enrolled-modules", response_model=list)
async def get_my_enrolled_modules(
    academic_year_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get modules the current student is enrolled in."""
    if current_user.role != RoleEnum.student:
        raise HTTPException(status_code=403, detail="Réservé aux étudiants")

    from app.models.academic import ModuleEnrollment
    query = (
        db.query(Module)
        .join(ModuleEnrollment, Module.id == ModuleEnrollment.module_id)
        .filter(ModuleEnrollment.student_id == current_user.id)
    )
    if academic_year_id:
        query = query.filter(ModuleEnrollment.academic_year_id == academic_year_id)
    return [ModuleResponse.model_validate(m) for m in query.all()]

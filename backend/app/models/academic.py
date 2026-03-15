import enum
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, ForeignKey,
    Integer, String, Text, Date, Time
)
from sqlalchemy.orm import relationship

from app.database import Base


class DegreeType(str, enum.Enum):
    licence = "licence"
    master = "master"
    doctorat = "doctorat"
    dut = "dut"
    bts = "bts"


class ScheduleType(str, enum.Enum):
    course = "course"
    td = "td"
    tp = "tp"
    exam = "exam"
    other = "other"


class Faculty(Base):
    __tablename__ = "faculties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    departments = relationship("Department", back_populates="faculty")


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculties.id"), nullable=False)
    head_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    faculty = relationship("Faculty", back_populates="departments")
    head = relationship("User", foreign_keys=[head_id])
    programs = relationship("Program", back_populates="department")
    teachers = relationship("TeacherProfile", back_populates="department")


class Program(Base):
    __tablename__ = "programs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    degree_type = Column(Enum(DegreeType), nullable=False)
    duration_years = Column(Integer, default=2)
    level = Column(Integer, nullable=True)  # 1=M1, 2=M2 — pour l'orientation par spécialité
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department", back_populates="programs")
    cohorts = relationship("Cohort", back_populates="program")
    modules = relationship("Module", back_populates="program")
    students = relationship("StudentProfile", back_populates="program")
    announcements = relationship("Announcement", back_populates="program")


class AcademicYear(Base):
    __tablename__ = "academic_years"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), nullable=False)  # e.g., "2024-2025"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_current = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    semesters = relationship("Semester", back_populates="academic_year")
    cohorts = relationship("Cohort", back_populates="academic_year")
    enrollments = relationship("Enrollment", back_populates="academic_year")
    students = relationship("StudentProfile", back_populates="academic_year")
    teaching_assignments = relationship("TeachingAssignment", back_populates="academic_year")
    schedules = relationship("Schedule", back_populates="academic_year")


class Semester(Base):
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # e.g., "Semestre 1 - 2024-2025"
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    number = Column(Integer, nullable=False)  # 1 or 2
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=False)

    academic_year = relationship("AcademicYear", back_populates="semesters")
    modules = relationship("Module", back_populates="semester")
    grades = relationship("Grade", back_populates="semester")


class Cohort(Base):
    __tablename__ = "cohorts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)  # e.g., "Promotion 2024 - Master SP"
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    max_students = Column(Integer, default=50)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    program = relationship("Program", back_populates="cohorts")
    academic_year = relationship("AcademicYear", back_populates="cohorts")
    enrollments = relationship("Enrollment", back_populates="cohort")
    students = relationship("StudentProfile", back_populates="cohort")
    schedules = relationship("Schedule", back_populates="cohort")
    announcements = relationship("Announcement", back_populates="cohort")


class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    credits = Column(Integer, default=3)
    coefficient = Column(Integer, default=1)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=True)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=True)
    specialty = Column(String(100), nullable=True)  # spécialité (null = tronc commun)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    semester = relationship("Semester", back_populates="modules")
    program = relationship("Program", back_populates="modules")
    teaching_assignments = relationship("TeachingAssignment", back_populates="module")
    grade_components = relationship("GradeComponent", back_populates="module", cascade="all, delete-orphan")
    grades = relationship("Grade", back_populates="module")
    module_results = relationship("ModuleResult", back_populates="module")
    course_documents = relationship("CourseDocument", back_populates="module")
    schedules = relationship("Schedule", back_populates="module")
    assignments = relationship("Assignment", back_populates="module")
    announcements = relationship("Announcement", back_populates="module")
    module_enrollments = relationship("ModuleEnrollment", back_populates="module")


class TeachingAssignment(Base):
    __tablename__ = "teaching_assignments"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    is_primary = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    teacher = relationship("User", foreign_keys=[teacher_id])
    module = relationship("Module", back_populates="teaching_assignments")
    academic_year = relationship("AcademicYear", back_populates="teaching_assignments")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    cohort_id = Column(Integer, ForeignKey("cohorts.id"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="active")

    student_profile = relationship("StudentProfile", back_populates="enrollments")
    cohort = relationship("Cohort", back_populates="enrollments")
    academic_year = relationship("AcademicYear", back_populates="enrollments")


class ModuleEnrollment(Base):
    __tablename__ = "module_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    enrolled_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", foreign_keys=[student_id])
    module = relationship("Module", back_populates="module_enrollments")
    academic_year = relationship("AcademicYear")


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cohort_id = Column(Integer, ForeignKey("cohorts.id"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    room = Column(String(100), nullable=True)
    meeting_link = Column(String(500), nullable=True)
    schedule_type = Column(Enum(ScheduleType), default=ScheduleType.course)
    created_at = Column(DateTime, default=datetime.utcnow)

    module = relationship("Module", back_populates="schedules")
    teacher = relationship("User", foreign_keys=[teacher_id])
    cohort = relationship("Cohort", back_populates="schedules")
    academic_year = relationship("AcademicYear", back_populates="schedules")

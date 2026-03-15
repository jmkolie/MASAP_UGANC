import enum
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, ForeignKey,
    Integer, String, Text, Numeric, Date
)
from sqlalchemy.orm import relationship

from app.database import Base


class ComponentType(str, enum.Enum):
    cc = "cc"           # Contrôle continu
    exam = "exam"       # Examen final
    rattrapage = "rattrapage"
    tp = "tp"
    project = "project"
    oral = "oral"


class ThesisStatus(str, enum.Enum):
    proposed = "proposed"
    approved = "approved"
    in_progress = "in_progress"
    submitted = "submitted"
    defended = "defended"
    completed = "completed"


class InternshipStatus(str, enum.Enum):
    planned = "planned"
    ongoing = "ongoing"
    completed = "completed"
    cancelled = "cancelled"


class GradeComponent(Base):
    __tablename__ = "grade_components"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    weight = Column(Numeric(5, 2), nullable=False)  # percentage, e.g. 40.00
    component_type = Column(Enum(ComponentType), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    module = relationship("Module", back_populates="grade_components")
    grades = relationship("Grade", back_populates="component", cascade="all, delete-orphan")


class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    component_id = Column(Integer, ForeignKey("grade_components.id"), nullable=False)
    score = Column(Numeric(5, 2), nullable=True)
    max_score = Column(Numeric(5, 2), default=20)
    is_validated = Column(Boolean, default=False)
    validated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    validated_at = Column(DateTime, nullable=True)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("StudentProfile", back_populates="grades", foreign_keys=[student_id])
    module = relationship("Module", back_populates="grades")
    component = relationship("GradeComponent", back_populates="grades")
    validator = relationship("User", foreign_keys=[validated_by])
    academic_year = relationship("AcademicYear")
    semester = relationship("Semester", back_populates="grades")


class ModuleResult(Base):
    __tablename__ = "module_results"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    average = Column(Numeric(5, 2), nullable=True)
    is_validated = Column(Boolean, default=False)
    validated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    validated_at = Column(DateTime, nullable=True)
    is_passed = Column(Boolean, nullable=True)
    credits_earned = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("StudentProfile", back_populates="module_results", foreign_keys=[student_id])
    module = relationship("Module", back_populates="module_results")
    academic_year = relationship("AcademicYear")
    validator = relationship("User", foreign_keys=[validated_by])


class Thesis(Base):
    __tablename__ = "theses"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    title = Column(String(500), nullable=False)
    supervisor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    co_supervisor = Column(String(255), nullable=True)
    status = Column(Enum(ThesisStatus), default=ThesisStatus.proposed)
    description = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    defended_at = Column(DateTime, nullable=True)
    grade = Column(Numeric(5, 2), nullable=True)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("StudentProfile", back_populates="thesis")
    supervisor = relationship("User", foreign_keys=[supervisor_id])
    academic_year = relationship("AcademicYear")


class Internship(Base):
    __tablename__ = "internships"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    company_name = Column(String(255), nullable=False)
    supervisor_name = Column(String(255), nullable=True)
    supervisor_contact = Column(String(255), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    description = Column(Text, nullable=True)
    status = Column(Enum(InternshipStatus), default=InternshipStatus.planned)
    report_path = Column(String(500), nullable=True)
    grade = Column(Numeric(5, 2), nullable=True)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("StudentProfile", back_populates="internships")
    academic_year = relationship("AcademicYear")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    due_date = Column(DateTime, nullable=True)
    max_score = Column(Numeric(5, 2), default=20)
    file_path = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    module = relationship("Module", back_populates="assignments")
    teacher = relationship("User", foreign_keys=[teacher_id])
    submissions = relationship("AssignmentSubmission", back_populates="assignment", cascade="all, delete-orphan")


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    file_path = Column(String(500), nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    score = Column(Numeric(5, 2), nullable=True)
    feedback = Column(Text, nullable=True)
    graded_at = Column(DateTime, nullable=True)
    graded_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("StudentProfile", back_populates="assignment_submissions")
    grader = relationship("User", foreign_keys=[graded_by])

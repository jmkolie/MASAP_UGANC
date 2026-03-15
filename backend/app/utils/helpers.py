from datetime import datetime
from typing import List, Optional
from decimal import Decimal
from sqlalchemy.orm import Session


def generate_student_id(db: Session) -> str:
    """Generate unique student matricule like SP-2024-0001"""
    from app.models.user import StudentProfile
    year = datetime.now().year
    prefix = f"SP-{year}-"
    count = db.query(StudentProfile).filter(
        StudentProfile.student_id.like(f"{prefix}%")
    ).count()
    return f"{prefix}{(count + 1):04d}"


def generate_teacher_id(db: Session) -> str:
    """Generate unique teacher ID like ENS-2024-0001"""
    from app.models.user import TeacherProfile
    year = datetime.now().year
    prefix = f"ENS-{year}-"
    count = db.query(TeacherProfile).filter(
        TeacherProfile.teacher_id.like(f"{prefix}%")
    ).count()
    return f"{prefix}{(count + 1):04d}"


def calculate_weighted_average(
    scores: List[Optional[Decimal]],
    weights: List[Decimal],
) -> Optional[Decimal]:
    """
    Calculate weighted average.
    scores: list of scores (can be None for missing)
    weights: list of weights (must sum to 100)
    Returns None if no scores available.
    """
    if not scores or not weights:
        return None

    total_weight = Decimal("0")
    weighted_sum = Decimal("0")

    for score, weight in zip(scores, weights):
        if score is not None:
            weighted_sum += score * (weight / Decimal("100"))
            total_weight += weight / Decimal("100")

    if total_weight == 0:
        return None

    # Normalize to actual weight provided
    if total_weight > 0:
        return (weighted_sum / total_weight).quantize(Decimal("0.01"))
    return None


def paginate(query, page: int = 1, per_page: int = 20) -> dict:
    """Apply pagination to a SQLAlchemy query"""
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
    }


def get_grade_mention(average: Optional[Decimal]) -> str:
    """Return French academic mention for a grade"""
    if average is None:
        return "N/A"
    avg = float(average)
    if avg >= 16:
        return "Très Bien"
    elif avg >= 14:
        return "Bien"
    elif avg >= 12:
        return "Assez Bien"
    elif avg >= 10:
        return "Passable"
    else:
        return "Insuffisant"


def is_passing(average: Optional[Decimal], pass_threshold: Decimal = Decimal("10")) -> bool:
    """Check if a grade is passing"""
    if average is None:
        return False
    return average >= pass_threshold

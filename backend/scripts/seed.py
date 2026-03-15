"""
Seed script for MASAP-UGANC Portal.
Creates realistic demo data for a Master en Santé Publique program.

Run with: python -m scripts.seed
"""
import sys
import os
import random
from datetime import date, datetime, timedelta
from decimal import Decimal

# Add the backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models.user import User, StudentProfile, TeacherProfile, RoleEnum, EnrollmentStatus
from app.models.academic import (
    Faculty, Department, Program, AcademicYear, Semester,
    Cohort, Module, TeachingAssignment, Enrollment, ModuleEnrollment, Schedule,
    DegreeType, ScheduleType,
)
from app.models.grades import (
    GradeComponent, Grade, ModuleResult, ComponentType, Thesis, ThesisStatus
)
from app.models.communication import Announcement, AudienceType
from app.core.security import get_password_hash


def seed_database():
    print("🌱 Initialisation de la base de données...")

    # Create tables
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("✅ Base de données déjà initialisée. Seed ignoré.")
            return

        print("📚 Création des facultés et départements...")

        # ─── Faculty ─────────────────────────────────────────────────────────
        faculty = Faculty(
            name="Faculté des Sciences de la Santé",
            code="FSS",
            description="La Faculté des Sciences de la Santé forme des professionnels et chercheurs en santé publique, épidémiologie et sciences biomédicales.",
        )
        db.add(faculty)
        db.flush()

        # ─── Departments ──────────────────────────────────────────────────────
        dept_sp = Department(
            name="Département de Santé Publique",
            code="DSP",
            faculty_id=faculty.id,
            description="Formation en santé publique, épidémiologie et biostatistiques.",
        )
        dept_epi = Department(
            name="Département d'Épidémiologie et Recherche",
            code="DER",
            faculty_id=faculty.id,
            description="Recherche épidémiologique et méthodes quantitatives.",
        )
        db.add_all([dept_sp, dept_epi])
        db.flush()

        # ─── Programs ─────────────────────────────────────────────────────────
        prog_m1 = Program(
            name="Master 1 — Santé Publique",
            code="MSP-M1",
            department_id=dept_sp.id,
            degree_type=DegreeType.master,
            duration_years=1,
            description="Première année du Master en Santé Publique. Bases théoriques et méthodologiques.",
            is_active=True,
        )
        prog_m2 = Program(
            name="Master 2 — Santé Publique",
            code="MSP-M2",
            department_id=dept_sp.id,
            degree_type=DegreeType.master,
            duration_years=1,
            description="Deuxième année du Master en Santé Publique. Spécialisation et mémoire de recherche.",
            is_active=True,
        )
        db.add_all([prog_m1, prog_m2])
        db.flush()

        # ─── Academic Years ───────────────────────────────────────────────────
        year_2324 = AcademicYear(
            name="2023-2024",
            start_date=date(2023, 9, 1),
            end_date=date(2024, 7, 31),
            is_current=False,
        )
        year_2425 = AcademicYear(
            name="2024-2025",
            start_date=date(2024, 9, 1),
            end_date=date(2025, 7, 31),
            is_current=True,
        )
        db.add_all([year_2324, year_2425])
        db.flush()

        # ─── Semesters ────────────────────────────────────────────────────────
        sem1_2425 = Semester(
            name="Semestre 1 — 2024-2025",
            academic_year_id=year_2425.id,
            number=1,
            start_date=date(2024, 9, 15),
            end_date=date(2025, 1, 31),
            is_active=False,
        )
        sem2_2425 = Semester(
            name="Semestre 2 — 2024-2025",
            academic_year_id=year_2425.id,
            number=2,
            start_date=date(2025, 2, 10),
            end_date=date(2025, 6, 30),
            is_active=True,
        )
        sem1_2324 = Semester(
            name="Semestre 1 — 2023-2024",
            academic_year_id=year_2324.id,
            number=1,
            start_date=date(2023, 9, 15),
            end_date=date(2024, 1, 31),
            is_active=False,
        )
        sem2_2324 = Semester(
            name="Semestre 2 — 2023-2024",
            academic_year_id=year_2324.id,
            number=2,
            start_date=date(2024, 2, 10),
            end_date=date(2024, 6, 30),
            is_active=False,
        )
        db.add_all([sem1_2425, sem2_2425, sem1_2324, sem2_2324])
        db.flush()

        # ─── Admin user ────────────────────────────────────────────────────────
        print("👤 Création des utilisateurs administrateurs...")
        admin = User(
            email="admin@masap.edu",
            hashed_password=get_password_hash("Admin@2024!"),
            first_name="Moussa",
            last_name="ADMIN",
            role=RoleEnum.super_admin,
            is_active=True,
            is_verified=True,
        )
        db.add(admin)
        db.flush()

        # Dept head
        chef = User(
            email="chef.dept@masap.edu",
            hashed_password=get_password_hash("Chef@2024!"),
            first_name="Fatoumata",
            last_name="KOUYATÉ",
            role=RoleEnum.dept_head,
            is_active=True,
            is_verified=True,
        )
        db.add(chef)
        db.flush()

        # Update departments with head
        dept_sp.head_id = chef.id

        # Scolarité
        scol = User(
            email="scolarite@masap.edu",
            hashed_password=get_password_hash("Scol@2024!"),
            first_name="Amadou",
            last_name="BARRY",
            role=RoleEnum.scolarite,
            is_active=True,
            is_verified=True,
        )
        db.add(scol)
        db.flush()

        # ─── Teachers ─────────────────────────────────────────────────────────
        print("👨‍🏫 Création des enseignants...")
        teachers_data = [
            ("prof.diallo@masap.edu", "Ibrahima", "DIALLO", "Épidémiologie", "Professeur Titulaire"),
            ("dr.camara@masap.edu", "Mariama", "CAMARA", "Biostatistiques", "Maître de Conférences"),
            ("dr.bah@masap.edu", "Alpha", "BAH", "Santé Communautaire", "Maître de Conférences"),
            ("dr.sow@masap.edu", "Aissatou", "SOW", "Systèmes de Santé", "Chargé de Cours"),
            ("dr.toure@masap.edu", "Mamadou", "TOURÉ", "Méthodes de Recherche", "Maître de Conférences"),
            ("dr.balde@masap.edu", "Kadiatou", "BALDÉ", "Santé Environnementale", "Chargé de Cours"),
            ("dr.diallo2@masap.edu", "Oumar", "DIALLO", "Gestion de Projet Santé", "Professeur Associé"),
            ("dr.conde@masap.edu", "Nène", "CONDÉ", "Politiques de Santé", "Professeur Associé"),
        ]

        teacher_users = []
        teacher_profiles = []
        for i, (email, fn, ln, spec, grade) in enumerate(teachers_data):
            t = User(
                email=email,
                hashed_password=get_password_hash("Prof@2024!"),
                first_name=fn,
                last_name=ln,
                role=RoleEnum.teacher,
                is_active=True,
                is_verified=True,
            )
            db.add(t)
            db.flush()

            tp = TeacherProfile(
                user_id=t.id,
                teacher_id=f"ENS-2024-{(i+1):04d}",
                specialization=spec,
                grade=grade,
                office=f"Bureau {100 + i + 1}",
                hire_date=date(2010 + i, 9, 1),
                department_id=dept_sp.id,
            )
            db.add(tp)
            teacher_users.append(t)
            teacher_profiles.append(tp)

        db.flush()

        # ─── Cohort ───────────────────────────────────────────────────────────
        print("🎓 Création de la promotion et des étudiants...")
        cohort = Cohort(
            name="Promotion 2024-2025 — Master 1 Santé Publique",
            program_id=prog_m1.id,
            academic_year_id=year_2425.id,
            max_students=35,
            description="Première promotion du Master 1 Santé Publique pour l'année académique 2024-2025.",
        )
        db.add(cohort)
        db.flush()

        # ─── Students ─────────────────────────────────────────────────────────
        student_names = [
            ("Mariama", "DIALLO"), ("Ibrahima", "SOW"), ("Fatoumata", "BAH"),
            ("Mamadou", "CAMARA"), ("Kadiatou", "TOURÉ"), ("Alpha", "BARRY"),
            ("Aissatou", "CONDÉ"), ("Oumar", "BALDÉ"), ("Hawa", "KOUYATÉ"),
            ("Sékou", "KEÏTA"), ("Aminata", "SYLLA"), ("Aboubacar", "DIALLO"),
            ("Safiatou", "BALDE"), ("Lansana", "SOW"), ("Mariama", "KOUROUMA"),
            ("Mamadou", "BALDÉ"), ("Zainab", "CAMARA"), ("Elhadj", "DIALLO"),
            ("Kadiatou", "KEÏTA"), ("Ibrahim", "BARRY"), ("Salématou", "BAH"),
            ("Thierno", "BARRY"), ("Fatoumata", "CAMARA"), ("Mamadou", "KOUYATÉ"),
            ("Aïssata", "CONDÉ"), ("Boubacar", "DIALLO"), ("Mariam", "SOW"),
            ("Oumar", "KEÏTA"), ("Hadja", "TOURE"), ("Aboubacar", "BAH"),
        ]

        student_users = []
        student_profiles = []
        for i, (fn, ln) in enumerate(student_names):
            email = f"etudiant{i+1}@masap.edu"
            s = User(
                email=email,
                hashed_password=get_password_hash("Etud@2024!"),
                first_name=fn,
                last_name=ln,
                role=RoleEnum.student,
                is_active=True,
                is_verified=True,
            )
            db.add(s)
            db.flush()

            birth_year = 1998 + (i % 5)
            sp = StudentProfile(
                user_id=s.id,
                student_id=f"SP-2024-{(i+1):04d}",
                date_of_birth=date(birth_year, (i % 12) + 1, (i % 28) + 1),
                nationality="Guinéenne",
                address=f"Conakry, Guinée",
                enrollment_status=EnrollmentStatus.active,
                program_id=prog_m1.id,
                cohort_id=cohort.id,
                academic_year_id=year_2425.id,
                promotion_year=2024,
            )
            db.add(sp)
            db.flush()

            # Enroll in cohort
            enrollment = Enrollment(
                student_id=sp.id,
                cohort_id=cohort.id,
                academic_year_id=year_2425.id,
                status="active",
            )
            db.add(enrollment)
            student_users.append(s)
            student_profiles.append(sp)

        db.flush()

        # ─── Modules ──────────────────────────────────────────────────────────
        print("📖 Création des modules...")
        modules_data = [
            # Semestre 1
            ("Épidémiologie Générale", "EPI001", 4, 2, sem1_2425.id, 0),
            ("Biostatistiques Appliquées", "BST001", 4, 2, sem1_2425.id, 1),
            ("Santé Communautaire", "SCO001", 3, 1, sem1_2425.id, 2),
            ("Systèmes de Santé", "SSA001", 3, 1, sem1_2425.id, 3),
            ("Méthodes de Recherche", "MRC001", 4, 2, sem1_2425.id, 4),
            # Semestre 2
            ("Santé Environnementale", "SEN001", 3, 1, sem2_2425.id, 5),
            ("Gestion de Projet en Santé", "GPS001", 3, 1, sem2_2425.id, 6),
            ("Politiques de Santé", "PSA001", 3, 1, sem2_2425.id, 7),
            ("Bioéthique et Droit de la Santé", "BET001", 2, 1, sem2_2425.id, 7),
            ("Informatique Médicale", "INF001", 2, 1, sem2_2425.id, 6),
        ]

        modules = []
        for (name, code, credits, coeff, semester_id, teacher_idx) in modules_data:
            m = Module(
                name=name,
                code=code,
                credits=credits,
                coefficient=coeff,
                semester_id=semester_id,
                program_id=prog_m1.id,
                is_active=True,
                description=f"Module de {name} — Master 1 Santé Publique.",
            )
            db.add(m)
            db.flush()

            # Assign teacher
            ta = TeachingAssignment(
                teacher_id=teacher_users[teacher_idx].id,
                module_id=m.id,
                academic_year_id=year_2425.id,
                is_primary=True,
            )
            db.add(ta)

            # Create grade components (CC 40% + Exam 60%)
            cc = GradeComponent(
                module_id=m.id,
                name="Contrôle Continu",
                weight=Decimal("40"),
                component_type=ComponentType.cc,
            )
            exam = GradeComponent(
                module_id=m.id,
                name="Examen Final",
                weight=Decimal("60"),
                component_type=ComponentType.exam,
            )
            db.add_all([cc, exam])
            db.flush()

            # Enroll all students in module
            for su in student_users:
                me = ModuleEnrollment(
                    student_id=su.id,
                    module_id=m.id,
                    academic_year_id=year_2425.id,
                )
                db.add(me)

            modules.append((m, cc, exam))

        db.flush()

        # ─── Grades for semester 1 (already passed) ───────────────────────────
        print("📝 Saisie des notes...")
        random.seed(42)

        sem1_modules = [m for m, cc, exam in modules if m.semester_id == sem1_2425.id]

        for sp_idx, sp in enumerate(student_profiles):
            for (m, cc_comp, exam_comp) in modules[:5]:  # Semester 1 modules only
                # Generate realistic scores
                base_cc = random.uniform(9, 18)
                base_exam = random.uniform(8, 17)

                # Some students are high performers
                if sp_idx % 5 == 0:
                    base_cc = min(20, base_cc + 2)
                    base_exam = min(20, base_exam + 2)

                cc_score = Decimal(str(round(base_cc, 2)))
                exam_score = Decimal(str(round(base_exam, 2)))

                g_cc = Grade(
                    student_id=sp.id,
                    module_id=m.id,
                    component_id=cc_comp.id,
                    score=cc_score,
                    max_score=Decimal("20"),
                    academic_year_id=year_2425.id,
                    semester_id=sem1_2425.id,
                    is_validated=True,
                    validated_by=chef.id,
                    validated_at=datetime(2025, 2, 1),
                )
                g_exam = Grade(
                    student_id=sp.id,
                    module_id=m.id,
                    component_id=exam_comp.id,
                    score=exam_score,
                    max_score=Decimal("20"),
                    academic_year_id=year_2425.id,
                    semester_id=sem1_2425.id,
                    is_validated=True,
                    validated_by=chef.id,
                    validated_at=datetime(2025, 2, 1),
                )
                db.add_all([g_cc, g_exam])
                db.flush()

                # Calculate and save result
                average = (cc_score * Decimal("0.4")) + (exam_score * Decimal("0.6"))
                average = average.quantize(Decimal("0.01"))
                is_passed = average >= Decimal("10")

                result = ModuleResult(
                    student_id=sp.id,
                    module_id=m.id,
                    academic_year_id=year_2425.id,
                    average=average,
                    is_validated=True,
                    validated_by=chef.id,
                    validated_at=datetime(2025, 2, 1),
                    is_passed=is_passed,
                    credits_earned=m.credits if is_passed else 0,
                )
                db.add(result)

        db.flush()

        # ─── Schedules ────────────────────────────────────────────────────────
        print("📅 Création de l'emploi du temps...")
        schedule_entries = [
            # (module_idx, day, start_h, start_m, end_h, end_m, room)
            (0, 0, 8, 0, 10, 0, "Amphi A"),     # Épi - Lundi
            (1, 0, 10, 30, 12, 30, "Salle Info 1"),  # Biostat - Lundi
            (2, 1, 8, 0, 10, 0, "Salle 101"),   # Santé Comm - Mardi
            (3, 1, 10, 30, 12, 30, "Amphi B"),  # Systèmes Santé - Mardi
            (4, 2, 8, 0, 10, 0, "Salle 202"),   # Méthodes Rech - Mercredi
            (0, 2, 14, 0, 16, 0, "Salle 101"),  # Épi TD - Mercredi
            (1, 3, 8, 0, 10, 0, "Salle Info 2"), # Biostat TD - Jeudi
            (5, 3, 10, 30, 12, 30, "Amphi A"),  # Santé Env - Jeudi
            (6, 4, 8, 0, 10, 0, "Salle 201"),   # Gestion Proj - Vendredi
            (7, 4, 10, 30, 12, 30, "Amphi B"),  # Politiques - Vendredi
        ]

        from datetime import time
        for (mod_idx, day, sh, sm, eh, em, room) in schedule_entries:
            m, _, _ = modules[mod_idx]
            teacher_idx = mod_idx % len(teacher_users)
            sched = Schedule(
                module_id=m.id,
                teacher_id=teacher_users[teacher_idx].id,
                cohort_id=cohort.id,
                academic_year_id=year_2425.id,
                day_of_week=day,
                start_time=time(sh, sm),
                end_time=time(eh, em),
                room=room,
                schedule_type=ScheduleType.course,
            )
            db.add(sched)

        db.flush()

        # ─── Announcements ────────────────────────────────────────────────────
        print("📢 Création des annonces...")
        announcements_data = [
            (
                "Bienvenue dans le portail MASAP-UGANC !",
                "Chers étudiants, bienvenue dans votre nouveau portail étudiant. Vous pouvez désormais consulter vos notes, télécharger vos documents de cours et suivre vos résultats académiques en temps réel. N'hésitez pas à contacter la scolarité pour toute question.",
                AudienceType.all,
                True,
            ),
            (
                "Calendrier des examens — Semestre 2",
                "Le calendrier des examens du Semestre 2 est maintenant disponible. Les examens se dérouleront du 9 au 20 juin 2025. Veuillez vous assurer de vérifier votre emploi du temps individuel et de vous inscrire aux salles d'examen.",
                AudienceType.students,
                True,
            ),
            (
                "Réunion pédagogique — Enseignants",
                "Une réunion pédagogique est organisée le vendredi 28 mars 2025 à 14h00 en salle de conférence. La présence de tous les enseignants est requise pour la validation des notes du Semestre 1.",
                AudienceType.teachers,
                False,
            ),
            (
                "Dépôt des mémoires — Date limite",
                "Rappel : La date limite de dépôt des mémoires de Master 2 est fixée au 30 mai 2025. Les mémoires doivent être soumis en format PDF via le portail et en version imprimée au secrétariat.",
                AudienceType.students,
                True,
            ),
            (
                "Mise à jour des notes — Épidémiologie Générale",
                "Les notes de l'examen final d'Épidémiologie Générale (EPI001) du Semestre 1 ont été validées et sont maintenant disponibles dans votre espace personnel.",
                AudienceType.students,
                False,
            ),
        ]

        for (title, content, audience, is_pinned) in announcements_data:
            ann = Announcement(
                title=title,
                content=content,
                author_id=admin.id if not is_pinned else chef.id,
                audience=audience,
                is_pinned=is_pinned,
                is_published=True,
                published_at=datetime.utcnow(),
            )
            db.add(ann)

        db.commit()

        print("\n" + "="*60)
        print("✅ BASE DE DONNÉES INITIALISÉE AVEC SUCCÈS")
        print("="*60)
        print("\n📋 IDENTIFIANTS DE DÉMONSTRATION:")
        print("-"*60)
        print(f"{'Rôle':<25} {'Email':<35} {'Mot de passe'}")
        print("-"*60)
        print(f"{'Super Admin':<25} {'admin@masap.edu':<35} Admin@2024!")
        print(f"{'Chef de Département':<25} {'chef.dept@masap.edu':<35} Chef@2024!")
        print(f"{'Enseignant':<25} {'prof.diallo@masap.edu':<35} Prof@2024!")
        print(f"{'Étudiant':<25} {'etudiant1@masap.edu':<35} Etud@2024!")
        print(f"{'Scolarité':<25} {'scolarite@masap.edu':<35} Scol@2024!")
        print("-"*60)
        print(f"\n📊 Données créées:")
        print(f"  - 1 Faculté, 2 Départements, 2 Programmes")
        print(f"  - 2 Années académiques, 4 Semestres")
        print(f"  - 10 Modules avec composantes de notes")
        print(f"  - 1 Promotion de {len(student_profiles)} étudiants")
        print(f"  - {len(teacher_users)} Enseignants")
        print(f"  - Notes du Semestre 1 validées")
        print(f"  - Emploi du temps créé")
        print(f"  - 5 Annonces publiées")
        print("="*60 + "\n")

    except Exception as e:
        db.rollback()
        print(f"❌ Erreur lors du seed: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

"""PDF generation service using ReportLab."""
import io
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph,
    Spacer, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

# University colors
UNIVERSITY_BLUE = colors.HexColor("#1e3a8a")
UNIVERSITY_GOLD = colors.HexColor("#d97706")
LIGHT_BLUE = colors.HexColor("#eff6ff")
LIGHT_GRAY = colors.HexColor("#f3f4f6")
DARK_GRAY = colors.HexColor("#374151")


def get_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        'UniversityTitle',
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=UNIVERSITY_BLUE,
        alignment=TA_CENTER,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        'DocumentTitle',
        fontName='Helvetica-Bold',
        fontSize=16,
        textColor=UNIVERSITY_BLUE,
        alignment=TA_CENTER,
        spaceAfter=6,
        spaceBefore=6,
    ))
    styles.add(ParagraphStyle(
        'SubTitle',
        fontName='Helvetica',
        fontSize=11,
        textColor=DARK_GRAY,
        alignment=TA_CENTER,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        'SectionHeader',
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=UNIVERSITY_BLUE,
        spaceBefore=10,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        'Normal2',
        fontName='Helvetica',
        fontSize=9,
        textColor=DARK_GRAY,
    ))
    return styles


def generate_transcript(
    student: Dict[str, Any],
    modules: List[Dict[str, Any]],
    program_name: str,
    academic_year: str,
    university_name: str = "Université MASAP-UGANC",
    faculty_name: str = "Faculté des Sciences de la Santé",
) -> bytes:
    """Generate a student transcript PDF."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = get_styles()
    story = []

    # Header
    story.append(Paragraph(university_name.upper(), styles['UniversityTitle']))
    story.append(Paragraph(faculty_name, styles['SubTitle']))
    story.append(HRFlowable(width="100%", thickness=2, color=UNIVERSITY_GOLD))
    story.append(Spacer(1, 0.5 * cm))
    story.append(Paragraph("RELEVÉ DE NOTES", styles['DocumentTitle']))
    story.append(Spacer(1, 0.3 * cm))

    # Student info
    info_data = [
        ["Étudiant :", f"{student.get('first_name', '')} {student.get('last_name', '').upper()}",
         "Matricule :", student.get('student_id', '')],
        ["Programme :", program_name, "Année académique :", academic_year],
        ["Date de naissance :", str(student.get('date_of_birth', 'N/A')),
         "Date d'édition :", datetime.now().strftime("%d/%m/%Y")],
    ]
    info_table = Table(info_data, colWidths=[3.5 * cm, 7 * cm, 4 * cm, 4.5 * cm])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (0, -1), UNIVERSITY_BLUE),
        ('TEXTCOLOR', (2, 0), (2, -1), UNIVERSITY_BLUE),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ('BACKGROUND', (0, 0), (0, -1), LIGHT_BLUE),
        ('BACKGROUND', (2, 0), (2, -1), LIGHT_BLUE),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 0.5 * cm))

    # Grades table
    story.append(Paragraph("Résultats académiques", styles['SectionHeader']))

    headers = ["Code", "Module / Unité d'Enseignement", "Crédits", "Coeff.", "Moyenne /20", "Mention", "Résultat"]
    table_data = [headers]

    total_credits = 0
    credits_earned = 0
    weighted_sum = Decimal("0")
    total_coeff = 0

    for m in modules:
        avg = m.get('average')
        is_passed = m.get('is_passed', False)
        credits = m.get('credits', 3)
        coeff = m.get('coefficient', 1)

        if avg is not None:
            avg_display = f"{float(avg):.2f}"
            mention = get_mention(float(avg))
            result = "Validé" if is_passed else "Ajourné"
            if is_passed:
                credits_earned += credits
                weighted_sum += Decimal(str(avg)) * coeff
                total_coeff += coeff
        else:
            avg_display = "N/A"
            mention = "-"
            result = "N/A"

        total_credits += credits
        table_data.append([
            m.get('code', ''),
            m.get('name', ''),
            str(credits),
            str(coeff),
            avg_display,
            mention,
            result,
        ])

    overall_avg = float(weighted_sum / total_coeff) if total_coeff > 0 else None

    grades_table = Table(
        table_data,
        colWidths=[2 * cm, 7.5 * cm, 1.8 * cm, 1.8 * cm, 2.5 * cm, 2.5 * cm, 2 * cm],
    )
    grades_table.setStyle(TableStyle([
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), UNIVERSITY_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        # Data rows
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ALIGN', (2, 1), (-1, -1), 'CENTER'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))

    # Color code results
    for i, row in enumerate(table_data[1:], start=1):
        result = row[-1]
        if result == "Validé":
            grades_table.setStyle(TableStyle([
                ('TEXTCOLOR', (6, i), (6, i), colors.green),
                ('FONTNAME', (6, i), (6, i), 'Helvetica-Bold'),
            ]))
        elif result == "Ajourné":
            grades_table.setStyle(TableStyle([
                ('TEXTCOLOR', (6, i), (6, i), colors.red),
                ('FONTNAME', (6, i), (6, i), 'Helvetica-Bold'),
            ]))

    story.append(grades_table)
    story.append(Spacer(1, 0.5 * cm))

    # Summary
    summary_data = [
        ["Moyenne générale :", f"{overall_avg:.2f}/20" if overall_avg else "N/A",
         "Mention :", get_mention(overall_avg) if overall_avg else "N/A"],
        ["Crédits obtenus :", f"{credits_earned}/{total_credits}",
         "Décision du jury :", "Admis(e)" if credits_earned >= total_credits * 0.6 else "Ajourné(e)"],
    ]
    summary_table = Table(summary_data, colWidths=[4 * cm, 5 * cm, 3.5 * cm, 5.5 * cm])
    summary_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BLUE),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('TEXTCOLOR', (0, 0), (0, -1), UNIVERSITY_BLUE),
        ('TEXTCOLOR', (2, 0), (2, -1), UNIVERSITY_BLUE),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 1 * cm))

    # Signature section
    sig_data = [
        ["Le Chef de Département", "", "Le Responsable de Scolarité"],
        ["", "", ""],
        ["Signature et cachet", "", "Signature et cachet"],
    ]
    sig_table = Table(sig_data, colWidths=[6 * cm, 5 * cm, 6 * cm])
    sig_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TEXTCOLOR', (0, 0), (-1, 0), UNIVERSITY_BLUE),
        ('FONTNAME', (0, 2), (-1, 2), 'Helvetica'),
        ('TEXTCOLOR', (0, 2), (-1, 2), colors.grey),
        ('ROWHEIGHTS', (0, 1), (-1, 1), 50),
    ]))
    story.append(sig_table)

    # Footer
    story.append(Spacer(1, 0.5 * cm))
    story.append(HRFlowable(width="100%", thickness=1, color=UNIVERSITY_GOLD))
    story.append(Paragraph(
        f"Document généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')} | {university_name}",
        ParagraphStyle('Footer', fontName='Helvetica', fontSize=7, textColor=colors.grey, alignment=TA_CENTER)
    ))

    doc.build(story)
    return buffer.getvalue()


def generate_pv(
    module: Dict[str, Any],
    grades_list: List[Dict[str, Any]],
    academic_year: str,
    university_name: str = "Université MASAP-UGANC",
) -> bytes:
    """Generate a PV (procès-verbal) PDF for a module."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = get_styles()
    story = []

    story.append(Paragraph(university_name.upper(), styles['UniversityTitle']))
    story.append(HRFlowable(width="100%", thickness=2, color=UNIVERSITY_GOLD))
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph("PROCÈS-VERBAL DE DÉLIBÉRATION", styles['DocumentTitle']))
    story.append(Spacer(1, 0.3 * cm))

    # Module info
    story.append(Paragraph(f"Module : {module.get('name', '')} ({module.get('code', '')})", styles['SectionHeader']))
    story.append(Paragraph(f"Année académique : {academic_year}", styles['Normal2']))
    story.append(Spacer(1, 0.3 * cm))

    # Grades table
    headers = ["N°", "Matricule", "Nom et Prénom", "CC", "Exam", "Moyenne", "Mention", "Résultat"]
    table_data = [headers]

    passed = 0
    failed = 0

    for i, g in enumerate(grades_list, 1):
        avg = g.get('average')
        is_passed = g.get('is_passed', False)
        if is_passed:
            passed += 1
        else:
            failed += 1

        table_data.append([
            str(i),
            g.get('student_id', ''),
            g.get('student_name', ''),
            str(g.get('cc', 'N/A')),
            str(g.get('exam', 'N/A')),
            f"{float(avg):.2f}" if avg else "N/A",
            get_mention(float(avg)) if avg else "-",
            "Admis" if is_passed else "Ajourné",
        ])

    pv_table = Table(
        table_data,
        colWidths=[1 * cm, 2.5 * cm, 5.5 * cm, 1.8 * cm, 1.8 * cm, 2.2 * cm, 2.2 * cm, 2 * cm],
    )
    pv_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), UNIVERSITY_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ALIGN', (3, 1), (-1, -1), 'CENTER'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 3),
    ]))

    story.append(pv_table)
    story.append(Spacer(1, 0.5 * cm))

    # Statistics
    total = len(grades_list)
    story.append(Paragraph(
        f"Résultats : {total} étudiant(s) — {passed} Admis ({100*passed//total if total else 0}%) — {failed} Ajourné(s)",
        styles['SectionHeader']
    ))

    story.append(Spacer(1, 1 * cm))

    sig_data = [
        ["L'Enseignant responsable", "", "Le Chef de Département"],
        ["", "", ""],
        ["Signature", "", "Signature et cachet"],
    ]
    sig_table = Table(sig_data, colWidths=[6 * cm, 5 * cm, 6 * cm])
    sig_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TEXTCOLOR', (0, 0), (-1, 0), UNIVERSITY_BLUE),
        ('ROWHEIGHTS', (0, 1), (-1, 1), 60),
    ]))
    story.append(sig_table)

    doc.build(story)
    return buffer.getvalue()


def get_mention(avg: Optional[float]) -> str:
    if avg is None:
        return "N/A"
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

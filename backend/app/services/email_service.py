import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger(__name__)


def _send(to: str, subject: str, html: str) -> None:
    """Send an email via SMTP. Silently logs on failure so the app never crashes."""
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        logger.warning("SMTP not configured — email to %s not sent.", to)
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
        msg["To"] = to
        msg.attach(MIMEText(html, "html", "utf-8"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(msg["From"], [to], msg.as_string())
        logger.info("Email sent to %s — %s", to, subject)
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to, exc)


def send_registration_email(
    to: str,
    first_name: str,
    last_name: str,
    student_id: str,
    password: str,
) -> None:
    frontend_url = settings.FRONTEND_URL or "http://localhost:3000"
    subject = "Bienvenue sur MASAP-UGANC — Vos identifiants de connexion"
    html = f"""
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /></head>
<body style="font-family:Arial,sans-serif;background:#f1f5f9;margin:0;padding:32px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

    <!-- Header -->
    <div style="background:#1e3a5f;padding:32px 40px;text-align:center;">
      <h1 style="color:#ffffff;font-size:22px;margin:0;">MASAP-UGANC</h1>
      <p style="color:#93c5fd;font-size:13px;margin:6px 0 0;">
        FSTS — Université Gamal Abdel Nasser de Conakry
      </p>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px;">
      <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">
        Bonjour <strong>{first_name} {last_name}</strong>,
      </p>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Votre compte étudiant a été créé avec succès sur la plateforme MASAP-UGANC.
        Voici vos informations de connexion :
      </p>

      <!-- Credentials box -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr>
            <td style="color:#64748b;padding:6px 0;width:140px;">Matricule</td>
            <td style="color:#1e293b;font-weight:700;padding:6px 0;">{student_id}</td>
          </tr>
          <tr>
            <td style="color:#64748b;padding:6px 0;">Email (login)</td>
            <td style="color:#1e293b;font-weight:700;padding:6px 0;">{to}</td>
          </tr>
          <tr>
            <td style="color:#64748b;padding:6px 0;">Mot de passe</td>
            <td style="color:#1e293b;font-weight:700;padding:6px 0;">{password}</td>
          </tr>
        </table>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="{frontend_url}/login"
           style="display:inline-block;background:#1e3a5f;color:#ffffff;text-decoration:none;
                  font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
          Accéder à la plateforme
        </a>
      </div>

      <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0;">
        Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe
        dès votre première connexion.<br/>
        Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 40px;text-align:center;">
      <p style="color:#94a3b8;font-size:11px;margin:0;">
        © 2024 MASAP-UGANC — Tous droits réservés<br/>
        FSTS, Université Gamal Abdel Nasser de Conakry
      </p>
    </div>
  </div>
</body>
</html>
"""
    _send(to, subject, html)

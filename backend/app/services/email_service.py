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
    pending_validation: bool = False,
) -> None:
    frontend_url = settings.FRONTEND_URL or "http://localhost:3000"

    if pending_validation:
        subject = "MASAP-UGANC — Votre demande d'inscription a été reçue"
        status_block = """
      <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;
                  padding:14px 18px;margin-bottom:24px;">
        <p style="color:#854d0e;font-size:14px;margin:0;">
          ⏳ <strong>Votre compte est en attente de validation</strong> par l'administration.
          Vous recevrez un email dès qu'il sera activé.
        </p>
      </div>"""
        cta_block = ""
        footer_note = "Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message."
    else:
        subject = "MASAP-UGANC — Votre compte a été activé"
        status_block = """
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Votre compte étudiant a été activé. Voici vos informations de connexion :
      </p>"""
        cta_block = f"""
      <div style="text-align:center;margin-bottom:28px;">
        <a href="{frontend_url}/login"
           style="display:inline-block;background:#1e3a5f;color:#ffffff;text-decoration:none;
                  font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
          Accéder à la plateforme
        </a>
      </div>"""
        footer_note = (
            "Pour des raisons de sécurité, nous vous recommandons de changer votre "
            "mot de passe dès votre première connexion."
        )

    html = f"""
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /></head>
<body style="font-family:Arial,sans-serif;background:#f1f5f9;margin:0;padding:32px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;
              overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="background:#1e3a5f;padding:32px 40px;text-align:center;">
      <h1 style="color:#ffffff;font-size:22px;margin:0;">MASAP-UGANC</h1>
      <p style="color:#93c5fd;font-size:13px;margin:6px 0 0;">
        FSTS — Université Gamal Abdel Nasser de Conakry
      </p>
    </div>
    <div style="padding:32px 40px;">
      <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">
        Bonjour <strong>{first_name} {last_name}</strong>,
      </p>
      {status_block}
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;
                  padding:20px 24px;margin-bottom:24px;">
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
      {cta_block}
      <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0;">{footer_note}</p>
    </div>
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


def send_account_approved_email(to: str, first_name: str) -> None:
    frontend_url = settings.FRONTEND_URL or "http://localhost:3000"
    subject = "MASAP-UGANC — Votre compte a été activé ✓"
    html = f"""
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8" /></head>
<body style="font-family:Arial,sans-serif;background:#f1f5f9;margin:0;padding:32px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;
              overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="background:#1e3a5f;padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;font-size:22px;margin:0;">MASAP-UGANC</h1>
    </div>
    <div style="padding:32px 40px;">
      <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Bonjour <strong>{first_name}</strong>,</p>
      <div style="background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
        <p style="color:#166534;font-size:14px;margin:0;">
          ✅ <strong>Votre compte a été validé</strong> par l'administration.
          Vous pouvez maintenant vous connecter à la plateforme.
        </p>
      </div>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="{frontend_url}/login"
           style="display:inline-block;background:#1e3a5f;color:#fff;text-decoration:none;
                  font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
          Se connecter
        </a>
      </div>
    </div>
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 40px;text-align:center;">
      <p style="color:#94a3b8;font-size:11px;margin:0;">© 2024 MASAP-UGANC — FSTS, Université Gamal Abdel Nasser de Conakry</p>
    </div>
  </div>
</body></html>
"""
    _send(to, subject, html)


def send_account_rejected_email(to: str, first_name: str) -> None:
    subject = "MASAP-UGANC — Votre demande d'inscription"
    html = f"""
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8" /></head>
<body style="font-family:Arial,sans-serif;background:#f1f5f9;margin:0;padding:32px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;
              overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="background:#1e3a5f;padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;font-size:22px;margin:0;">MASAP-UGANC</h1>
    </div>
    <div style="padding:32px 40px;">
      <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Bonjour <strong>{first_name}</strong>,</p>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Après examen de votre demande d'inscription, nous ne sommes pas en mesure
        de valider votre compte pour le moment.
      </p>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0;">
        Pour plus d'informations, veuillez contacter la scolarité de la FSTS-UGANC.
      </p>
    </div>
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 40px;text-align:center;">
      <p style="color:#94a3b8;font-size:11px;margin:0;">© 2024 MASAP-UGANC — FSTS, Université Gamal Abdel Nasser de Conakry</p>
    </div>
  </div>
</body></html>
"""
    _send(to, subject, html)


def send_password_reset_email(to: str, first_name: str, reset_link: str) -> None:
    subject = "MASAP-UGANC — Réinitialisation de votre mot de passe"
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
        Bonjour <strong>{first_name}</strong>,
      </p>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Vous avez demandé la réinitialisation de votre mot de passe.<br/>
        Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.<br/>
        <strong>Ce lien expire dans 15 minutes.</strong>
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="{reset_link}"
           style="display:inline-block;background:#1e3a5f;color:#ffffff;text-decoration:none;
                  font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
          Réinitialiser mon mot de passe
        </a>
      </div>

      <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0;">
        Si vous n'avez pas demandé cette réinitialisation, ignorez ce message.<br/>
        Votre mot de passe restera inchangé.
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

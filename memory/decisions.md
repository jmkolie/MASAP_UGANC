# Décisions techniques

> Historique des choix d'architecture et de design importants.

## Format
**[Date] — Titre**
- **Décision :** ce qui a été choisi
- **Pourquoi :** motivation ou contrainte
- **Alternatives rejetées :** ce qui n't a pas été retenu et pourquoi

---

## Exemple (à remplacer par de vraies décisions)

**2026-03-23 — Stack initiale**
- **Décision :** React (frontend) + Node/Express (backend) + PostgreSQL
- **Pourquoi :** familiarité équipe, écosystème mature, Docker pour l'isolation
- **Alternatives rejetées :** Django (moins flexible pour API REST), MongoDB (besoin de relations entre entités)

---

**2026-03-24 — Déploiement via Coolify sur VPS**
- **Décision :** hébergement sur VPS avec Coolify comme plateforme de déploiement
- **Pourquoi :** déploiement continu simplifié, Coolify détecte les push Git et rebuild automatiquement
- **Comment déployer :** push sur la branche connectée à Coolify → rebuild automatique du frontend

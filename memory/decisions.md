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

**2026-03-30 — Déploiement VPS via Git + Docker Compose**
- **Décision :** déploiement depuis le dépôt GitHub sur le VPS avec `docker compose -f docker-compose.prod.yml up -d --build`
- **Pourquoi :** le projet dispose déjà d'une stack Docker complète, et cette approche évite la dépendance à Coolify/CapRover pour la mise en production
- **Alternatives rejetées :** Coolify/CapRover (configuration présente mais non retenue pour ce déploiement)

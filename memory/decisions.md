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

**2026-05-21 — Intégration sélective du patch Qwen**
- **Décision :** intégrer les fonctionnalités frontend Qwen uniquement après adaptation aux endpoints et dépendances réels du projet, avec ajout propre du thème sombre, des notifications, des charts et d'une bibliothèque UI locale
- **Pourquoi :** le patch brut contenait des suppressions dangereuses et des hypothèses invalides sur l'API; l'intégration sélective permet de conserver la stabilité du build et du déploiement
- **Alternatives rejetées :** reprise intégrale du patch Qwen (risque de régression), abandon complet du patch (perte de valeur fonctionnelle)

**2026-05-21 — Rebuild frontend Docker explicite sur le VPS**
- **Décision :** en cas de décalage entre le code Git déployé et le rendu servi, reconstruire explicitement l'image `masap-uganc-frontend` sur le VPS puis recréer `masap_frontend` avec `docker compose -f docker-compose.vps.yml up -d frontend backend`
- **Pourquoi :** un `git pull` réussi sur le serveur ne garantit pas que le conteneur frontend en cours utilise une image fraîche; ici le dépôt était à jour mais `masap_frontend` servait encore une image vieille de plusieurs semaines
- **Alternatives rejetées :** supposer un problème de cache navigateur ou de code applicatif sans vérifier l'âge réel de l'image Docker

**2026-05-22 — Programme étudiant exposé depuis le profil**
- **Décision :** considérer `student_profiles.program_id` et sa relation `program` comme source de vérité du programme d'inscription d'un étudiant, puis renvoyer cet objet dans les réponses API étudiantes
- **Pourquoi :** plusieurs écrans avaient besoin d'afficher le programme réel de l'étudiant, et un libellé frontend codé en dur ne permettait ni cohérence ni filtrage administratif fiable
- **Alternatives rejetées :** dupliquer le nom du programme dans `users`, conserver un texte statique côté frontend

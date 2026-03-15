# MASAP-UGANC — Portail Étudiant Universitaire

Portail étudiant complet pour une université avec un focus sur les étudiants de **Master en Santé Publique**.

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Backend | FastAPI (Python 3.11) |
| Base de données | PostgreSQL 15 |
| ORM | SQLAlchemy 2.0 + Alembic |
| Frontend | Next.js 14 + TypeScript |
| CSS | Tailwind CSS |
| Auth | JWT (python-jose) |
| PDF | ReportLab |
| Containerisation | Docker + Docker Compose |
| Reverse Proxy | Nginx |

## Démarrage rapide

### Prérequis
- Docker Desktop installé
- Docker Compose v2+

### Lancer le projet

```bash
# Cloner ou accéder au dossier
cd MASAP_UGANC

# Lancer tous les services
docker compose up --build

# Ou en arrière-plan
docker compose up --build -d
```

Le portail sera accessible sur :
- **Portail** : http://localhost (via Nginx)
- **Frontend** : http://localhost:3000
- **API Backend** : http://localhost:8000
- **Documentation API** : http://localhost:8000/api/docs

### Identifiants de démonstration

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Super Admin | admin@masap.edu | Admin@2024! |
| Chef de Département | chef.dept@masap.edu | Chef@2024! |
| Enseignant | prof.diallo@masap.edu | Prof@2024! |
| Étudiant | etudiant1@masap.edu | Etud@2024! |
| Scolarité | scolarite@masap.edu | Scol@2024! |

## Développement local (sans Docker)

### Backend

```bash
cd backend

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# Installer les dépendances
pip install -r requirements.txt

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec votre configuration locale

# Lancer PostgreSQL localement (ou via Docker)
docker run -d --name masap_db \
  -e POSTGRES_DB=masap_uganc \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 postgres:15-alpine

# Appliquer les migrations
alembic upgrade head

# Charger les données de démonstration
python -m scripts.seed

# Lancer le backend
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Configurer l'environnement
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Lancer le frontend
npm run dev
```

## Architecture du projet

```
MASAP_UGANC/
├── backend/
│   ├── app/
│   │   ├── api/v1/           # Endpoints REST
│   │   │   ├── auth.py       # Authentification JWT
│   │   │   ├── users.py      # Gestion utilisateurs
│   │   │   ├── academic.py   # Facultés, programmes, modules
│   │   │   ├── grades.py     # Notes et résultats
│   │   │   ├── documents.py  # Documents pédagogiques
│   │   │   ├── announcements.py
│   │   │   ├── schedule.py   # Emploi du temps
│   │   │   └── pdf.py        # Génération PDF
│   │   ├── models/           # Modèles SQLAlchemy
│   │   ├── schemas/          # Schémas Pydantic
│   │   ├── core/             # Sécurité, dépendances
│   │   ├── services/         # Services métier (PDF, fichiers)
│   │   └── utils/            # Utilitaires
│   ├── alembic/              # Migrations DB
│   ├── scripts/              # Seed et utilitaires
│   └── tests/                # Tests pytest
├── frontend/
│   └── src/
│       ├── app/              # Pages Next.js 14 (App Router)
│       │   ├── (auth)/       # Login, mot de passe oublié
│       │   └── (dashboard)/  # Pages par rôle
│       │       ├── admin/
│       │       ├── dept-head/
│       │       ├── teacher/
│       │       └── student/
│       ├── components/       # Composants réutilisables
│       │   ├── layout/       # Sidebar, Topbar
│       │   └── ui/           # Boutons, Cards, Tables...
│       ├── contexts/         # React Context (Auth)
│       ├── hooks/            # React Query hooks
│       ├── lib/              # API client, utils
│       └── types/            # TypeScript types
├── nginx/                    # Configuration Nginx
├── scripts/                  # Scripts d'initialisation SQL
├── docker-compose.yml
└── README.md
```

## Rôles et permissions

| Rôle | Permissions |
|------|-------------|
| **super_admin** | Accès total : gestion utilisateurs, facultés, programmes, années académiques, paramètres système |
| **dept_head** | Gestion promotions, validation notes, génération PV, rapports académiques |
| **teacher** | Saisie notes, upload documents, création devoirs, annonces de cours |
| **student** | Consultation notes, téléchargement documents et relevés, emploi du temps |
| **scolarite** | Gestion dossiers administratifs, inscriptions, documents officiels |

## Modèle de données

```
User ──── StudentProfile ──── Cohort ──── Program ──── Department ──── Faculty
     └─── TeacherProfile         └──────── AcademicYear
                                              └─── Semester ─── Module ─── GradeComponent
                                                                        └─── TeachingAssignment
                                                                        └─── Grade
                                                                        └─── CourseDocument
                                                                        └─── Schedule
```

## API Documentation

L'API est documentée automatiquement par FastAPI :
- **Swagger UI** : http://localhost:8000/api/docs
- **ReDoc** : http://localhost:8000/api/redoc

## Variables d'environnement

### Backend (.env)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/masap_uganc
SECRET_KEY=your-super-secret-key-minimum-32-characters
DEBUG=false
ALLOWED_ORIGINS=["http://localhost:3000"]
UPLOAD_DIR=/app/uploads
ACCESS_TOKEN_EXPIRE_MINUTES=480
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Tests

```bash
# Backend
cd backend
pytest tests/ -v

# Avec couverture
pytest tests/ --cov=app --cov-report=html
```

## Déploiement VPS

```bash
# Sur le VPS (Ubuntu/Debian)
# Installer Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER

# Cloner le repo
git clone <repo-url> /opt/masap-uganc
cd /opt/masap-uganc

# Configurer les secrets (IMPORTANT: changer les valeurs par défaut!)
cp backend/.env.example backend/.env
nano backend/.env  # Éditer avec de vraies valeurs sécurisées

# Lancer en production
docker compose -f docker-compose.yml up -d --build

# Configurer SSL avec Certbot (optionnel)
apt install certbot python3-certbot-nginx
certbot --nginx -d votre-domaine.com
```

## Données de démonstration

Le seed initial crée :
- **1** Faculté : Faculté des Sciences de la Santé
- **2** Départements : Santé Publique, Épidémiologie
- **2** Programmes : Master Santé Publique M1 & M2
- **2** Années académiques : 2023-2024 (archivée), 2024-2025 (courante)
- **4** Semestres
- **1** Promotion de 30 étudiants
- **10** Modules : Épidémiologie, Biostatistiques, Santé communautaire, Systèmes de santé, Méthodes de recherche, Santé environnementale, Gestion de projet en santé, Politiques de santé, Bioéthique, Informatique médicale
- **8** Enseignants avec profils complets
- **30** Étudiants avec notes réalistes
- **5** Annonces
- **Planning** hebdomadaire

## Support et contribution

Ce portail est conçu pour être étendu et maintenu. Pour toute question ou contribution, veuillez consulter la documentation technique dans `docs/`.

---

**MASAP-UGANC** © 2024 — Portail Étudiant Universitaire

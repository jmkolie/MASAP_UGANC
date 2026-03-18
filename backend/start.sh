#!/bin/sh
set -e

echo "==> Création des tables manquantes..."
python -c "
from app.database import Base, engine
from app.models import user, academic, communication, grades
Base.metadata.create_all(bind=engine)
print('Tables OK')
"

echo "==> Vérification alembic..."
python -c "
from app.database import engine
from sqlalchemy import text, inspect

insp = inspect(engine)
if 'alembic_version' not in insp.get_table_names():
    import subprocess
    print('Nouvelle base de données — stamp alembic head')
    subprocess.run(['alembic', 'stamp', 'head'], check=True)
else:
    print('Base existante — migrations en attente seront appliquées')
"

echo "==> Application des migrations..."
alembic upgrade head

echo "==> Initialisation des données..."
python -m scripts.seed

echo "==> Démarrage du serveur..."
uvicorn app.main:app --host 0.0.0.0 --port 8000

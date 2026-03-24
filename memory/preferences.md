# Préférences & Conventions du projet

> Comment ce projet est structuré, quelles conventions sont en vigueur, et comment Claude doit se comporter.

## Style de code
- Langage principal : JavaScript / TypeScript (React + Node)
- Nommage : camelCase pour les variables/fonctions, PascalCase pour les composants
- Commentaires : en français (langue du projet)
- Pas de sur-ingénierie : solutions simples et directes

## Comportement de Claude
- Réponses courtes et directes
- Pas d'emojis sauf demande explicite
- Pas de résumé à la fin des réponses ("voici ce que j'ai fait...")
- Proposer des solutions, pas demander de permission pour des changements mineurs
- Lire le code existant avant de suggérer des modifications

## Conventions Git
- Messages de commit en français avec préfixe `feat:`, `fix:`, `refactor:`, etc.
- Branches de feature : `feature/nom-de-la-feature`
- Ne jamais force-push sur main

## Structure du projet
- `frontend/` — application React
- `backend/` — API Node/Express
- `nginx/` — configuration reverse proxy
- `scripts/` — scripts utilitaires
- `memory/` — mémoire persistante de Claude pour ce projet

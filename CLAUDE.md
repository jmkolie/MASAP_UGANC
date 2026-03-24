# Instructions pour Claude — MASAP UGANC

## Lecture obligatoire en début de session

Au début de chaque conversation, lire ces fichiers dans l'ordre :

1. `memory/user.md` — profil et préférences de l'utilisateur
2. `memory/preferences.md` — conventions du projet et règles de comportement
3. `memory/people.md` — équipe et rôles
4. `memory/decisions.md` — décisions techniques passées

**Pourquoi :** Ces fichiers contiennent le contexte accumulé de toutes les sessions précédentes. Les lire évite de répéter les mêmes erreurs, de redemander des informations déjà données, et assure une cohérence entre les sessions.

---

## Mise à jour en fin de session (ou dès qu'une info importante émerge)

Mettre à jour les fichiers dès qu'une nouvelle information pertinente apparaît :

| Fichier | Mettre à jour quand... |
|---|---|
| `memory/decisions.md` | Une décision d'architecture ou de design est prise |
| `memory/people.md` | Un nouveau collaborateur est mentionné, un rôle change |
| `memory/preferences.md` | Une nouvelle convention est établie, une préférence est corrigée |
| `memory/user.md` | L'utilisateur révèle quelque chose sur son niveau, ses goûts, son contexte |

**Format des mises à jour :** ajouter à la fin de la section concernée avec la date. Ne jamais supprimer l'historique, seulement amender ou annoter.

---

## Règles de comportement (résumé)

- Réponses courtes et directes — pas de rembourrage, pas de résumé final
- Lire le code existant avant de proposer des modifications
- Pas d'emojis sauf demande explicite
- Commits en français avec préfixes conventionnels (`feat:`, `fix:`, `refactor:`...)
- Ne pas over-engineer : la solution la plus simple qui fonctionne

---

## Projet : MASAP UGANC

Système de gestion académique universitaire.
- **Rôles :** admin, enseignant, étudiant
- **Stack :** React + Node/Express + PostgreSQL + Docker + Nginx
- **Structure :** `frontend/` / `backend/` / `nginx/` / `scripts/` / `memory/`

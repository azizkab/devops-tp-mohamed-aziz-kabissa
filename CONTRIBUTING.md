# Contributing

## Workflow Git

Chaque nouvelle fonctionnalité doit être développée dans une branche dédiée.

Exemples :

```bash
git checkout -b feature/authentication
git checkout -b feature/docker
git checkout -b fix/login-error
```

## Conventional Commits

Les messages de commit doivent respecter le format :

```txt
type: description
```

Exemples :

```txt
feat: add authentication system
fix: resolve login issue
docs: update project documentation
test: add api tests
refactor: simplify user service
chore: update dependencies
```

## Pull Requests

Avant de fusionner dans `main` :

1. Vérifier que le code fonctionne.
2. Vérifier que les tests passent.
3. Mettre à jour la documentation si nécessaire.
4. Créer une Pull Request.
5. Faire valider la Pull Request avant fusion.

## Branches

* `main` : version stable
* `feature/*` : nouvelles fonctionnalités
* `fix/*` : corrections de bugs
* `docs/*` : documentation

## Bonnes pratiques

* Faire des commits fréquents.
* Utiliser des messages explicites.
* Ne jamais commit de secrets ou de fichiers `.env`.
* Maintenir le README à jour.

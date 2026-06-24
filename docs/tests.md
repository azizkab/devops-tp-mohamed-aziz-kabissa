# Stratégie de tests

## Objectif

Garantir le bon fonctionnement de l'application.

## Tests manuels

Les fonctionnalités suivantes doivent être vérifiées :

* Connexion
* Gestion des équipiers
* Briefs
* Débriefs
* Formations
* Génération PDF
* Placement équipe
* Notifications Discord

## Tests API

Les routes REST doivent retourner :

* 200 en cas de succès
* 400 en cas d'erreur utilisateur
* 401 si non authentifié
* 500 en cas d'erreur serveur

## Évolutions futures

* Jest
* Supertest
* Tests automatisés CI/CD

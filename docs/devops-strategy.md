# Stratégie DevOps

## Objectif

Automatiser le développement, les tests et le déploiement de l'application.

## Workflow Git

* main : version stable
* develop : intégration
* feature/* : nouvelles fonctionnalités

## Déploiement

Frontend :

* Vercel

Backend :

* Railway

Base de données :

* MongoDB Atlas

## Améliorations futures

* Docker
* GitHub Actions
* Déploiement automatique
* Monitoring


## CI/CD

Les futurs déploiements seront automatisés avec GitHub Actions.
Le pipeline GitHub Actions est opérationnel.

## Optimisation du pipeline

Le workflow GitHub Actions utilise le cache npm afin de réutiliser les dépendances téléchargées entre deux exécutions. Cela réduit le temps d'exécution des pipelines.
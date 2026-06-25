# Sécurité

## Gestion des secrets

Les secrets ne doivent jamais être stockés dans le dépôt Git.

Les variables sensibles sont stockées dans :

* .env local
* Variables Railway
* Variables Vercel

## Variables sensibles

* JWT_SECRET
* MONGO_URI
* DISCORD_WEBHOOK_URL
* ADMIN_PASSWORD

## Authentification

L'application utilise JWT pour sécuriser les accès.

## Bonnes pratiques

* Ne jamais commit un fichier .env
* Utiliser des mots de passe forts
* Limiter les droits utilisateurs
* Vérifier les permissions côté backend

## Rotation des secrets

Les secrets doivent être renouvelés régulièrement.


## Sécurité du dépôt GitHub

Les fonctionnalités de sécurité GitHub ont été activées afin d'améliorer la protection du projet.

Fonctionnalités activées :

* Dependabot Alerts
* Dependabot Security Updates
* Secret Scanning

Ces outils permettent :

* la détection automatique des dépendances vulnérables ;
* la proposition de mises à jour de sécurité ;
* la détection des secrets accidentellement publiés dans le dépôt.

**Capture d'écran :**

![Code security and analysis](images/security.png)



# Risques DevOps

## R1 — Exposition d'un secret (JWT, MongoDB ou Discord)

* **Probabilité :** Moyenne
* **Impact :** Critique (accès non autorisé à l'application ou à la base de données)
* **Action :**

  * Stocker les secrets dans un fichier `.env`
  * Utiliser les GitHub Secrets dans les workflows CI
  * Ne jamais versionner le fichier `.env`
  * Effectuer une rotation des secrets en cas de fuite

---

## R2 — Indisponibilité de la base de données MongoDB

* **Probabilité :** Faible
* **Impact :** Critique (application inutilisable)
* **Action :**

  * Utiliser un volume Docker pour conserver les données
  * Ajouter un `healthcheck` dans `docker-compose.yml`
  * Vérifier la connexion au démarrage du backend

---

## R3 — Pipeline CI en échec

* **Probabilité :** Moyenne
* **Impact :** Élevé (déploiement d'un code non fiable)
* **Action :**

  * Exécuter automatiquement les tests unitaires
  * Lancer ESLint avant chaque fusion
  * Interdire les merges si la CI échoue

---

## R4 — Dépendances contenant des vulnérabilités

* **Probabilité :** Moyenne
* **Impact :** Élevé (failles de sécurité connues)
* **Action :**

  * Activer Dependabot
  * Mettre à jour régulièrement les dépendances
  * Vérifier les alertes GitHub Security

---

## R5 — Perte des données utilisateur

* **Probabilité :** Faible
* **Impact :** Critique (perte des briefs, débriefs, formations et utilisateurs)
* **Action :**

  * Utiliser des volumes Docker persistants
  * Mettre en place des sauvegardes régulières de MongoDB
  * Tester les procédures de restauration des données

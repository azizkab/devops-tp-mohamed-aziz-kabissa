# Stratégie DevOps

## 1. Architecture technique cible

Le projet est une application de gestion de restaurant composée d'un frontend, d'un backend Node.js/Express et d'une base de données MongoDB.

Le frontend communique avec le backend via une API REST. Le backend gère l'authentification, les équipiers, les briefs, les débriefs, les formations, le placement de l'équipe et les notifications Discord.

### Schéma d'architecture

```text
                Utilisateur
                     │
                     ▼
              Frontend React
                     │
              API REST (HTTP)
                     │
                     ▼
          Backend Node.js / Express
              │              │
              │              │
              ▼              ▼
         MongoDB        Discord Webhook
```

---

## 2. Structure du repository

Le dépôt est organisé de manière à séparer les différents composants du projet.

```text
backend/
frontend/
docs/
.github/workflows/
Dockerfile
docker-compose.yml
README.md
```

Cette organisation facilite le développement, les tests et le déploiement.

---

## 3. Workflow Git

Le projet suit un workflow Git basé sur plusieurs branches :

* **main** : version stable
* **develop** : intégration des fonctionnalités
* **feature/*** : développement d'une fonctionnalité

Les contributions passent par une Pull Request avant d'être fusionnées.

---

## 4. Services Docker prévus

L'application est exécutée grâce à Docker Compose.

Services utilisés :

* Backend Node.js
* MongoDB

Le backend dépend du service MongoDB et attend que celui-ci soit disponible grâce au healthcheck.

---

## 5. Variables d'environnement

Les informations sensibles sont stockées dans un fichier `.env` qui n'est jamais versionné.

Variables principales :

* PORT
* MONGO_URI
* JWT_SECRET
* DISCORD_WEBHOOK_URL
* ADMIN_PASSWORD

Un fichier `.env.example` est fourni afin de faciliter la configuration du projet.

---

## 6. Stratégie de tests

Les tests sont réalisés avec Jest.

Les tests couvrent notamment :

* validation des profils
* normalisation des scores
* détection de contenu trop court
* transformation des réponses IA mockées

Les tests sont exécutés automatiquement dans le pipeline GitHub Actions.

---

## 7. Pipeline CI prévu

À chaque Push ou Pull Request :

1. récupération du code
2. installation des dépendances
3. exécution du lint
4. lancement des tests
5. vérification du démarrage du backend

L'objectif est d'empêcher l'intégration d'un code non fonctionnel.

---

## 8. Sécurité et secrets

Les secrets sont stockés dans GitHub Secrets.

Le dépôt utilise :

* GitHub Secrets
* Dependabot
* Secret Scanning
* fichier `.gitignore`
* fichier `.env.example`

Aucun mot de passe ou token réel n'est présent dans le dépôt.

---

## 9. Logs prévus

Les logs permettent de suivre :

* démarrage du serveur
* connexion MongoDB
* erreurs serveur
* erreurs Discord
* erreurs JWT
* exécution des tâches planifiées

Ces informations facilitent le diagnostic des incidents.

---

## 10. Risques DevOps

Les principaux risques identifiés sont :

* fuite de secrets
* indisponibilité de MongoDB
* échec du pipeline CI
* vulnérabilités dans les dépendances
* perte de données

Des mesures de prévention sont mises en place grâce aux sauvegardes, à Docker, aux GitHub Secrets et aux outils de sécurité GitHub.

---

## 11. Commandes de lancement

### Développement

```bash
npm install
npm start
```

### Avec Docker

```bash
cp .env.example .env
docker compose up --build
```

### Tests

```bash
npm run lint
npm test
npm run test:coverage
```

Le backend est ensuite accessible sur :

```
http://localhost:5000
```

Le point de santé est disponible sur :

```
http://localhost:5000/health
```

---

## 12. Prochaines actions

Les prochaines évolutions prévues sont :

* déploiement automatique sur Railway
* déploiement du frontend sur Vercel
* amélioration de la couverture des tests
* ajout de tests d'intégration
* supervision avec des outils de monitoring
* mise en place d'un pipeline CD
* génération automatique de rapports de qualité

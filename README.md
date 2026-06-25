# devops-tp-mohamed-aziz-kabissa
# Gestion Restaurant

Application web de gestion opérationnelle pour restaurant permettant le suivi des briefs, débriefs, formations, placements d'équipe et indicateurs de performance,développée dans le cadre du TP DevOps.


[![CI](https://github.com/azizkab/devops-tp-mohamed-aziz-kabissa/actions/workflows/ci.yml/badge.svg)](https://github.com/azizkab/devops-tp-mohamed-aziz-kabissa/actions/workflows/ci.yml)


## Stack

### Frontend

* React
* React Router
* Axios
* html2canvas

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* PDFKit
* Discord Webhooks

### Base de données

* MongoDB Atlas

## Lancer le projet

### Backend

```bash
cd backend
npm install
npm run dev
```

Le backend démarre sur :

```bash
http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Le frontend démarre sur :

```bash
http://localhost:3000
```

## Tester

Lancer le backend :

```bash
cd backend
npm run dev
```

Lancer le frontend :

```bash
cd frontend
npm start
```

Tester ensuite les fonctionnalités :

* Authentification
* Gestion des équipiers
* Briefs
* Débriefs
* Formations
* Génération PDF
* Placement équipe
* Notifications Discord

## Architecture

La documentation technique est disponible dans :

* docs/architecture.md
* docs/devops-strategy.md
* docs/tests.md
* docs/security.md

## Lancer le projet

### Prérequis

* Docker Desktop
* Git

### Installation

```bash
git clone https://github.com/azizkab/devops-tp-mohamed-aziz-kabissa.git
cd devops-tp-mohamed-aziz-kabissa
cp .env.example .env
docker compose up --build
```

### Accès à l'application

Une fois les conteneurs démarrés :

* Backend : http://localhost:5000
* Vérification de l'API : http://localhost:5000/health
* Base de données : MongoDB (conteneur Docker)

### Arrêter l'application

```bash
docker compose down
```


## Auteur

Aziz Kabissa


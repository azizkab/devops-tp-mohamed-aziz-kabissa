# Architecture du projet

## Vue générale

Le projet est composé de deux parties :

* Frontend React
* Backend Node.js / Express

Les utilisateurs accèdent au frontend via leur navigateur.

Le frontend communique avec le backend grâce à une API REST.

Le backend gère :

* l'authentification
* les équipiers
* les briefs
* les débriefs
* les formations
* les placements d'équipe

Les données sont stockées dans MongoDB.

## Architecture logique

Frontend → API REST → MongoDB

Le backend génère également :

* des PDF
* des notifications Discord
* des rapports de formation

## Technologies

* React
* Node.js
* Express
* MongoDB
* JWT
* PDFKit
* Discord Webhooks

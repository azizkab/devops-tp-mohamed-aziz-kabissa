# Stratégie de tests

## Objectif

L'objectif est d'identifier les fonctionnalités critiques de l'application et de prévoir les tests nécessaires pour sécuriser le projet.

Le projet concerne une application de gestion opérationnelle restaurant avec :

* authentification
* briefs / débriefs
* formations équipiers
* génération de PDF
* placement équipe
* notifications Discord

## Fonctionnalité critique 1 — Authentification et rôles

### Pourquoi c'est critique

L'application contient des données internes au restaurant.
Seuls les utilisateurs autorisés doivent pouvoir accéder aux pages protégées et effectuer certaines actions.

### Test unitaire

Vérifier que le middleware d'authentification refuse une requête sans token JWT.

Résultat attendu :

* statut HTTP 401
* message d'erreur clair

### Test d'intégration

Vérifier qu'un utilisateur connecté avec un rôle `MANAGER` peut accéder aux routes autorisées.

Résultat attendu :

* statut HTTP 200
* données retournées correctement

### Test e2e bonus

Scénario :

1. L'utilisateur ouvre la page de connexion.
2. Il saisit ses identifiants.
3. Il est redirigé vers le dashboard.
4. La Navbar affiche les pages accessibles selon son rôle.

## Fonctionnalité critique 2 — Brief / Débrief

### Pourquoi c'est critique

Les briefs et débriefs sont au centre du suivi opérationnel du restaurant.
Ils permettent de préparer le rush, analyser les résultats et générer des documents PDF.

### Test unitaire

Vérifier que le service PDF génère un chemin de fichier valide après création d'un brief.

Résultat attendu :

* un fichier PDF est créé
* le chemin retourné n'est pas vide

### Test d'intégration

Vérifier qu'une requête POST de création de brief crée :

* un brief en base
* un PDF associé
* une notification Discord

Résultat attendu :

* statut HTTP 201
* objet brief retourné
* chemin PDF présent

### Test e2e bonus

Scénario :

1. Le manager remplit un brief.
2. Il valide le formulaire.
3. Le brief apparaît dans l'historique.
4. Le PDF peut être consulté ou téléchargé.

## Fonctionnalité critique 3 — Formations équipiers

### Pourquoi c'est critique

Les formations permettent de suivre le niveau des équipiers et de conserver des preuves signées au format PDF.
Certaines formations, comme la prévention sécurité, doivent être renouvelées régulièrement.

### Test unitaire

Vérifier que le calcul du score d'une formation retourne 100 % quand toutes les questions sont validées.

Résultat attendu :

* score = 100
* formation validée

### Test d'intégration

Vérifier qu'une validation de formation crée :

* une validation en base
* une date de validation
* une date d'expiration si la formation est périodique
* un PDF signé

Résultat attendu :

* statut HTTP 200
* validation enregistrée
* `pdfRempliPath` présent

### Test e2e bonus

Scénario :

1. Le manager ouvre une fiche équipier.
2. Il sélectionne une formation.
3. Il valide toutes les questions.
4. L'équipier et le formateur signent.
5. Le PDF signé est généré et disponible dans l'historique.

## Fonctionnalité critique 4 — Placement équipe

### Pourquoi c'est critique

Le placement équipe est utilisé directement sur le terrain pour organiser les postes pendant le rush.
Il doit être rapide, sauvegardé et partageable sur Discord.

### Test unitaire

Vérifier que la fonction de formatage Discord ou image reçoit un placement valide et génère un contenu exploitable.

Résultat attendu :

* contenu non vide
* date et rush présents

### Test d'intégration

Vérifier qu'un placement peut être :

* créé
* sauvegardé
* récupéré dans l'historique
* envoyé sur Discord

Résultat attendu :

* statut HTTP 201 à la création
* statut HTTP 200 à la récupération
* placement présent dans l'historique

### Test e2e bonus

Scénario :

1. Le manager ouvre la page Placement équipe.
2. Il remplit plusieurs postes.
3. Il enregistre le placement.
4. Il clique sur Envoyer Discord.
5. Une image du placement est envoyée dans le salon Discord.

## Résumé des cas de test minimum

| Fonctionnalité   | Test unitaire             | Test intégration                | Test e2e bonus                |
| ---------------- | ------------------------- | ------------------------------- | ----------------------------- |
| Authentification | Middleware JWT sans token | Accès route selon rôle          | Connexion et redirection      |
| Brief / Débrief  | Génération PDF            | Création brief + PDF + Discord  | Brief visible dans historique |
| Formations       | Calcul score              | Validation + PDF signé          | Signature et génération PDF   |
| Placement équipe | Formatage placement       | Création + historique + Discord | Envoi image Discord           |

## Commandes prévues

```bash
cd backend
npm test
npm run test:coverage
```



## Rapport de couverture

La couverture de tests est générée avec Jest :

```bash
npm run test:coverage
```

Le rapport HTML est disponible dans :

```txt
coverage/lcov-report/index.html
```

Capture d'écran du rapport :
![Rapport de couverture](images/coverage-report.png)


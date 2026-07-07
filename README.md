# STOP DROGUE TOUR 2026 - Générateur de Campagne d'Affiches

Une application web full-stack moderne construite en **Node.js (Express + Nunjucks + Prisma + SQLite)** pour la campagne nationale de sensibilisation contre la toxicomanie en milieu scolaire et universitaire portée par la Région 14 (Lions Club Cotonou Acacia & Léo Club Porto-Novo L'Étoile).

## 🚀 Fonctionnalités

### 👥 Espace Public / Visiteurs
- **Landing Page Canva-like** : Présentation dynamique de la campagne et grid des clubs partenaires.
- **Créateur d'Affiche Interactif** : 
  - Glisser-déposer sa photo sur un Canvas HTML5 en temps réel.
  - Outils de transformation complets (zoom, rotation, déplacement horizontal et vertical).
  - Toggles pour le détourage par intelligence artificielle (support de remove.bg et ClipDrop).
  - Personnalisation dynamique du prénom, de la ville et de l'établissement.
- **Compositing Haute Définition (HD)** : Le serveur assemble les calques avec **Sharp** au format portrait officiel 1080x1350 px.
- **QR Code d'invitation viral** : Chaque affiche génère un QR code unique en bas à droite pointant vers la page de partage pour inviter d'autres participants.
- **Partage Social direct** : Intégration de l'API Web Share native pour mobiles et boutons de partage dédiés pour WhatsApp, Facebook et X.
- **Galerie Publique** : Recherche et pagination des affiches générées.

### 🛡️ Espace Administration (Authentifié)
- **Tableau de Bord Analytique** : Suivi des statistiques de visites, générations d'affiches, clics de téléchargements, partages et campagnes.
- **CRUD Campagnes** : Création et édition de nouvelles vagues de sensibilisation avec logos et codes couleurs.
- **CRUD Clubs Lions / Léo** : Configuration des clubs organisateurs.
- **CRUD Modèles (Gabarits d'Affiches) & Éditeur de Zone Visuel** :
  - Uploader des fonds d'affiches PNG avec transparence.
  - **Éditeur visuel interactif** (drag & drop) pour définir les limites d'insertion de la photo utilisateur et des blocs de textes dynamiques (Nom, Ville, Slogan) sans coder.
- **Modération des Affiches** : Recherche, consultation et suppression des images publiées avec nettoyage automatique du disque.
- **Paramètres du site** : Modification du logo, de la couleur d'accentuation, de l'email de contact et des liens de réseaux sociaux.

---

## 🛠️ Stack Technique

- **Backend** : Node.js, Express.js (MVC)
- **Templates** : Nunjucks (Héritage de layouts, filtres personnalisés)
- **BDD & ORM** : SQLite + Prisma ORM
- **Traitement d'Image** : Sharp (Compositing vectoriel/raster multi-calques)
- **Authentification** : Passport.js (Local strategy) & Express-session
- **Uploads** : Multer (Filtre par type MIME et limites de tailles)
- **Sécurité** : Helmet (En-têtes de sécurité avec politique CSP personnalisée), Express Rate Limit (Limiteurs de requêtes et de génération)
- **Frontend** : Alpine.js & Tailwind CSS 3

---

## 🏃 Demarrage du Projet

### Prérequis
- Node.js >= 18.0.0
- NPM

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration de l'environnement
Un fichier `.env` a été créé à la racine avec les variables suivantes :
```env
PORT=3000
DATABASE_URL="file:./dev.db"
SESSION_SECRET="super-secret-drogue-tour-key-2026-lions-leo-club"
REMOVE_BG_API_KEY=""
CLIPDROP_API_KEY=""
```
*Note : Si vous disposez d'une clé API remove.bg ou ClipDrop, complétez la variable correspondante pour activer le détourage automatique de l'arrière-plan sur le serveur.*

### 3. Exécution des migrations & Seeder de la base
Cette commande crée la base de données SQLite localement, exécute les tables Prisma et génère les dossiers d'uploads, le compte administrateur par défaut ainsi que le modèle de démonstration physique (`default_template.png`) :
```bash
npx prisma migrate dev --name init
node prisma/seed.js
```

### 4. Compilation des fichiers de styles Tailwind CSS
```bash
npm run build:css
```

### 5. Lancement du serveur local
En mode développement avec rechargement automatique :
```bash
npm run dev
```
Ouvrez votre navigateur sur [http://localhost:3000](http://localhost:3000).

---

## 🔑 Identifiants Administrateur de Test
- **Page de connexion** : `/admin/login`
- **Email** : `admin@admin.bj`
- **Mot de passe** : `admin`

# EasyReport Frontend

Frontend moderne pour l'application de signalement de problèmes EasyReport, développé avec Next.js 14, TypeScript, et Tailwind CSS.

## 🚀 Technologies

- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS utilitaire
- **Zustand** - Gestion d'état
- **React Query** - Gestion des données serveur
- **React Hook Form** - Gestion des formulaires
- **Framer Motion** - Animations
- **Lucide React** - Icônes
- **React Hot Toast** - Notifications

## 📦 Installation

1. **Installer les dépendances :**
```bash
npm install
```

2. **Configurer l'environnement :**
Créer un fichier `.env.local` basé sur `.env.local.example` :
```bash
cp .env.local.example .env.local
```

3. **Démarrer le serveur de développement :**
```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

## 🔧 Configuration

### Variables d'environnement

Créer un fichier `.env.local` avec les variables suivantes :

```env
# URL de l'API backend
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Configuration de l'application
NEXT_PUBLIC_APP_NAME=EasyReport
NEXT_PUBLIC_APP_VERSION=1.0.0

# Configuration des uploads
NEXT_PUBLIC_MAX_FILE_SIZE=16777216
NEXT_PUBLIC_ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx

# Configuration des notifications
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_REALTIME=true

# Configuration du cache
NEXT_PUBLIC_CACHE_DURATION=300000
```

## 📁 Structure du projet

```
src/
├── app/                 # App Router (Next.js 14)
│   ├── layout.tsx      # Layout principal
│   ├── page.tsx        # Page d'accueil
│   └── globals.css     # Styles globaux
├── components/         # Composants réutilisables
│   └── ui/            # Composants UI de base
├── lib/               # Utilitaires et configurations
│   ├── api.ts         # Client API avec Axios
│   └── utils.ts       # Fonctions utilitaires
├── store/             # Gestion d'état (Zustand)
│   └── auth.ts        # Store d'authentification
├── types/             # Types TypeScript
│   └── index.ts       # Types principaux
└── pages/             # Pages de l'application
```

## 🔐 Authentification

Le frontend utilise JWT pour l'authentification avec :
- **Access Token** : Pour les requêtes API
- **Refresh Token** : Pour renouveler l'access token
- **Persistance** : Tokens stockés dans localStorage
- **Intercepteurs** : Renouvellement automatique des tokens

## 📡 API

Le client API (`src/lib/api.ts`) gère :
- **Authentification** : Login, register, logout, refresh
- **Problèmes** : CRUD, likes, commentaires, historique
- **Notifications** : Gestion des notifications utilisateur
- **Admin** : Dashboard, gestion utilisateurs, analytics

## 🎨 UI/UX

- **Design System** : Composants cohérents avec Tailwind
- **Responsive** : Adaptation mobile/desktop
- **Animations** : Transitions fluides avec Framer Motion
- **Accessibilité** : Standards WCAG respectés
- **Thème** : Support light/dark mode

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests en mode watch
npm run test:watch

# Couverture de tests
npm run test:coverage
```

## 📦 Build

```bash
# Build de production
npm run build

# Démarrer en production
npm start
```

## 🔍 Linting et Formatage

```bash
# Vérification ESLint
npm run lint

# Vérification TypeScript
npm run type-check
```

## 🚀 Déploiement

Le projet est configuré pour être déployé sur :
- **Vercel** (recommandé)
- **Netlify**
- **AWS Amplify**
- **Docker**

## 📱 Fonctionnalités

### Utilisateurs
- ✅ Inscription/Connexion
- ✅ Gestion de profil
- ✅ Changement de mot de passe
- ✅ Rôles (étudiant, admin, modérateur)

### Problèmes
- ✅ Création de signalements
- ✅ Upload de fichiers
- ✅ Système de likes
- ✅ Commentaires
- ✅ Historique des modifications
- ✅ Filtres et recherche
- ✅ Pagination

### Notifications
- ✅ Notifications en temps réel
- ✅ Marquer comme lu
- ✅ Paramètres de notification
- ✅ Différents types (système, problème, commentaire)

### Administration
- ✅ Dashboard avec statistiques
- ✅ Gestion des utilisateurs
- ✅ Mise à jour en masse
- ✅ Analytics détaillées
- ✅ Santé du système

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation
- Contacter l'équipe de développement

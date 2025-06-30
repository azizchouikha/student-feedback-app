# 🚀 EasyReport - Plateforme de Gestion de Feedback Étudiant

Une solution moderne et innovante pour la gestion des problèmes et du feedback dans les établissements d'enseignement.

## 🎯 Vue d'ensemble

EasyReport est une application web complète qui permet aux étudiants de signaler des problèmes dans leur établissement et aux administrateurs de les gérer efficacement. Le projet utilise les technologies les plus modernes pour offrir une expérience utilisateur exceptionnelle.

## ✨ Fonctionnalités Principales

### 🎓 Pour les Étudiants
- **Signalement rapide** : Interface intuitive pour signaler des problèmes
- **Suivi en temps réel** : Suivi de l'évolution des signalements
- **Système de likes** : Soutenir les problèmes importants
- **Commentaires** : Échanger avec l'administration
- **Notifications** : Alertes en temps réel
- **Upload de fichiers** : Joindre des photos/documents

### 👨‍💼 Pour les Administrateurs
- **Tableau de bord complet** : Vue d'ensemble des problèmes
- **Gestion avancée** : Mise à jour des statuts et messages
- **Analytics détaillées** : Statistiques et tendances
- **Gestion des utilisateurs** : Administration des comptes
- **Notifications automatiques** : Communication avec les étudiants
- **Export de données** : Rapports et analyses

### 🔧 Fonctionnalités Techniques
- **Authentification sécurisée** : JWT + Bcrypt
- **API RESTful** : Architecture moderne
- **Base de données robuste** : MySQL avec SQLAlchemy
- **Interface responsive** : Design adaptatif
- **Performance optimisée** : Cache et pagination
- **Sécurité renforcée** : Validation stricte, rate limiting

## 🏗️ Architecture

```
student-feedback-app/
├── backend/                 # API Flask
│   ├── app.py              # Point d'entrée
│   ├── config.py           # Configuration
│   ├── models.py           # Modèles SQLAlchemy
│   ├── routes/             # Blueprints API
│   ├── requirements.txt    # Dépendances Python
│   └── init_db.py         # Initialisation DB
├── frontend/               # Application Next.js
│   ├── src/
│   │   ├── app/           # Pages Next.js 13+
│   │   ├── components/    # Composants React
│   │   ├── lib/          # Utilitaires et API
│   │   ├── store/        # État global (Zustand)
│   │   └── types/        # Types TypeScript
│   ├── package.json      # Dépendances Node.js
│   └── tailwind.config.js # Configuration Tailwind
└── README.md             # Documentation
```

## 🚀 Installation et Configuration

### Prérequis
- **Node.js** 18+ et **npm**
- **Python** 3.8+
- **MySQL** 8.0+
- **Redis** (optionnel, pour le cache)

### 1. Cloner le projet
```bash
git clone <repository-url>
cd student-feedback-app
```

### 2. Configuration Backend

```bash
cd backend

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Installer les dépendances
pip install -r requirements.txt

# Créer le fichier .env
cp .env.example .env
# Éditer .env avec vos configurations

# Créer la base de données MySQL
mysql -u root -p
CREATE DATABASE gestion_problemes_db;
exit

# Initialiser la base de données
python init_db.py
```

### 3. Configuration Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Créer le fichier .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
```

### 4. Lancement

```bash
# Terminal 1 - Backend
cd backend
python app.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

L'application sera disponible sur :
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:5000

## 🔐 Comptes de Test

Après l'initialisation, les comptes suivants sont créés :

### Administrateur
- **Email** : admin@easireport.com
- **Mot de passe** : Admin123!

### Étudiants
- **Email** : student1@easireport.com
- **Mot de passe** : Student123!

## 📚 Documentation API

### Authentification
```bash
# Connexion
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

# Inscription
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password",
  "name": "John",
  "surname": "Doe"
}
```

### Problèmes
```bash
# Lister les problèmes
GET /api/problems?page=1&per_page=20

# Créer un problème
POST /api/problems
{
  "room": "Salle A101",
  "category": "Technologie",
  "description": "Problème avec le projecteur",
  "urgency": 2
}

# Mettre à jour un problème (admin)
PUT /api/problems/1
{
  "state": "En cours de traitement",
  "message": "Intervention prévue demain"
}
```

## 🎨 Technologies Utilisées

### Backend
- **Flask** 3.0 - Framework web Python
- **SQLAlchemy** - ORM pour la base de données
- **JWT** - Authentification sécurisée
- **Bcrypt** - Hashage des mots de passe
- **Marshmallow** - Validation des données
- **Redis** - Cache et sessions
- **MySQL** - Base de données

### Frontend
- **Next.js** 14 - Framework React
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS
- **Framer Motion** - Animations
- **Zustand** - Gestion d'état
- **React Query** - Gestion des données
- **Lucide React** - Icônes

### Outils de Développement
- **ESLint** - Linting JavaScript/TypeScript
- **Prettier** - Formatage de code
- **Jest** - Tests unitaires
- **Git** - Contrôle de version

## 🔧 Scripts Disponibles

### Backend
```bash
# Mode développement
python app.py

# Tests
pytest

# Linting
flake8
black .
```

### Frontend
```bash
# Mode développement
npm run dev

# Build de production
npm run build

# Tests
npm test

# Linting
npm run lint

# Type checking
npm run type-check
```

## 📊 Fonctionnalités Avancées

### Système de Notifications
- Notifications en temps réel
- Emails automatiques
- Préférences personnalisables

### Analytics et Rapports
- Statistiques détaillées
- Graphiques interactifs
- Export PDF/Excel
- Tendances temporelles

### Sécurité
- Authentification JWT
- Hashage des mots de passe
- Validation stricte des entrées
- Protection CSRF
- Rate limiting

### Performance
- Mise en cache Redis
- Pagination intelligente
- Optimisation des requêtes
- Lazy loading

## 🧪 Tests

```bash
# Backend
cd backend
pytest --cov=.

# Frontend
cd frontend
npm test -- --coverage
```

## 🚀 Déploiement

### Production Backend
```bash
# Installer Gunicorn
pip install gunicorn

# Lancer en production
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Production Frontend
```bash
# Build
npm run build

# Lancer
npm start
```

### Docker (optionnel)
```bash
# Backend
docker build -t easireport-backend ./backend
docker run -p 5000:5000 easireport-backend

# Frontend
docker build -t easireport-frontend ./frontend
docker run -p 3000:3000 easireport-frontend
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

- **Email** : support@easireport.com
- **Documentation** : `/docs`
- **Issues** : GitHub Issues

## 🙏 Remerciements

- **Innov Minds** - Pour l'opportunité de développer ce projet
- **Flask** - Framework backend exceptionnel
- **Next.js** - Framework frontend moderne
- **Tailwind CSS** - Framework CSS utilitaire
- **Communauté open source** - Pour tous les outils utilisés

---

**EasyReport** - Simplifiez la gestion des problèmes dans votre établissement 🎓

*Développé avec ❤️ pour améliorer l'expérience étudiante* 
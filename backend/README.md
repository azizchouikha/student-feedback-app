# Student Feedback App - Backend

Backend moderne et robuste pour l'application de gestion des problèmes étudiants, développé avec Flask et SQLAlchemy.

## 🚀 Fonctionnalités

### 🔐 Authentification & Sécurité
- **JWT Authentication** avec refresh tokens
- **Bcrypt** pour le hachage des mots de passe
- **Rate limiting** pour prévenir les attaques par force brute
- **Validation** des données avec Marshmallow
- **CORS** configuré pour le frontend

### 📊 Gestion des Problèmes
- **CRUD complet** pour les problèmes
- **Système de likes** et commentaires
- **Pièces jointes** avec validation des fichiers
- **Historique** des modifications
- **Statistiques** et analytics
- **Recherche** et filtres avancés
- **Pagination** pour les grandes listes

### 👥 Gestion des Utilisateurs
- **Rôles** : Student, Admin, Moderator
- **Profils** utilisateurs complets
- **Gestion** des comptes (activation/désactivation)
- **Historique** des connexions

### 🔔 Notifications
- **Notifications en temps réel**
- **Paramètres** personnalisables
- **Différents types** : problèmes, commentaires, système
- **Gestion** des notifications lues/non lues

### 📈 Administration
- **Dashboard** avec statistiques
- **Gestion** des utilisateurs
- **Mise à jour en masse** des problèmes
- **Analytics** détaillées
- **Monitoring** de la santé du système

## 🛠️ Technologies

- **Flask 3.0** - Framework web
- **SQLAlchemy** - ORM pour la base de données
- **Flask-Migrate** - Migrations de base de données
- **Flask-JWT-Extended** - Authentification JWT
- **Flask-Bcrypt** - Hachage des mots de passe
- **Flask-Limiter** - Rate limiting
- **Marshmallow** - Validation et sérialisation
- **PyMySQL** - Driver MySQL
- **Redis** - Cache et rate limiting

## 📋 Prérequis

- Python 3.8+
- MySQL 8.0+
- Redis (optionnel, pour le cache)

## 🔧 Installation

1. **Cloner le projet**
```bash
cd backend
```

2. **Créer un environnement virtuel**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

3. **Installer les dépendances**
```bash
pip install -r requirements.txt
```

4. **Configurer l'environnement**
```bash
# Copier le fichier d'exemple
cp .env.example .env
# Éditer .env avec vos paramètres
```

5. **Configurer la base de données MySQL**
```sql
CREATE DATABASE gestion_problemes_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

6. **Initialiser la base de données**
```bash
python run.py --init-db
```

## 🚀 Démarrage

### Mode développement
```bash
python run.py
```

### Mode production
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:create_app()
```

## 🧪 Tests

### Test automatique du backend
```bash
python test_backend.py
```

### Tests manuels avec curl

1. **Test de la route principale**
```bash
curl http://localhost:5000/
```

2. **Inscription d'un utilisateur**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test",
    "surname": "User",
    "role": "student"
  }'
```

3. **Connexion**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

4. **Accès à une route protégée**
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📚 API Endpoints

### 🔐 Authentification (`/api/auth`)
- `POST /register` - Inscription
- `POST /login` - Connexion
- `POST /refresh` - Rafraîchir le token
- `POST /logout` - Déconnexion
- `GET /profile` - Profil utilisateur
- `POST /change-password` - Changer le mot de passe
- `POST /forgot-password` - Mot de passe oublié

### 📝 Problèmes (`/api/problems`)
- `POST /` - Créer un problème
- `GET /` - Lister les problèmes (avec filtres)
- `GET /<id>` - Détails d'un problème
- `PUT /<id>` - Modifier un problème
- `POST /<id>/like` - Liker/unliker
- `POST /<id>/comments` - Ajouter un commentaire
- `GET /<id>/history` - Historique du problème
- `GET /categories` - Catégories disponibles
- `GET /stats` - Statistiques

### 👥 Administration (`/api/admin`)
- `GET /dashboard` - Dashboard admin
- `GET /users` - Gestion des utilisateurs
- `PUT /users/<id>` - Modifier un utilisateur
- `POST /problems/bulk-update` - Mise à jour en masse
- `GET /analytics` - Analytics détaillées
- `POST /notifications` - Créer une notification
- `GET /system/health` - Santé du système

### 🔔 Notifications (`/api/notifications`)
- `GET /` - Notifications de l'utilisateur
- `POST /<id>/read` - Marquer comme lu
- `POST /read-all` - Tout marquer comme lu
- `DELETE /<id>` - Supprimer une notification
- `DELETE /clear-all` - Supprimer toutes les notifications
- `GET /unread-count` - Nombre de non lues
- `GET /settings` - Paramètres de notifications
- `PUT /settings` - Modifier les paramètres
- `GET /types` - Types de notifications

## 🔧 Configuration

### Variables d'environnement importantes

```env
# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=gestion_problemes_db

# JWT
JWT_SECRET_KEY=your-jwt-secret-key

# Email (optionnel)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Redis (optionnel)
REDIS_URL=redis://localhost:6379/0

# Upload
MAX_CONTENT_LENGTH=16777216
UPLOAD_FOLDER=uploads

# CORS
CORS_ORIGINS=http://localhost:3000
```

## 📊 Structure de la Base de Données

### Tables principales
- **users** - Utilisateurs et leurs rôles
- **problems** - Problèmes soumis
- **problem_likes** - Likes sur les problèmes
- **comments** - Commentaires sur les problèmes
- **attachments** - Pièces jointes
- **problem_history** - Historique des modifications
- **notifications** - Notifications utilisateurs
- **analytics** - Données d'analyse

## 🔒 Sécurité

- **Validation** stricte des données d'entrée
- **Rate limiting** sur les endpoints sensibles
- **Hachage** sécurisé des mots de passe
- **Tokens JWT** avec expiration
- **CORS** configuré pour le frontend
- **Validation** des types de fichiers uploadés

## 🚀 Déploiement

### Production avec Gunicorn
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 --timeout 120 app:create_app()
```

### Avec Docker (optionnel)
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:create_app()"]
```

## 🐛 Dépannage

### Erreurs courantes

1. **Erreur de connexion à la base de données**
   - Vérifiez que MySQL est démarré
   - Vérifiez les paramètres dans `.env`
   - Assurez-vous que la base de données existe

2. **Erreur d'import**
   - Vérifiez que toutes les dépendances sont installées
   - Activez l'environnement virtuel

3. **Erreur de permissions**
   - Vérifiez les permissions sur le dossier `uploads`
   - Vérifiez les permissions MySQL

### Logs
Les logs sont disponibles dans `logs/app.log` en mode production.

## 📞 Support

Pour toute question ou problème :
1. Vérifiez les logs d'erreur
2. Consultez la documentation des endpoints
3. Testez avec le script `test_backend.py`

## 🔄 Migrations

Pour les modifications de base de données :
```bash
flask db init
flask db migrate -m "Description des changements"
flask db upgrade
```

---

**Backend Student Feedback App** - Version 2.0  
Développé avec Flask et SQLAlchemy 
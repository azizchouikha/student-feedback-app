#!/usr/bin/env python3
"""
Script de démarrage pour le backend Flask
"""

import os
import sys
from app import create_app
from extensions import db
from models import User, Problem, Comment, Notification  # Import des modèles au lieu de Base
from sqlalchemy import text  # Ajouté pour requête SQL

def init_database():
    """Initialiser la base de données"""
    app = create_app()
    with app.app_context():
        try:
            # Créer toutes les tables
            db.create_all()
            print("✅ Base de données initialisée avec succès")
        except Exception as e:
            print(f"❌ Erreur lors de l'initialisation de la base de données: {e}")
            return False
    return True

def main():
    """Fonction principale"""
    print("🚀 Démarrage du backend Student Feedback App...")
    
    # Vérifier si on veut initialiser la base de données
    if len(sys.argv) > 1 and sys.argv[1] == "--init-db":
        print("🗄️  Initialisation de la base de données...")
        if init_database():
            print("✅ Backend prêt!")
        else:
            print("❌ Échec de l'initialisation")
            sys.exit(1)
        return
    
    # Créer l'application
    app = create_app()
    
    # Vérifier si la base de données existe
    with app.app_context():
        try:
            # Test simple de connexion
            db.session.execute(text("SELECT 1"))
            print("✅ Connexion à la base de données OK")
        except Exception as e:
            print(f"❌ Erreur de connexion à la base de données: {e}")
            print("💡 Utilisez 'python run.py --init-db' pour initialiser la base de données")
            sys.exit(1)
    
    # Démarrer le serveur
    print("🌐 Démarrage du serveur sur http://localhost:5000")
    print("📝 Logs du serveur:")
    print("-" * 50)
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )

if __name__ == "__main__":
    main() 
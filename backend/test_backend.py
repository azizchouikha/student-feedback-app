#!/usr/bin/env python3
"""
Script de test pour vérifier que le backend fonctionne correctement
"""

import os
import sys
import requests
import json
from datetime import datetime

# Configuration de base
BASE_URL = "http://localhost:5000"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "Test123!"

def test_health_check():
    """Test de la route principale"""
    print("🔍 Test de la route principale...")
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("✅ Route principale OK")
            return True
        else:
            print(f"❌ Route principale échouée: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Impossible de se connecter au serveur")
        return False

def test_register():
    """Test d'inscription"""
    print("🔍 Test d'inscription...")
    data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "name": "Test",
        "surname": "User",
        "role": "student"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/register", json=data)
        if response.status_code in [201, 409]:  # 409 si l'utilisateur existe déjà
            print("✅ Inscription OK")
            return True
        else:
            print(f"❌ Inscription échouée: {response.status_code}")
            print(f"Réponse: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erreur lors de l'inscription: {e}")
        return False

def test_login():
    """Test de connexion"""
    print("🔍 Test de connexion...")
    data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=data)
        if response.status_code == 200:
            print("✅ Connexion OK")
            return response.json().get("access_token")
        else:
            print(f"❌ Connexion échouée: {response.status_code}")
            print(f"Réponse: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Erreur lors de la connexion: {e}")
        return None

def test_protected_route(token):
    """Test d'une route protégée"""
    print("🔍 Test de route protégée...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/api/auth/profile", headers=headers)
        if response.status_code == 200:
            print("✅ Route protégée OK")
            return True
        else:
            print(f"❌ Route protégée échouée: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erreur lors du test de route protégée: {e}")
        return False

def test_problems_endpoint(token):
    """Test de l'endpoint des problèmes"""
    print("🔍 Test de l'endpoint des problèmes...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/api/problems/", headers=headers)
        if response.status_code == 200:
            print("✅ Endpoint problèmes OK")
            return True
        else:
            print(f"❌ Endpoint problèmes échoué: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erreur lors du test des problèmes: {e}")
        return False

def test_notifications_endpoint(token):
    """Test de l'endpoint des notifications"""
    print("🔍 Test de l'endpoint des notifications...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/api/notifications/", headers=headers)
        if response.status_code == 200:
            print("✅ Endpoint notifications OK")
            return True
        else:
            print(f"❌ Endpoint notifications échoué: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erreur lors du test des notifications: {e}")
        return False

def main():
    """Fonction principale de test"""
    print("🚀 Démarrage des tests du backend...")
    print(f"📍 URL de base: {BASE_URL}")
    print("-" * 50)
    
    # Tests de base
    if not test_health_check():
        print("❌ Le serveur ne répond pas. Assurez-vous qu'il est démarré.")
        return False
    
    # Tests d'authentification
    test_register()
    token = test_login()
    
    if not token:
        print("❌ Impossible d'obtenir un token d'authentification")
        return False
    
    # Tests des endpoints protégés
    test_protected_route(token)
    test_problems_endpoint(token)
    test_notifications_endpoint(token)
    
    print("-" * 50)
    print("✅ Tests terminés!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 
from flask import Flask, request, jsonify, session, redirect, url_for
import mysql.connector
import re
from flask_cors import CORS

# Création de l'application Flask
app = Flask(__name__)
app.secret_key = 'easy_report'  # Clé secrète pour gérer les sessions
CORS(app, supports_credentials=True)  # Activation de CORS pour permettre les requêtes cross-origin

# Connexion à la base de données MySQL
mydb = mysql.connector.connect(
    host='localhost',
    user='root',
    password='',
    port='3306',
    database='gestion_problemes_db'
)

# Validation du mot de passe
def validate_password(password):
    if len(password) < 8:
        return False, "Le mot de passe doit contenir au moins 8 caractères."
    if not re.search(r'[A-Z]', password):
        return False, "Le mot de passe doit contenir au moins une majuscule."
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Le mot de passe doit contenir au moins un caractère spécial."
    return True, None

# Route pour gérer la connexion
@app.route('/api/login', methods=['POST'])
def login():
    # Récupération des données envoyées par le client
    data = request.json
    email = data.get('mail')
    password = data.get('password')

    # Vérification des champs requis
    if not email or not password:
        return jsonify({"error": "Email ou mot de passe manquant"}), 400

    # Exécution de la requête SQL pour vérifier les informations de connexion
    curs = mydb.cursor(dictionary=True)
    sql = "SELECT * FROM users WHERE email = %s AND password = %s"
    curs.execute(sql, (email, password))
    account = curs.fetchone()  # Récupération de l'utilisateur correspondant
    curs.close()

    # Si les informations sont valides, on stocke les informations dans la session
    if account:
        session['loggedin'] = True
        session['id'] = account['id']
        session['email'] = account['email']
        session['role'] = account['role']
        session['name'] = account['name']  # Nom de l'utilisateur
        session['surname'] = account['surname']  # Prénom de l'utilisateur

        # Redirection en fonction du rôle de l'utilisateur
        if account['role'] == 'student':
            redirect_url = url_for('student_dashboard', _external=True)
        elif account['role'] == 'admin':
            redirect_url = url_for('admin_dashboard', _external=True)
        else:
            redirect_url = url_for('login', _external=True)

        # Retourne un message de succès et l'URL de redirection
        return jsonify({"message": "Connexion réussie", "redirect": redirect_url}), 200
    else:
        # Retourne une erreur si les informations de connexion sont invalides
        return jsonify({"error": "Identifiants invalides"}), 401

# Route pour gérer l'enregistrement d'un nouvel utilisateur
@app.route('/api/register', methods=['POST'])
def register():
    # Récupération des données envoyées par le client
    data = request.json
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    surname = data.get('surname')
    role = data.get('role', 'student')  # Le rôle par défaut est 'student'

    # Validation des champs requis
    if not all([email, password, name, surname]):
        return jsonify({"error": "Tous les champs sont obligatoires"}), 400

    # Validation du mot de passe
    is_valid, password_error = validate_password(password)
    if not is_valid:
        return jsonify({"error": password_error}), 400

    try:
        curs = mydb.cursor(dictionary=True)

        # Vérification si un utilisateur avec cet email existe déjà
        curs.execute("SELECT * FROM users WHERE email = %s", (email,))
        existing_user = curs.fetchone()

        if existing_user:
            return jsonify({"error": "Un utilisateur avec cet email existe déjà"}), 400

        # Insérer le nouvel utilisateur dans la base de données
        sql = "INSERT INTO users (email, password, name, surname, role) VALUES (%s, %s, %s, %s, %s)"
        curs.execute(sql, (email, password, name, surname, role))
        mydb.commit()

        return jsonify({"message": "Compte créé avec succès"}), 201
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        curs.close()

# Route pour récupérer tous les problèmes
@app.route('/api/all_problems', methods=['GET'])
def all_problems():
    # Vérification si l'utilisateur est connecté
    if 'loggedin' not in session:
        return jsonify({"error": "Accès non autorisé"}), 403

    try:
        curs = mydb.cursor(dictionary=True)
        # Requête pour récupérer les problèmes depuis la base de données
        sql = """
            SELECT id, room, category, type_of_problem, description, other, urgency, state, message, likes
            FROM problems
        """
        curs.execute(sql)
        problems = curs.fetchall()  # Récupérer tous les problèmes
        curs.close()

        return jsonify({"problems": problems}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

# Route pour basculer un like sur un problème
@app.route('/api/toggle_like', methods=['POST'])
def toggle_like():
    # Vérification si l'utilisateur est connecté
    if 'loggedin' not in session:
        return jsonify({"error": "Unauthorized access"}), 403

    data = request.json
    room = data.get('room')
    category = data.get('category')
    type_of_problem = data.get('type_of_problem')
    description = data.get('description')
    user_id = session['id']

    try:
        curs = mydb.cursor(dictionary=True)
        # Requête pour récupérer le problème spécifique
        curs.execute("""
            SELECT id, likes, liked_by FROM problems
            WHERE room = %s AND category = %s AND type_of_problem = %s AND description = %s
        """, (room, category, type_of_problem, description))
        problem = curs.fetchone()

        if not problem:
            return jsonify({"error": "Problem not found"}), 404

        problem_id = problem['id']
        liked_by = problem['liked_by']
        liked_users = liked_by.split(',') if liked_by else []

        # Vérification si l'utilisateur a déjà liké ou non
        if str(user_id) in liked_users:
            liked_users.remove(str(user_id))
            new_likes = problem['likes'] - 1
            action = "disliked"
        else:
            liked_users.append(str(user_id))
            new_likes = problem['likes'] + 1
            action = "liked"

        new_liked_by = ','.join(liked_users)
        # Mise à jour du nombre de likes et des utilisateurs qui ont liké
        curs.execute("UPDATE problems SET likes = %s, liked_by = %s WHERE id = %s", (new_likes, new_liked_by, problem_id))
        mydb.commit()
        curs.close()

        return jsonify({"message": f"Problem {action} successfully", "new_likes": new_likes, "liked": action == "liked"}), 200

    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

# Route pour le tableau de bord étudiant
@app.route('/api/student_dashboard', methods=['GET'])
def student_dashboard():
    # Vérification si l'utilisateur est connecté et si c'est un étudiant
    if 'loggedin' in session and session['role'] == 'student':
        try:
            curs = mydb.cursor(dictionary=True)
            # Requête pour récupérer les problèmes soumis par l'étudiant connecté
            sql = """SELECT room, category, type_of_problem, description, urgency, remark, created_at, state, message
                     FROM problems WHERE student_name = %s AND student_surname = %s"""
            curs.execute(sql, (session['name'], session['surname']))
            problems = curs.fetchall()  # Récupérer tous les problèmes soumis par cet étudiant
            curs.close()

            if problems:
                return jsonify({"message": "Problems fetched successfully", "problems": problems}), 200
            else:
                return jsonify({"message": "No problems found"}), 200
        except mysql.connector.Error as err:
            return jsonify({"error": str(err)}), 500
    else:
        return jsonify({"error": "Unauthorized access"}), 403

# Route pour soumettre un problème
@app.route('/api/submit_problem', methods=['POST'])
def submit_problem():
    # Vérification si l'utilisateur est connecté et si c'est un étudiant
    if 'loggedin' not in session or session['role'] != 'student':
        return jsonify({"error": "Unauthorized access"}), 403

    data = request.json
    promotion = data.get('promotion')
    room = data.get('room')
    category = data.get('category')
    type_of_problem = data.get('type_of_problem')
    description = data.get('description')
    other = data.get('other')
    urgency = data.get('urgency')
    remark = data.get('remark')
    state = 'Soumis'  # Par défaut, l'état est 'Soumis'

    # Validation des champs requis
    if not all([promotion, room, category, type_of_problem, description, urgency, remark]):
        return jsonify({"error": "Missing fields"}), 400

    # Vérification du niveau d'urgence (il doit être 1, 2 ou 3)
    if not urgency.isdigit() or int(urgency) not in [1, 2, 3]:
        return jsonify({"error": "Invalid urgency level"}), 400

    curs = mydb.cursor(dictionary=True)

    try:
        # Vérification si un problème similaire a déjà été soumis aujourd'hui
        curs.execute("""
            SELECT * FROM problems
            WHERE room = %s AND category = %s
            AND DATE(created_at) = CURDATE()
        """, (room, category))

        existing_problem = curs.fetchone()

        if existing_problem:
            return jsonify({"message": "A problem in the same room and category has already been submitted today"}), 400

        # Récupération des informations de l'utilisateur connecté
        curs.execute("SELECT name, surname FROM users WHERE id = %s", (session['id'],))
        user_info = curs.fetchone()

        if not user_info:
            return jsonify({"error": "User not found"}), 404

        # Insertion du problème dans la base de données
        sql = """INSERT INTO problems (student_name, student_surname, promotion, room, category, type_of_problem,
        description, other, urgency, remark, state)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
        curs.execute(sql, (user_info['name'], user_info['surname'], promotion, room, category, type_of_problem,
                           description, other, urgency, remark, state))
        mydb.commit()

        return jsonify({"message": "Problem submitted successfully"}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        curs.close()

# Route pour le tableau de bord administrateur
@app.route('/api/admin_dashboard', methods=['GET'])
def admin_dashboard():
    # Vérification si l'utilisateur est connecté et si c'est un administrateur
    if 'loggedin' in session and session['role'] == 'admin':
        try:
            curs = mydb.cursor(dictionary=True)
            # Requête pour récupérer tous les problèmes soumis par les étudiants
            sql = """SELECT student_name, student_surname, promotion, room, category, type_of_problem, description, other, 
                     urgency, remark, created_at, state, likes FROM problems"""
            curs.execute(sql)
            problems = curs.fetchall()  # Récupérer tous les problèmes
            curs.close()

            if problems:
                return jsonify({"message": "Problems fetched successfully", "problems": problems}), 200
            else:
                return jsonify({"message": "No problems found"}), 200
        except mysql.connector.Error as err:
            return jsonify({"error": str(err)}), 500
    else:
        return jsonify({"error": "Unauthorized access"}), 403

# Route pour mettre à jour l'état d'un problème
@app.route('/api/update_problem_state', methods=['POST'])
def update_problem_state():
    # Vérification si l'utilisateur est connecté et si c'est un administrateur
    if 'loggedin' not in session or session['role'] != 'admin':
        return jsonify({"error": "Unauthorized access"}), 403

    data = request.json
    student_name = data.get('student_name')
    student_surname = data.get('student_surname')
    promotion = data.get('promotion')
    room = data.get('room')
    category = data.get('category')
    type_of_problem = data.get('type_of_problem')
    description = data.get('description')
    new_state = data.get('new_state')

    # Validation du nouvel état
    valid_states = ['Soumis', 'En cours de traitement', 'Problème traité']
    if new_state not in valid_states:
        return jsonify({"error": "Invalid state"}), 400

    # Validation des champs requis
    if not all([student_name, student_surname, promotion, room, category, type_of_problem, description]):
        return jsonify({"error": "Missing information to identify the problem"}), 400

    curs = mydb.cursor(dictionary=True)

    try:
        # Mise à jour de l'état du problème dans la base de données
        sql = """UPDATE problems SET state = %s
                 WHERE student_name = %s AND student_surname = %s
                 AND promotion = %s AND room = %s AND category = %s
                 AND type_of_problem = %s AND description = %s"""
        curs.execute(sql, (new_state, student_name, student_surname, promotion, room, category, type_of_problem, description))
        mydb.commit()

        # Vérification si la mise à jour a bien été effectuée
        if curs.rowcount == 0:
            return jsonify({"error": "Problem not found or state not updated"}), 404

        return jsonify({"message": "Problem state updated successfully"}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        curs.close()

# Route pour mettre à jour le message associé à un problème
@app.route('/api/update_problem_message', methods=['POST'])
def update_problem_message():
    # Vérification si l'utilisateur est connecté et si c'est un administrateur
    if 'loggedin' not in session or session['role'] != 'admin':
        return jsonify({"error": "Unauthorized access"}), 403

    data = request.json
    student_name = data.get('student_name')
    student_surname = data.get('student_surname')
    promotion = data.get('promotion')
    room = data.get('room')
    category = data.get('category')
    type_of_problem = data.get('type_of_problem')
    description = data.get('description')
    message = data.get('message')

    # Validation des champs requis
    if not all([student_name, student_surname, promotion, room, category, type_of_problem, description, message]):
        return jsonify({"error": "Missing information to identify the problem or message is empty"}), 400

    curs = mydb.cursor(dictionary=True)

    try:
        # Mise à jour du message dans la base de données
        sql = """UPDATE problems SET message = %s
                 WHERE student_name = %s AND student_surname = %s
                 AND promotion = %s AND room = %s AND category = %s
                 AND type_of_problem = %s AND description = %s"""
        curs.execute(sql, (message, student_name, student_surname, promotion, room, category, type_of_problem, description))
        mydb.commit()

        # Vérification si la mise à jour a bien été effectuée
        if curs.rowcount == 0:
            return jsonify({"error": "Problem not found or message not updated"}), 404

        return jsonify({"message": "Problem message updated successfully"}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        curs.close()

# Route pour gérer la déconnexion
@app.route('/api/logout', methods=['GET'])
def logout():
    # Suppression des données de session pour déconnecter l'utilisateur
    session.pop('loggedin', None)
    session.pop('id', None)
    session.pop('email', None)
    session.pop('role', None)
    return jsonify({"message": "Logged out successfully"}), 200

# Démarrage de l'application Flask en mode debug
if __name__ == '__main__':
    app.run(debug=True)

from flask import Flask, request, jsonify, session, redirect, url_for
import mysql.connector
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = 'easy_report'
CORS(app, supports_credentials=True)

mydb = mysql.connector.connect(
    host='localhost',
    user='root',
    password='',
    port='3306',
    database='gestion_problemes_db'
)


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('mail')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email or password missing"}), 400

    curs = mydb.cursor(dictionary=True)
    sql = "SELECT * FROM users WHERE email = %s AND password = %s"
    curs.execute(sql, (email, password))
    account = curs.fetchone()
    curs.close()

    if account:
        session['loggedin'] = True
        session['id'] = account['id']
        session['email'] = account['email']
        session['role'] = account['role']
        session['name'] = account['name']  # Stocker le nom dans la session
        session['surname'] = account['surname']  # Stocker le prénom dans la session

        if account['role'] == 'student':
            redirect_url = url_for('student_dashboard', _external=True)
        elif account['role'] == 'admin':
            redirect_url = url_for('admin_dashboard', _external=True)
        else:
            redirect_url = url_for('login', _external=True)

        return jsonify({"message": "Login successful", "redirect": redirect_url}), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401


@app.route('/api/student_dashboard', methods=['GET'])
def student_dashboard():
    if 'loggedin' in session and session['role'] == 'student':
        # Récupérer les problèmes soumis par l'étudiant connecté
        try:
            curs = mydb.cursor(dictionary=True)
            sql = """SELECT promotion, room, category, type_of_problem, description, urgency, remark, created_at 
                     FROM problems WHERE student_name = %s AND student_surname = %s"""
            curs.execute(sql, (session['name'], session['surname']))
            problems = curs.fetchall()
            curs.close()

            if problems:
                return jsonify({"message": "Problems fetched successfully", "problems": problems}), 200
            else:
                return jsonify({"message": "No problems found"}), 200
        except mysql.connector.Error as err:
            return jsonify({"error": str(err)}), 500
    else:
        return jsonify({"error": "Unauthorized access"}), 403


@app.route('/api/submit_problem', methods=['POST'])
def submit_problem():
    if 'loggedin' not in session or session['role'] != 'student':
        return jsonify({"error": "Unauthorized access"}), 403

    data = request.json
    # Extraction des données du formulaire
    promotion = data.get('promotion')
    room = data.get('room')
    category = data.get('category')
    type_of_problem = data.get('type_of_problem')
    description = data.get('description')
    other = data.get('other')  # Optionnel, donc pas dans la validation "all"
    urgency = data.get('urgency')
    remark = data.get('remark')

    # Validation des champs requis
    if not all([promotion, room, category, type_of_problem, description, urgency, remark]):
        return jsonify({"error": "Missing fields"}), 400

    # Vérification du niveau d'urgence
    if not urgency.isdigit() or int(urgency) not in [1, 2, 3]:  # Urgency doit être 1, 2 ou 3
        return jsonify({"error": "Invalid urgency level"}), 400

    # Récupération des informations de l'utilisateur connecté
    curs = mydb.cursor(dictionary=True)
    try:
        curs.execute("SELECT name, surname FROM users WHERE id = %s", (session['id'],))
        user_info = curs.fetchone()

        if not user_info:
            return jsonify({"error": "User not found"}), 404

        # Insertion des données dans la base de données
        sql = """INSERT INTO problems (student_name, student_surname, promotion, room, category, type_of_problem, 
        description, other, urgency, remark) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
        curs.execute(sql, (user_info['name'], user_info['surname'], promotion, room, category, type_of_problem,
                           description, other, urgency, remark))
        mydb.commit()
        return jsonify({"message": "Problem submitted successfully"}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        curs.close()


@app.route('/api/admin_dashboard', methods=['GET'])
def admin_dashboard():
    if 'loggedin' in session and session['role'] == 'admin':
        return jsonify({"message": "Welcome to the Admin Dashboard"}), 200
    else:
        return jsonify({"error": "Unauthorized access"}), 403


@app.route('/api/logout', methods=['GET'])
def logout():
    session.pop('loggedin', None)
    session.pop('id', None)
    session.pop('email', None)
    session.pop('role', None)
    return jsonify({"message": "Logged out successfully"}), 200


if __name__ == '__main__':
    app.run(debug=True)

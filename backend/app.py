# from flask import Flask, request, jsonify, session, redirect, url_for

# import mysql.connector

# from flask_cors import CORS

 

# app = Flask(__name__)

# app.secret_key = 'easy_report'

# CORS(app, supports_credentials=True)

 

# mydb = mysql.connector.connect(

#     host='localhost',

#     user='root',

#     password='',

#     port='3306',

#     database='gestion_problemes_db'

# )

 

# @app.route('/api/login', methods=['POST'])

# def login():

#     data = request.json

#     email = data.get('mail')

#     password = data.get('password')

 

#     if not email or not password:

#         return jsonify({"error": "Email or password missing"}), 400

 

#     curs = mydb.cursor(dictionary=True)

#     sql = "SELECT * FROM users WHERE email = %s AND password = %s"

#     curs.execute(sql, (email, password))

#     account = curs.fetchone()

#     curs.close()

 

#     if account:

#         session['loggedin'] = True

#         session['id'] = account['id']

#         session['email'] = account['email']

#         session['role'] = account['role']

#         session['name'] = account['name']  # Stocker le nom dans la session

#         session['surname'] = account['surname']  # Stocker le prénom dans la session

 

#         if account['role'] == 'student':

#             redirect_url = url_for('student_dashboard', _external=True)

#         elif account['role'] == 'admin':

#             redirect_url = url_for('admin_dashboard', _external=True)

#         else:

#             redirect_url = url_for('login', _external=True)

 

#         return jsonify({"message": "Login successful", "redirect": redirect_url}), 200

#     else:

#         return jsonify({"error": "Invalid credentials"}), 401

 

# @app.route('/api/student_dashboard', methods=['GET'])

# def student_dashboard():

#     if 'loggedin' in session and session['role'] == 'student':

#         # Récupérer les problèmes soumis par l'étudiant connecté

#         try:

#             curs = mydb.cursor(dictionary=True)

#             sql = """SELECT promotion, room, category, type_of_problem, description, urgency, remark, created_at, state

#                      FROM problems WHERE student_name = %s AND student_surname = %s"""

#             curs.execute(sql, (session['name'], session['surname']))

#             problems = curs.fetchall()

#             curs.close()

 

#             if problems:

#                 return jsonify({"message": "Problems fetched successfully", "problems": problems}), 200

#             else:

#                 return jsonify({"message": "No problems found"}), 200

#         except mysql.connector.Error as err:

#             return jsonify({"error": str(err)}), 500

#     else:

#         return jsonify({"error": "Unauthorized access"}), 403

 

# @app.route('/api/submit_problem', methods=['POST'])

# def submit_problem():

#     if 'loggedin' not in session or session['role'] != 'student':

#         return jsonify({"error": "Unauthorized access"}), 403

 

#     data = request.json

#     promotion = data.get('promotion')

#     room = data.get('room')

#     category = data.get('category')

#     type_of_problem = data.get('type_of_problem')

#     description = data.get('description')

#     other = data.get('other')

#     urgency = data.get('urgency')

#     remark = data.get('remark')

#     state = 'Soumis'

 

#     # Validation des champs requis

#     if not all([promotion, room, category, type_of_problem, description, urgency, remark]):

#         return jsonify({"error": "Missing fields"}), 400

 

#     # Vérification du niveau d'urgence

#     if not urgency.isdigit() or int(urgency) not in [1, 2, 3]:  # Urgency doit être 1, 2 ou 3

#         return jsonify({"error": "Invalid urgency level"}), 400

 

#     curs = mydb.cursor(dictionary=True)

 

#     try:

#         # Vérification si un problème similaire a déjà été soumis (basé sur la salle, la catégorie et la date)

#         curs.execute("""

#             SELECT * FROM problems

#             WHERE room = %s AND category = %s

#             AND DATE(created_at) = CURDATE()

#         """, (room, category))

 

#         existing_problem = curs.fetchone()

 

#         if existing_problem:

#             return jsonify({"message": "A problem in the same room and category has already been submitted today"}), 400

 

#         # Récupération des informations de l'utilisateur connecté

#         curs.execute("SELECT name, surname FROM users WHERE id = %s", (session['id'],))

#         user_info = curs.fetchone()

 

#         if not user_info:

#             return jsonify({"error": "User not found"}), 404

 

#         # Insertion des données dans la base de données

#         sql = """INSERT INTO problems (student_name, student_surname, promotion, room, category, type_of_problem,

#         description, other, urgency, remark, state)

#         VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""

#         curs.execute(sql, (user_info['name'], user_info['surname'], promotion, room, category, type_of_problem,

#                            description, other, urgency, remark, state))

#         mydb.commit()

#         return jsonify({"message": "Problem submitted successfully"}), 200

#     except mysql.connector.Error as err:

#         return jsonify({"error": str(err)}), 500

#     finally:

#         curs.close()

 

# @app.route('/api/admin_dashboard', methods=['GET'])

# def admin_dashboard():

#     if 'loggedin' in session and session['role'] == 'admin':

#         try:

#             curs = mydb.cursor(dictionary=True)

#             sql = """SELECT student_name, student_surname, promotion, room, category, type_of_problem, description,

#                      urgency, remark, created_at, state FROM problems"""

#             curs.execute(sql)

#             problems = curs.fetchall()

#             curs.close()

 

#             if problems:

#                 return jsonify({"message": "Problems fetched successfully", "problems": problems}), 200

#             else:

#                 return jsonify({"message": "No problems found"}), 200

#         except mysql.connector.Error as err:

#             return jsonify({"error": str(err)}), 500

#     else:

#         return jsonify({"error": "Unauthorized access"}), 403

 

# @app.route('/api/update_problem_state', methods=['POST'])

# def update_problem_state():

#     if 'loggedin' not in session or session['role'] != 'admin':

#         return jsonify({"error": "Unauthorized access"}), 403

 

#     data = request.json

#     student_name = data.get('student_name')

#     student_surname = data.get('student_surname')

#     promotion = data.get('promotion')

#     room = data.get('room')

#     category = data.get('category')

#     type_of_problem = data.get('type_of_problem')

#     description = data.get('description')

#     new_state = data.get('new_state')

 

#     # Validation de l'état

#     valid_states = ['Soumis', 'En cours de traitement', 'Problème traité']

#     if new_state not in valid_states:

#         return jsonify({"error": "Invalid state"}), 400

 

#     # Validation des champs requis

#     if not all([student_name, student_surname, promotion, room, category, type_of_problem, description]):

#         return jsonify({"error": "Missing information to identify the problem"}), 400

 

#     # Mise à jour de l'état du problème dans la base de données avec cette combinaison de champs

#     curs = mydb.cursor(dictionary=True)

#     try:

#         sql = """UPDATE problems SET state = %s

#                  WHERE student_name = %s AND student_surname = %s

#                  AND promotion = %s AND room = %s AND category = %s

#                  AND type_of_problem = %s AND description = %s"""

#         curs.execute(sql, (new_state, student_name, student_surname, promotion, room, category, type_of_problem, description))

#         mydb.commit()

 

#         # Vérification si la mise à jour a bien été effectuée

#         if curs.rowcount == 0:

#             return jsonify({"error": "Problem not found or state not updated"}), 404

 

#         return jsonify({"message": "Problem state updated successfully"}), 200

#     except mysql.connector.Error as err:

#         return jsonify({"error": str(err)}), 500

#     finally:

#         curs.close()

 

# @app.route('/api/logout', methods=['GET'])

# def logout():

#     session.pop('loggedin', None)

#     session.pop('id', None)

#     session.pop('email', None)

#     session.pop('role', None)

#     return jsonify({"message": "Logged out successfully"}), 200

 

# if __name__ == '__main__':

#     app.run(debug=True)

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


@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    surname = data.get('surname')
    role = data.get('role', 'student')  # Default role is 'student'

    # Validation des champs
    if not all([email, password, name, surname]):
        return jsonify({"error": "Tous les champs sont obligatoires"}), 400

    try:
        curs = mydb.cursor(dictionary=True)

        # Vérifier si l'utilisateur existe déjà
        curs.execute("SELECT * FROM users WHERE email = %s", (email,))
        existing_user = curs.fetchone()
        
        if existing_user:
            return jsonify({"error": "Un utilisateur avec cet email existe déjà"}), 400
        
        # Insérer le nouvel utilisateur
        sql = "INSERT INTO users (email, password, name, surname, role) VALUES (%s, %s, %s, %s, %s)"
        curs.execute(sql, (email, password, name, surname, role))
        mydb.commit()

        return jsonify({"message": "Compte créé avec succès"}), 201
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        curs.close()


 


@app.route('/api/student_dashboard', methods=['GET'])


def student_dashboard():


    if 'loggedin' in session and session['role'] == 'student':


        # Récupérer les problèmes soumis par l'étudiant connecté


        try:


            curs = mydb.cursor(dictionary=True)


            sql = """SELECT room, category, type_of_problem, description, urgency, remark, created_at, state, message


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


    promotion = data.get('promotion')


    room = data.get('room')


    category = data.get('category')


    type_of_problem = data.get('type_of_problem')


    description = data.get('description')


    other = data.get('other')


    urgency = data.get('urgency')


    remark = data.get('remark')


    state = 'Soumis'


 


    # Validation des champs requis


    if not all([promotion, room, category, type_of_problem, description, urgency, remark]):


        return jsonify({"error": "Missing fields"}), 400


 


    # Vérification du niveau d'urgence


    if not urgency.isdigit() or int(urgency) not in [1, 2, 3]:  # Urgency doit être 1, 2 ou 3


        return jsonify({"error": "Invalid urgency level"}), 400


 


    curs = mydb.cursor(dictionary=True)


 


    try:


        # Vérification si un problème similaire a déjà été soumis (basé sur la salle, la catégorie et la date)


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


 


        # Insertion des données dans la base de données


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


 


@app.route('/api/admin_dashboard', methods=['GET'])


def admin_dashboard():


    if 'loggedin' in session and session['role'] == 'admin':


        try:


            curs = mydb.cursor(dictionary=True)


            sql = """SELECT student_name, student_surname, promotion, room, category, type_of_problem, description,


                     urgency, remark, created_at, state FROM problems"""


            curs.execute(sql)


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


 


@app.route('/api/update_problem_state', methods=['POST'])


def update_problem_state():


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


 


    # Validation de l'état


    valid_states = ['Soumis', 'En cours de traitement', 'Problème traité']


    if new_state not in valid_states:


        return jsonify({"error": "Invalid state"}), 400


 


    # Validation des champs requis


    if not all([student_name, student_surname, promotion, room, category, type_of_problem, description]):


        return jsonify({"error": "Missing information to identify the problem"}), 400


 


    # Mise à jour de l'état du problème dans la base de données avec cette combinaison de champs


    curs = mydb.cursor(dictionary=True)


    try:


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




@app.route('/api/update_problem_message', methods=['POST'])
def update_problem_message():
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


    # Mise à jour du message dans la base de données
    curs = mydb.cursor(dictionary=True)
    try:
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




 


@app.route('/api/logout', methods=['GET'])


def logout():


    session.pop('loggedin', None)


    session.pop('id', None)


    session.pop('email', None)


    session.pop('role', None)


    return jsonify({"message": "Logged out successfully"}), 200


 


if __name__ == '__main__':


    app.run(debug=True)


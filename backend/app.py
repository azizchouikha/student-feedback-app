from flask import Flask, request, jsonify # type: ignore

app = Flask(__name__)

# Route d'accueil par défaut
@app.route('/', methods=['GET'])
def home():
    return "Bienvenue sur l'API de feedback des étudiants!", 200

# Route pour recevoir les feedbacks
@app.route('/feedback', methods=['POST'])
def receive_feedback():
    data = request.json
    return jsonify({"message": "Feedback received", "data": data}), 200

if __name__ == '__main__':
    app.run(debug=True)

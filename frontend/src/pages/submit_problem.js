import { useState } from 'react';
import axios from 'axios';
import Router from 'next/router';
import styles from './submitProblem.module.css';

const SubmitProblem = () => {
    const [formData, setFormData] = useState({
        promotion: '',
        room: '',
        category: '',
        type_of_problem: '',
        description: '',
        other: '',
        urgency: '',
        remark: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/submit_problem', formData);
            alert('Problem submitted successfully');
            Router.push('/home');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to submit the problem');
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Soumettre un problème</h1>
            <form onSubmit={handleSubmit} className={styles.form}>
                {/* Liste déroulante pour la promotion */}
                <select
                    name="promotion"
                    onChange={handleChange}
                    required
                    className={styles.inputField}
                >
                    <option value="">Sélectionnez une promotion</option>
                    <option value="SN1">SN1</option>
                    <option value="SN2">SN2</option>
                    <option value="B3FS">B3FS</option>
                    <option value="B3DS">B3DS</option>
                    <option value="B3INFRA">B3INFRA</option>
                    <option value="B3WIS">B3WIS</option>
                </select>

                {/* Liste déroulante pour la salle */}
                <select
                    name="room"
                    onChange={handleChange}
                    required
                    className={styles.inputField}
                >
                    <option value="">Sélectionnez une salle</option>
                    <option value="Salle de classe">Salle de classe (SC)</option>
                    <option value="Laboratoires informatiques">Laboratoires informatiques</option>
                    <option value="Salle des serveurs">Salle des serveurs</option>
                    <option value="Salle de réunion">Salle de réunion</option>
                    <option value="Salle de conférence">Salle de conférence</option>
                    <option value="Salle de coworking">Salle de coworking</option>
                    <option value="Salle des professeurs">Salle des professeurs</option>
                    <option value="Salle de détente/zone de repos">Salle de détente/zone de repos</option>
                    <option value="Cafétéria/cantine">Cafétéria/cantine</option>
                    <option value="Toilette">Toilette</option>
                    <option value="Autre">Autre</option>
                </select>

                {/* Liste déroulante pour la catégorie */}
                <select
                    name="category"
                    onChange={handleChange}
                    required
                    className={styles.inputField}
                >
                    <option value="">Sélectionnez une catégorie</option>
                    <option value="Technologie et équipement">Technologie et équipement</option>
                    <option value="Vidéoprojecteurs">Vidéoprojecteurs</option>
                    <option value="Écrans multimédias">Écrans multimédias</option>
                    <option value="Ordinateurs et périphériques">Ordinateurs et périphériques</option>
                    <option value="Climatisation">Climatisation</option>
                    <option value="Sanitaires">Sanitaires</option>
                    <option value="Fenêtres">Fenêtres</option>
                    <option value="Classe">Classe</option>
                    <option value="Cafétéria">Cafétéria</option>
                    <option value="Extérieur">Extérieur</option>
                    <option value="Poubelles">Poubelles</option>
                    <option value="Électricité">Électricité</option>
                    <option value="Plomberie">Plomberie</option>
                    <option value="Sécurité">Sécurité</option>
                    <option value="Surveillance">Surveillance</option>
                    <option value="Mobiliers urbains">Mobiliers urbains</option>
                    <option value="Voies d'accès">Voies d'accès</option>
                    <option value="Signalisation">Signalisation</option>
                    <option value="Incivilités">Incivilités</option>
                    <option value="Alarmes et issues de secours">Alarmes et issues de secours</option>
                    <option value="Autre">Autre</option>
                </select>

                <input
                    type="text"
                    name="other"
                    placeholder="Autre (facultatif)"
                    onChange={handleChange}
                    className={styles.inputField}
                />

                <input
                    type="text"
                    name="type_of_problem"
                    placeholder="Type de problème"
                    onChange={handleChange}
                    required
                    className={styles.inputField}
                />

                <textarea
                    name="description"
                    placeholder="Description (Si SC précisez N° de la salle)"
                    onChange={handleChange}
                    required
                    className={styles.textareaField}
                ></textarea>

                {/* Liste déroulante pour l'urgence */}
                <select
                    name="urgency"
                    onChange={handleChange}
                    required
                    className={styles.inputField}
                >
                    <option value="">Sélectionnez l'urgence</option>
                    <option value="1">1 (Faible)</option>
                    <option value="2">2 (Moyenne)</option>
                    <option value="3">3 (Élevée)</option>
                </select>

                <textarea
                    name="remark"
                    placeholder="Remarque"
                    onChange={handleChange}
                    required
                    className={styles.textareaField}
                ></textarea>

                <button type="submit" className={styles.submitButton}>
                    Valider
                </button>
            </form>
        </div>
    );
};

export default SubmitProblem;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import styles from './dashboard.module.css';

const StudentDashboard = () => {
    const [problems, setProblems] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('/api/student_dashboard');
                const sortedProblems = res.data.problems
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setProblems(sortedProblems);
            } catch (error) {
                console.error('Erreur lors de la récupération des données:', error);
                setError('Échec de la récupération des données');
            }
        };

        fetchData();
    }, []);

    const navigateToAllProblems = () => {
        router.push('/all_problem');
    };

    const filteredProblems = problems.filter(problem => {
        const createdDate = new Date(problem.created_at);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        return (!start || createdDate >= start) && (!end || createdDate <= end);
    });

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Tableau de bord Étudiant - Problèmes soumis</h1>
            <div className={styles.filters}>
                <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                />
                <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                />
                <button onClick={navigateToAllProblems} className={styles.button}>
                    Voir tous les problèmes
                </button>
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Salle</th>
                        <th>Catégorie</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Autre</th>
                        <th>Remarque</th>
                        <th>Urgence</th>
                        <th>État</th>
                        <th>Message de l Admin</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProblems.map((problem, index) => (
                        <tr key={index}>
                            <td>{problem.created_at}</td>
                            <td>{problem.room}</td>
                            <td>{problem.category}</td>
                            <td>{problem.type_of_problem}</td>
                            <td>{problem.description}</td>
                            <td>{problem.other}</td>
                            <td>{problem.remark}</td>
                            <td>{problem.urgency}</td>
                            <td>{problem.state}</td>
                            <td>{problem.message || 'Aucun message pour ce problème'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default StudentDashboard;

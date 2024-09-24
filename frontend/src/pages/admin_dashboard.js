import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './studentDashboard.module.css'; // Import the shared CSS module

const AdminDashboard = () => {
    const [problems, setProblems] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const res = await axios.get('/api/admin_dashboard');
                setProblems(res.data.problems || []);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to fetch problems');
            }
        };

        fetchProblems();
    }, []);

    const handleStateChange = async (problem, newState) => {
        try {
            const res = await axios.post('/api/update_problem_state', {
                student_name: problem.student_name,
                student_surname: problem.student_surname,
                promotion: problem.promotion,
                room: problem.room,
                category: problem.category,
                type_of_problem: problem.type_of_problem,
                description: problem.description,
                new_state: newState
            });
           
            if (res.status === 200) {
                alert('Problem state updated successfully');
                // Recharger les problèmes après la mise à jour
                const updatedProblems = await axios.get('/api/admin_dashboard');
                setProblems(updatedProblems.data.problems || []);
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update the problem state');
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Admin Dashboard - Submitted Problems</h1>
            {error && <p className={styles.error}>{error}</p>}
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Promotion</th>
                        <th>Room</th>
                        <th>Category</th>
                        <th>Type of Problem</th>
                        <th>Description</th>
                        <th>Urgency</th>
                        <th>State</th>
                    </tr>
                </thead>
                <tbody>
                    {problems.map((problem, index) => (
                        <tr key={index}>
                            <td>{problem.student_name} {problem.student_surname}</td>
                            <td>{problem.promotion}</td>
                            <td>{problem.room}</td>
                            <td>{problem.category}</td>
                            <td>{problem.type_of_problem}</td>
                            <td>{problem.description}</td>
                            <td>{problem.urgency}</td>
                            <td>
                                <select
                                    className={styles.select}
                                    value={problem.state}
                                    onChange={(e) => handleStateChange(problem, e.target.value)}
                                >
                                    <option value="Soumis">Soumis</option>
                                    <option value="En cours de traitement">En cours de traitement</option>
                                    <option value="Problème traité">Problème traité</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminDashboard;

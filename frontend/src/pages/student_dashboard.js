import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StudentDashboard = () => {
    const [problems, setProblems] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('/api/student_dashboard');
                setProblems(res.data.problems || []);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to fetch data');
            }
        };

        fetchData();
    }, []);

    return (
        <div>
            <h1>Student Dashboard</h1>
            {error && <p>{error}</p>}
            <ul>
                {problems.map((problem, index) => (
                    <li key={index}>
                        <p>Salle : {problem.room}</p>
                        <p>Catégorie du problème : {problem.category}</p>
                        <p>Type de problème : {problem.type_of_problem}</p>
                        <p>Description : {problem.description}</p>
                        <p>Autre : {problem.other}</p>
                        <p>Remarque : {problem.remark}</p>
                        <span>Urgency: {problem.urgency}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default StudentDashboard;

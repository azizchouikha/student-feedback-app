import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
    const [problems, setProblems] = useState([]);
    const [error, setError] = useState('');
    const [messages, setMessages] = useState({});

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const res = await axios.get('/api/admin_dashboard');
                setProblems(res.data.problems || []);
                let initialMessages = {};
                res.data.problems.forEach(problem => {
                    const key = `${problem.student_name}-${problem.student_surname}-${problem.promotion}-${problem.room}-${problem.category}-${problem.type_of_problem}-${problem.description}`;
                    initialMessages[key] = problem.message || '';
                });
                setMessages(initialMessages);
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
                const updatedProblems = await axios.get('/api/admin_dashboard');
                setProblems(updatedProblems.data.problems || []);
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update the problem state');
        }
    };

    const handleMessageChange = (key, newMessage) => {
        setMessages({
            ...messages,
            [key]: newMessage,
        });
    };

    const handleMessageSubmit = async (problem) => {
        const key = `${problem.student_name}-${problem.student_surname}-${problem.promotion}-${problem.room}-${problem.category}-${problem.type_of_problem}-${problem.description}`;
        const message = messages[key];

        try {
            const res = await axios.post('/api/update_problem_message', {
                student_name: problem.student_name,
                student_surname: problem.student_surname,
                promotion: problem.promotion,
                room: problem.room,
                category: problem.category,
                type_of_problem: problem.type_of_problem,
                description: problem.description,
                message: message
            });

            if (res.status === 200) {
                alert('Problem message updated successfully');
                const updatedProblems = await axios.get('/api/admin_dashboard');
                setProblems(updatedProblems.data.problems || []);
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update the problem message');
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Admin Dashboard - Submitted Problems</h1>
            {error && <p className="text-red-500">{error}</p>}
            <table className="min-w-full bg-white">
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
                        <th>Message</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {problems.map((problem, index) => {
                        const key = `${problem.student_name}-${problem.student_surname}-${problem.promotion}-${problem.room}-${problem.category}-${problem.type_of_problem}-${problem.description}`;
                        return (
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
                                        value={problem.state}
                                        onChange={(e) => handleStateChange(problem, e.target.value)}
                                    >
                                        <option value="Soumis">Soumis</option>
                                        <option value="En cours de traitement">En cours de traitement</option>
                                        <option value="Problème traité">Problème traité</option>
                                    </select>
                                </td>
                                <td>
                                    <textarea
                                        value={messages[key]}
                                        onChange={(e) => handleMessageChange(key, e.target.value)}
                                    />
                                </td>
                                <td>
                                    <button onClick={() => handleMessageSubmit(problem)} className="bg-blue-500 text-white px-2 py-1 rounded">Update Message</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default AdminDashboard;

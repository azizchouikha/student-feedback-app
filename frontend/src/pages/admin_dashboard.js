import React, { useEffect, useState } from 'react';

import axios from 'axios';

 

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

        <div className="container mx-auto p-4">

            <h1 className="text-2xl font-bold mb-4">Admin Dashboard - Submitted Problems</h1>

            {error && <p className="text-red-500">{error}</p>}

            <table className="min-w-full bg-white">

                <thead>

                    <tr>

                        <th className="py-2 px-4 border">Student</th>

                        <th className="py-2 px-4 border">Promotion</th>

                        <th className="py-2 px-4 border">Room</th>

                        <th className="py-2 px-4 border">Category</th>

                        <th className="py-2 px-4 border">Type of Problem</th>

                        <th className="py-2 px-4 border">Description</th>

                        <th className="py-2 px-4 border">Urgency</th>

                        <th className="py-2 px-4 border">State</th>

                    </tr>

                </thead>

                <tbody>

                    {problems.map((problem, index) => (

                        <tr key={index}>

                            <td className="py-2 px-4 border">{problem.student_name} {problem.student_surname}</td>

                            <td className="py-2 px-4 border">{problem.promotion}</td>

                            <td className="py-2 px-4 border">{problem.room}</td>

                            <td className="py-2 px-4 border">{problem.category}</td>

                            <td className="py-2 px-4 border">{problem.type_of_problem}</td>

                            <td className="py-2 px-4 border">{problem.description}</td>

                            <td className="py-2 px-4 border">{problem.urgency}</td>

                            <td className="py-2 px-4 border">

                                <select

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
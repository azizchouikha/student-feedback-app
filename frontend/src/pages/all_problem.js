import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AllProblem = () => {
    const [problems, setProblems] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const res = await axios.get('/api/all_problems');
                setProblems(res.data.problems || []);
            } catch (err) {
                console.error('Error fetching problems:', err);
                setError('Failed to fetch problems');
            }
        };

        fetchProblems();
    }, []);

    const toggleLike = async (problem) => {
        try {
            const res = await axios.post('/api/toggle_like', {
                room: problem.room,
                category: problem.category,
                type_of_problem: problem.type_of_problem,
                description: problem.description
            });

            if (res.status === 200) {
                // Mise à jour immédiate de l'état local pour refléter le nouveau nombre de likes et l'état de like
                let updatedProblems = problems.map(p => {
                    if (p.id === problem.id) {
                        return { ...p, likes: res.data.new_likes, isLiked: res.data.liked };
                    }
                    return p;
                });
                setProblems(updatedProblems);
            }
        } catch (err) {
            console.error('Error toggling like:', err);
            alert(err.response?.data?.error || 'Failed to toggle like');
        }
    };

    return (
        <div>
            <h1>Tableau de bord Étudiant - Problèmes soumis</h1>
            {error && <p>{error}</p>}
            <table>
                <thead>
                    <tr>
                        <th>Salle</th>
                        <th>Catégorie</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Likes</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {problems.map((problem, index) => (
                        <tr key={index}>
                            <td>{problem.room}</td>
                            <td>{problem.category}</td>
                            <td>{problem.type_of_problem}</td>
                            <td>{problem.description}</td>
                            <td>{problem.likes}</td>
                            <td>
                                <button onClick={() => toggleLike(problem)}>
                                    {problem.isLiked ? 'Dislike' : 'Like'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AllProblem;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './allProblems.module.css'; // Assurez-vous que le chemin est correct

const AllProblem = () => {
    const [problems, setProblems] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const res = await axios.get('/api/all_problems');
                setProblems(res.data.problems || []);
            } catch (err) {
                console.error('Erreur lors de la récupération des problèmes:', err);
                setError('Échec de la récupération des problèmes');
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
                let updatedProblems = problems.map(p => {
                    if (p.id === problem.id) {
                        return { ...p, likes: res.data.new_likes, isLiked: res.data.liked };
                    }
                    return p;
                });
                setProblems(updatedProblems);
            }
        } catch (err) {
            console.error('Erreur lors du basculement du like:', err);
            alert(err.response?.data?.error || 'Échec du basculement du like');
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Tableau de bord Étudiant - Problèmes soumis</h1>
            {error && <p className={styles.errorMessage}>{error}</p>}
            
            <div className={styles.cardsContainer}>
                {problems.map((problem, index) => (
                    <div key={index} className={styles.card}>
                        <div className={styles.cardContent}>
                            <p><strong>Salle:</strong> {problem.room}</p>
                            <p><strong>Catégorie:</strong> {problem.category}</p>
                            <p><strong>Type:</strong> {problem.type_of_problem}</p>
                            <p><strong>Description:</strong> {problem.description}</p>
                        </div>
                        <div className={styles.likesSection}>
                            <span className={styles.likesCount}>{problem.likes} Likes</span>
                            <button onClick={() => toggleLike(problem)} className={styles.likeButton}>
                                {problem.isLiked ? '👎' : '👍'}
                            </button>

                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AllProblem;

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';


// const StudentDashboard = () => {
//     const [problems, setProblems] = useState([]);
//     const [error, setError] = useState('');


//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 const res = await axios.get('/api/student_dashboard');
//                 setProblems(res.data.problems || []);
//             } catch (error) {
//                 console.error('Error fetching data:', error);
//                 setError('Failed to fetch data');
//             }
//         };


//         fetchData();
//     }, []);


//     return (
//         <div>
//             <h1>Student Dashboard</h1>
//             {error && <p>{error}</p>}
//             <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                     <tr>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salle</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Autre</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarque</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgence</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Etat</th>
//                     </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                     {problems.map((problem, index) => (
//                         <tr key={index}>
//                             <td className="px-6 py-4 whitespace-nowrap">{problem.room}</td>
//                             <td className="px-6 py-4 whitespace-nowrap">{problem.category}</td>
//                             <td className="px-6 py-4 whitespace-nowrap">{problem.type_of_problem}</td>
//                             <td className="px-6 py-4 whitespace-nowrap">{problem.description}</td>
//                             <td className="px-6 py-4 whitespace-nowrap">{problem.other}</td>
//                             <td className="px-6 py-4 whitespace-nowrap">{problem.remark}</td>
//                             <td className="px-6 py-4 whitespace-nowrap">{problem.urgency}</td>
//                             <td className="px-6 py-4 whitespace-nowrap">{problem.state}</td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//         </div>
//     );
// };


// export default StudentDashboard;
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';  // Import useRouter for navigation
import styles from './dashboard.module.css';

const StudentDashboard = () => {
    const [problems, setProblems] = useState([]);
    const [error, setError] = useState('');
    const router = useRouter(); // Use the useRouter hook for navigation

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

    const navigateToAllProblems = () => {
        router.push('/all_problem');  // Navigate to AllProblem page
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Tableau de bord Étudiant - Problèmes soumis</h1>
            {error && <p className={styles.error}>{error}</p>}
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Salle</th>
                        <th>Catégorie</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Autre</th>
                        <th>Remarque</th>
                        <th>Urgence</th>
                        <th>État</th>
                        <th>Message de l'Admin</th>
                    </tr>
                </thead>
                <tbody>
                    {problems.map((problem, index) => (
                        <tr key={index}>
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
            <button onClick={navigateToAllProblems} className={styles.button}>
                Voir tous les problèmes
            </button>
        </div>
    );
};

export default StudentDashboard;






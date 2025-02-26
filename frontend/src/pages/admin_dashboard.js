// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import styles from './dashboard.module.css'; // Assurez-vous que le chemin est correct

// const AdminDashboard = () => {
//     const [problems, setProblems] = useState([]);
//     const [filteredProblems, setFilteredProblems] = useState([]);
//     const [error, setError] = useState('');
//     const [messages, setMessages] = useState({});

//     const [filters, setFilters] = useState({
//         student_name_surname: '',
//         promotion: '',
//         room: '',
//         category: '',
//         type_of_problem: '',
//         description: '',
//         urgency: '',
//         state: '',
//         startDate: '',
//         endDate: '',
//     });

//     useEffect(() => {
//         const fetchProblems = async () => {
//             try {
//                 const res = await axios.get('/api/admin_dashboard');
//                 const problemsData = res.data.problems || [];
//                 problemsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
//                 setProblems(problemsData);
//                 setFilteredProblems(problemsData);
//                 let initialMessages = {};
//                 problemsData.forEach(problem => {
//                     const key = `${problem.student_name}-${problem.student_surname}-${problem.promotion}-${problem.room}-${problem.category}-${problem.type_of_problem}-${problem.description}`;
//                     initialMessages[key] = problem.message || '';
//                 });
//                 setMessages(initialMessages);
//             } catch (err) {
//                 console.error('Error fetching data:', err);
//                 setError('Échec du chargement des problèmes');
//             }
//         };

//         fetchProblems();
//     }, []);

//     const handleFilterChange = (field, value) => {
//         setFilters({ ...filters, [field]: value });
//     };

//     useEffect(() => {
//         const applyFilters = () => {
//             let filtered = problems.filter(problem => {
//                 const fullName = `${problem.student_name} ${problem.student_surname}`.toLowerCase();
//                 const nameFilter = filters.student_name_surname.toLowerCase();
//                 const problemDate = new Date(problem.created_at);
//                 const startDate = filters.startDate ? new Date(filters.startDate) : null;
//                 const endDate = filters.endDate ? new Date(filters.endDate) : null;
//                 const isWithinDateRange = (!startDate || problemDate >= startDate) && (!endDate || problemDate <= endDate);
//                 const problemUrgency = String(problem.urgency);

//                 return isWithinDateRange &&
//                     (filters.student_name_surname === '' || fullName.includes(nameFilter)) &&
//                     (filters.promotion === '' || problem.promotion.includes(filters.promotion)) &&
//                     (filters.room === '' || problem.room.includes(filters.room)) &&
//                     (filters.category === '' || problem.category.includes(filters.category)) &&
//                     (filters.type_of_problem === '' || problem.type_of_problem.includes(filters.type_of_problem)) &&
//                     (filters.description === '' || problem.description.toLowerCase().includes(filters.description.toLowerCase())) &&
//                     (filters.urgency === '' || problemUrgency.includes(filters.urgency)) &&
//                     (filters.state === '' || problem.state.includes(filters.state));
//             });
//             setFilteredProblems(filtered);
//         };

//         applyFilters();
//     }, [filters, problems]);

//     return (
//         <div className={styles.container}>
//             <h1 className={styles.title}>Tableau de bord d'administration - Problèmes soumis</h1>
//             {error && <p className={styles.error}>{error}</p>}
//             <div className={styles.filters}>
//                 {/* Les filtres sont affichés ici */}
//                 <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', marginBottom: '20px' }}>
//                     <div style={{ width: '20%' }}>
//                         <input
//                             type="date"
//                             style={{ width: '100%' }}
//                             placeholder="Date de début"
//                             value={filters.startDate}
//                             onChange={e => handleFilterChange('startDate', e.target.value)}
//                         />
//                         <input
//                             type="date"
//                             style={{ width: '100%' }}
//                             placeholder="Date de fin"
//                             value={filters.endDate}
//                             onChange={e => handleFilterChange('endDate', e.target.value)}
//                         />
//                     </div>
//                     <input
//                         type="text"
//                         style={{ width: '20%' }}
//                         placeholder="Nom et Prénom"
//                         value={filters.student_name_surname}
//                         onChange={e => handleFilterChange('student_name_surname', e.target.value)}
//                     />
//                     <input
//                         type="text"
//                         style={{ width: '10%' }}
//                         placeholder="Promotion"
//                         value={filters.promotion}
//                         onChange={e => handleFilterChange('promotion', e.target.value)}
//                     />
//                     <input
//                         type="text"
//                         style={{ width: '10%' }}
//                         placeholder="Salle"
//                         value={filters.room}
//                         onChange={e => handleFilterChange('room', e.target.value)}
//                     />
//                     <input
//                         type="text"
//                         style={{ width: '10%' }}
//                         placeholder="Catégorie"
//                         value={filters.category}
//                         onChange={e => handleFilterChange('category', e.target.value)}
//                     />
//                     <input
//                         type="text"
//                         style={{ width: '10%' }}
//                         placeholder="Type de problème"
//                         value={filters.type_of_problem}
//                         onChange={e => handleFilterChange('type_of_problem', e.target.value)}
//                     />
//                     <input
//                         type="text"
//                         style={{ width: '10%' }}
//                         placeholder="Description"
//                         value={filters.description}
//                         onChange={e => handleFilterChange('description', e.target.value)}
//                     />
//                     <input
//                         type="text"
//                         style={{ width: '10%' }}
//                         placeholder="Urgence"
//                         value={filters.urgency}
//                         onChange={e => handleFilterChange('urgency', e.target.value)}
//                     />
//                     <select
//                         style={{ width: '10%' }}
//                         value={filters.state}
//                         onChange={e => handleFilterChange('state', e.target.value)}
//                     >
//                         <option value="">Tous les statuts</option>
//                         <option value="Soumis">Soumis</option>
//                         <option value="En cours de traitement">En cours de traitement</option>
//                         <option value="Problème traité">Problème traité</option>
//                     </select>
//                 </div>
//             </div>
//             <table className={styles.table}>
//                 <thead>
//                     <tr>
//                         <th>Date de création</th>
//                         <th>Étudiant</th>
//                         <th>Promotion</th>
//                         <th>Salle</th>
//                         <th>Catégorie</th>
//                         <th>Type de problème</th>
//                         <th>Description</th>
//                         <th>Autre</th>
//                         <th>Urgence</th>
//                         <th>Like</th>
//                         <th>Remarque</th>
//                         <th>Statut</th>
//                         <th>Message</th>
//                         <th>Action</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {filteredProblems.map((problem, index) => {
//                         const key = `${problem.student_name}-${problem.student_surname}-${problem.promotion}-${problem.room}-${problem.category}-${problem.type_of_problem}-${problem.description}`;
//                         return (
//                             <tr key={index}>
//                                 <td>{problem.created_at}</td>
//                                 <td>{problem.student_name} {problem.student_surname}</td>
//                                 <td>{problem.promotion}</td>
//                                 <td>{problem.room}</td>
//                                 <td>{problem.category}</td>
//                                 <td>{problem.type_of_problem}</td>
//                                 <td>{problem.description}</td>
//                                 <td>{problem.other}</td>
//                                 <td>{problem.urgency}</td>
//                                 <td>{problem.likes}</td>
//                                 <td>{problem.remark}</td>
//                                 <td>
//                                     <select
//                                         value={problem.state}
//                                         onChange={(e) => handleStateChange(problem, e.target.value)}
//                                     >
//                                         <option value="Soumis">Soumis</option>
//                                         <option value="En cours de traitement">En cours de traitement</option>
//                                         <option value="Problème traité">Problème traité</option>
//                                     </select>
//                                 </td>
//                                 <td>
//                                     <textarea
//                                         value={messages[key]}
//                                         onChange={(e) => handleMessageChange(key, e.target.value)}
//                                     />
//                                 </td>
//                                 <td>
//                                     <button onClick={() => handleMessageSubmit(problem)} className={styles.button}>Envoyer</button>
//                                 </td>
//                             </tr>
//                         );
//                     })}
//                 </tbody>
//             </table>
//         </div>
//     );
// };

// export default AdminDashboard;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './dashboard.module.css'; // Assurez-vous que le chemin est correct

const AdminDashboard = () => {
    const [problems, setProblems] = useState([]);
    const [filteredProblems, setFilteredProblems] = useState([]);
    const [error, setError] = useState('');
    const [messages, setMessages] = useState({});

    const [filters, setFilters] = useState({
        student_name_surname: '',
        promotion: '',
        room: '',
        category: '',
        type_of_problem: '',
        description: '',
        urgency: '',
        state: '',
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const res = await axios.get('/api/admin_dashboard');
                const problemsData = res.data.problems || [];
                problemsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setProblems(problemsData);
                setFilteredProblems(problemsData);
                let initialMessages = {};
                problemsData.forEach(problem => {
                    const key = `${problem.student_name}-${problem.student_surname}-${problem.promotion}-${problem.room}-${problem.category}-${problem.type_of_problem}-${problem.description}`;
                    initialMessages[key] = problem.message || '';
                });
                setMessages(initialMessages);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Échec du chargement des problèmes');
            }
        };

        fetchProblems();
    }, []);

    const handleFilterChange = (field, value) => {
        setFilters({ ...filters, [field]: value });
    };

    useEffect(() => {
        const applyFilters = () => {
            let filtered = problems.filter(problem => {
                const fullName = `${problem.student_name} ${problem.student_surname}`.toLowerCase();
                const nameFilter = filters.student_name_surname.toLowerCase();
                const problemDate = new Date(problem.created_at);
                const startDate = filters.startDate ? new Date(filters.startDate) : null;
                const endDate = filters.endDate ? new Date(filters.endDate) : null;
                const isWithinDateRange = (!startDate || problemDate >= startDate) && (!endDate || problemDate <= endDate);
                const problemUrgency = String(problem.urgency);

                return isWithinDateRange &&
                    (filters.student_name_surname === '' || fullName.includes(nameFilter)) &&
                    (filters.promotion === '' || problem.promotion.includes(filters.promotion)) &&
                    (filters.room === '' || problem.room.includes(filters.room)) &&
                    (filters.category === '' || problem.category.includes(filters.category)) &&
                    (filters.type_of_problem === '' || problem.type_of_problem.includes(filters.type_of_problem)) &&
                    (filters.description === '' || problem.description.toLowerCase().includes(filters.description.toLowerCase())) &&
                    (filters.urgency === '' || problemUrgency.includes(filters.urgency)) &&
                    (filters.state === '' || problem.state.includes(filters.state));
            });
            setFilteredProblems(filtered);
        };

        applyFilters();
    }, [filters, problems]);

    // Définition de la fonction handleStateChange
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
                setFilteredProblems(updatedProblems.data.problems || []);
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update the problem state');
        }
    };

    // Définition de la fonction handleMessageSubmit
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
                alert('Message mis à jour avec succès');
                const updatedProblems = await axios.get('/api/admin_dashboard');
                setProblems(updatedProblems.data.problems || []);
                setFilteredProblems(updatedProblems.data.problems || []);
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update the problem message');
        }
    };

    const handleMessageChange = (key, newMessage) => {
        setMessages({
            ...messages,
            [key]: newMessage,
        });
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Tableau de bord d administration - Problèmes soumis</h1>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.filters}>
                {/* Les filtres sont affichés ici */}
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ width: '20%' }}>
                        <input
                            type="date"
                            style={{ width: '100%' }}
                            placeholder="Date de début"
                            value={filters.startDate}
                            onChange={e => handleFilterChange('startDate', e.target.value)}
                        />
                        <input
                            type="date"
                            style={{ width: '100%' }}
                            placeholder="Date de fin"
                            value={filters.endDate}
                            onChange={e => handleFilterChange('endDate', e.target.value)}
                        />
                    </div>
                    <input
                        type="text"
                        style={{ width: '20%' }}
                        placeholder="Nom et Prénom"
                        value={filters.student_name_surname}
                        onChange={e => handleFilterChange('student_name_surname', e.target.value)}
                    />
                    <input
                        type="text"
                        style={{ width: '10%' }}
                        placeholder="Promotion"
                        value={filters.promotion}
                        onChange={e => handleFilterChange('promotion', e.target.value)}
                    />
                    <input
                        type="text"
                        style={{ width: '10%' }}
                        placeholder="Salle"
                        value={filters.room}
                        onChange={e => handleFilterChange('room', e.target.value)}
                    />
                    <input
                        type="text"
                        style={{ width: '10%' }}
                        placeholder="Catégorie"
                        value={filters.category}
                        onChange={e => handleFilterChange('category', e.target.value)}
                    />
                    <input
                        type="text"
                        style={{ width: '10%' }}
                        placeholder="Type de problème"
                        value={filters.type_of_problem}
                        onChange={e => handleFilterChange('type_of_problem', e.target.value)}
                    />
                    <input
                        type="text"
                        style={{ width: '10%' }}
                        placeholder="Description"
                        value={filters.description}
                        onChange={e => handleFilterChange('description', e.target.value)}
                    />
                    <input
                        type="text"
                        style={{ width: '10%' }}
                        placeholder="Urgence"
                        value={filters.urgency}
                        onChange={e => handleFilterChange('urgency', e.target.value)}
                    />
                    <select
                        style={{ width: '10%' }}
                        value={filters.state}
                        onChange={e => handleFilterChange('state', e.target.value)}
                    >
                        <option value="">Tous les statuts</option>
                        <option value="Soumis">Soumis</option>
                        <option value="En cours de traitement">En cours de traitement</option>
                        <option value="Problème traité">Problème traité</option>
                    </select>
                </div>
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Date de création</th>
                        <th>Étudiant</th>
                        <th>Promotion</th>
                        <th>Salle</th>
                        <th>Catégorie</th>
                        <th>Type de problème</th>
                        <th>Description</th>
                        <th>Autre</th>
                        <th>Urgence</th>
                        <th>Like</th>
                        <th>Remarque</th>
                        <th>Statut</th>
                        <th>Message</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProblems.map((problem, index) => {
                        const key = `${problem.student_name}-${problem.student_surname}-${problem.promotion}-${problem.room}-${problem.category}-${problem.type_of_problem}-${problem.description}`;
                        return (
                            <tr key={index}>
                                <td>{problem.created_at}</td>
                                <td>{problem.student_name} {problem.student_surname}</td>
                                <td>{problem.promotion}</td>
                                <td>{problem.room}</td>
                                <td>{problem.category}</td>
                                <td>{problem.type_of_problem}</td>
                                <td>{problem.description}</td>
                                <td>{problem.other}</td>
                                <td>{problem.urgency}</td>
                                <td>{problem.likes}</td>
                                <td>{problem.remark}</td>
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
                                    <button onClick={() => handleMessageSubmit(problem)} className={styles.button}>Envoyer</button>
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

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';
import { problemsAPI } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Problem } from '@/types';
import { LoadingPage } from '@/components/ui/LoadingPage';
import { toast } from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend } from 'recharts';
import { authAPI } from '@/lib/api';

interface ProblemWithUser extends Problem {
    student_name: string;
    student_surname: string;
    likes: number;
}

export default function AdminDashboardPage() {
    const [problems, setProblems] = useState<ProblemWithUser[]>([]);
    const [error, setError] = useState('');
    const [messages, setMessages] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterState, setFilterState] = useState<string[]>([]);
    const [filterUrgency, setFilterUrgency] = useState<number[]>([]);
    const [filterDate, setFilterDate] = useState<string>('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    // Vérifier l'authentification et les permissions
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        
        if (user?.role !== 'admin') {
            router.push('/dashboard');
            return;
        }
    }, [isAuthenticated, user, router]);

    useEffect(() => {
        fetchProblems();
    }, []);

    const fetchProblems = async () => {
        try {
            setIsLoading(true);
            const problemsData = await problemsAPI.getAll();
            
            // S'assurer que problemsData est un tableau
            if (!Array.isArray(problemsData)) {
                console.error('API returned non-array data:', problemsData);
                setProblems([]);
                setError('Format de données incorrect');
                return;
            }
            
            setProblems(problemsData);
            
            // Initialiser les messages
            const initialMessages: Record<string, string> = {};
            problemsData.forEach((problem: ProblemWithUser) => {
                const key = `${problem.user.name}-${problem.user.surname}-${problem.promotion}-${problem.room}-${problem.category}-${problem.type_of_problem}-${problem.description}`;
                initialMessages[key] = problem.message || '';
            });
            setMessages(initialMessages);
        } catch (err) {
            console.error('Error fetching problems:', err);
            setError('Erreur lors du chargement des problèmes');
            setProblems([]); // S'assurer que problems est un tableau vide en cas d'erreur
        } finally {
            setIsLoading(false);
        }
    };

    const handleStateChange = async (problem: ProblemWithUser, newState: string) => {
        try {
            await problemsAPI.update(problem.id, { state: newState });
            toast.success('Statut mis à jour avec succès');
            await fetchProblems(); // Recharger les données
        } catch (err) {
            console.error('Error updating problem state:', err);
            toast.error('Erreur lors de la mise à jour du statut');
        }
    };

    const handleMessageChange = (key: string, newMessage: string) => {
        setMessages(prev => ({
            ...prev,
            [key]: newMessage,
        }));
    };

    const handleMessageSubmit = async (problem: ProblemWithUser) => {
        const key = `${problem.user.name}-${problem.user.surname}-${problem.promotion}-${problem.room}-${problem.category}-${problem.type_of_problem}-${problem.description}`;
        const message = messages[key];

        try {
            await problemsAPI.update(problem.id, { message });
            toast.success('Message mis à jour avec succès');
            await fetchProblems(); // Recharger les données
        } catch (err) {
            console.error('Error updating problem message:', err);
            toast.error('Erreur lors de la mise à jour du message');
        }
    };

    // --- Calcul des stats ---
    const total = problems.length;
    const enCours = problems.filter(p => p.state === 'En cours de traitement').length;
    const traites = problems.filter(p => p.state === 'Problème traité').length;
    const soumis = problems.filter(p => p.state === 'Soumis').length;

    // Répartition par catégorie
    const categories = Array.from(new Set(problems.map(p => p.category)));
    const pieData = categories.map(cat => ({
        name: cat,
        value: problems.filter(p => p.category === cat).length
    }));
    const pieColors = ['#2563eb', '#facc15', '#f87171', '#34d399', '#a78bfa', '#f472b6', '#60a5fa', '#fbbf24', '#4ade80', '#f87171'];

    // Répartition par urgence
    const urgences = [1, 2, 3];
    const barData = urgences.map(u => ({
        name: `Urgence ${u}`,
        count: problems.filter(p => p.urgency === u).length
    }));
    const barColors = ['#4ade80', '#fde68a', '#f87171'];

    // --- Fin stats ---

    // --- Filtres dynamiques ---
    const dateOptions = [
        { value: '', label: 'Toutes les dates' },
        { value: 'today', label: "Aujourd'hui" },
        { value: 'yesterday', label: 'Hier' },
        { value: 'week', label: 'Cette semaine' },
        { value: 'month', label: 'Ce mois-ci' },
    ];

    const filteredProblems = useMemo(() => {
        return problems.filter((p) => {
            // Recherche globale
            const searchText = `${p.user.name} ${p.user.surname} ${p.promotion} ${p.room} ${p.category} ${p.type_of_problem} ${p.description}`.toLowerCase();
            if (search && !searchText.includes(search.toLowerCase())) return false;
            // Filtre statut
            if (filterState.length > 0 && !filterState.includes(p.state)) return false;
            // Filtre urgence
            if (filterUrgency.length > 0 && !filterUrgency.includes(p.urgency)) return false;
            // Filtre date
            const created = new Date(p.created_at);
            const now = new Date();
            if (filterDate === 'today') {
                if (created.toDateString() !== now.toDateString()) return false;
            } else if (filterDate === 'yesterday') {
                const yesterday = new Date();
                yesterday.setDate(now.getDate() - 1);
                if (created.toDateString() !== yesterday.toDateString()) return false;
            } else if (filterDate === 'week') {
                const weekAgo = new Date();
                weekAgo.setDate(now.getDate() - 7);
                if (created < weekAgo) return false;
            } else if (filterDate === 'month') {
                if (created.getMonth() !== now.getMonth() || created.getFullYear() !== now.getFullYear()) return false;
            }
            return true;
        });
    }, [problems, search, filterState, filterUrgency, filterDate]);

    // --- Options de filtres ---
    const stateOptions = ['Soumis', 'En cours de traitement', 'Problème traité', 'Rejeté', 'Doublon'];
    const urgencyOptions = [1, 2, 3];

    // --- Gestion des badges de filtres actifs ---
    const activeBadges = [
        ...filterState.map(s => ({ type: 'state', value: s, label: `Statut: ${s}` })),
        ...filterUrgency.map(u => ({ type: 'urgency', value: u, label: `Urgence: ${u}` })),
        ...(filterDate && filterDate !== '' ? [{ type: 'date', value: filterDate, label: dateOptions.find(d => d.value === filterDate)?.label || '' }] : []),
        ...(search ? [{ type: 'search', value: search, label: `Recherche: "${search}"` }] : []),
    ];

    const removeBadge = (badge: any) => {
        if (badge.type === 'state') setFilterState(fs => fs.filter(s => s !== badge.value));
        if (badge.type === 'urgency') setFilterUrgency(fu => fu.filter(u => u !== badge.value));
        if (badge.type === 'date') setFilterDate('');
        if (badge.type === 'search') setSearch('');
    };

    const allSelected = filteredProblems.length > 0 && filteredProblems.every(p => selectedIds.includes(p.id));
    const someSelected = selectedIds.length > 0;

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredProblems.map(p => p.id));
        }
    };
    const toggleSelect = (id: number) => {
        setSelectedIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
    };

    const handleBulkMarkAsTreated = async () => {
        for (const id of selectedIds) {
            const problem = filteredProblems.find(p => p.id === id);
            if (problem && problem.state !== 'Problème traité') {
                await problemsAPI.update(id, { state: 'Problème traité' });
            }
        }
        toast.success('Problèmes sélectionnés marqués comme traités');
        setSelectedIds([]);
        await fetchProblems();
    };

    const handleLogout = async () => {
        try {
            await authAPI.logout();
            toast.success('Déconnexion réussie');
            router.push('/login');
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            toast.error('Erreur lors de la déconnexion');
        }
    };

    if (isLoading) {
        return (
            <LoadingPage 
                title="Chargement du tableau d'administration"
                message="Récupération des problèmes soumis en cours..."
            />
        );
    }

    return (
        <div className={styles.container}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Tableau de bord d&apos;administration - Problèmes soumis</h1>
                <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow-md ml-0 sm:ml-4 self-start sm:self-auto"
                    title="Se déconnecter"
                >
                    <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16,17 21,12 16,7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span className="hidden sm:inline">Déconnexion</span>
                </button>
            </div>
            
            {/* Bannière de stats */}
            <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
                    <span className="text-2xl font-bold text-blue-700">{total}</span>
                    <span className="text-gray-500 text-sm">Total</span>
                </div>
                <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
                    <span className="text-2xl font-bold text-yellow-600">{enCours}</span>
                    <span className="text-gray-500 text-sm">En cours</span>
                </div>
                <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
                    <span className="text-2xl font-bold text-green-600">{traites}</span>
                    <span className="text-gray-500 text-sm">Traités</span>
                </div>
                <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
                    <span className="text-2xl font-bold text-blue-400">{soumis}</span>
                    <span className="text-gray-500 text-sm">Soumis</span>
                </div>
            </div>
            <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-xl shadow p-4">
                    <h2 className="text-lg font-semibold mb-2 text-blue-700">Répartition par catégorie</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {pieData.map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Légende de couleur dynamique */}
                    <div className="flex flex-wrap gap-3 mt-4 justify-center">
                        {pieData.map((entry, idx) => (
                            <div key={entry.name} className="flex items-center gap-2">
                                <span style={{ backgroundColor: pieColors[idx % pieColors.length], width: 16, height: 16, borderRadius: '50%', display: 'inline-block' }}></span>
                                <span className="text-sm text-gray-700">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                    <h2 className="text-lg font-semibold mb-2 text-blue-700">Répartition par urgence</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={barData}>
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#2563eb">
                                {barData.map((entry, idx) => (
                                    <Cell key={`bar-${idx}`} fill={barColors[idx % barColors.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            {/* Filtres dynamiques déplacés ici */}
            <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row md:items-end gap-4 mb-6 mt-2">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Recherche (étudiant, salle, catégorie, description...)"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {/* Statut */}
                    {stateOptions.map(s => (
                        <button
                            key={s}
                            className={`px-3 py-1 rounded-full border text-sm font-medium transition-colors ${filterState.includes(s) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'}`}
                            onClick={() => setFilterState(fs => fs.includes(s) ? fs.filter(x => x !== s) : [...fs, s])}
                        >
                            {s}
                        </button>
                    ))}
                    {/* Urgence */}
                    {urgencyOptions.map(u => (
                        <button
                            key={u}
                            className={`px-3 py-1 rounded-full border text-sm font-medium transition-colors ${filterUrgency.includes(u) ? 'bg-yellow-400 text-white border-yellow-400' : 'bg-white text-yellow-600 border-yellow-300 hover:bg-yellow-50'}`}
                            onClick={() => setFilterUrgency(fu => fu.includes(u) ? fu.filter(x => x !== u) : [...fu, u])}
                        >
                            Urgence {u}
                        </button>
                    ))}
                    {/* Date */}
                    <select
                        value={filterDate}
                        onChange={e => setFilterDate(e.target.value)}
                        className="px-3 py-1 rounded-full border text-sm font-medium bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        {dateOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>
            {/* Badges de filtres actifs */}
            {activeBadges.length > 0 && (
                <div className="w-full max-w-6xl mx-auto flex flex-wrap gap-2 mb-4">
                    {activeBadges.map((badge, idx) => (
                        <span key={idx} className="inline-flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                            {badge.label}
                            <button onClick={() => removeBadge(badge)} className="ml-2 text-blue-500 hover:text-blue-800 font-bold">&times;</button>
                        </span>
                    ))}
                </div>
            )}
            
            {/* Bouton action groupée - déplacé au-dessus du tableau à gauche */}
            <div className="w-full max-w-6xl mx-auto flex justify-start gap-4 mb-4">
                <button
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors shadow ${someSelected ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    disabled={!someSelected}
                    onClick={handleBulkMarkAsTreated}
                    title="Marquer tous les problèmes sélectionnés comme traités"
                >
                    <svg 
                        width="18" 
                        height="18" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <path d="M20 6L9 17L4 12" />
                    </svg>
                    <span className="hidden sm:inline">Marquer comme traité</span>
                </button>
            </div>
            
            {error && <p className={styles.error}>{error}</p>}
            
            <div className="w-full max-w-full overflow-x-auto">
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={toggleSelectAll}
                                className="accent-blue-600 w-5 h-5"
                            />
                        </th>
                        <th>Étudiant</th>
                        <th>Promotion</th>
                        <th>Salle</th>
                        <th>Catégorie</th>
                        <th>Type de problème</th>
                        <th>Description</th>
                        <th>Urgence</th>
                        <th>Statut</th>
                        <th>Likes</th>
                        <th>Message</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProblems.map((problem, index) => {
                        const key = `${problem.user.name}-${problem.user.surname}-${problem.promotion}-${problem.room}-${problem.category}-${problem.type_of_problem}-${problem.description}`;
                        return (
                            <tr key={problem.id || index}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(problem.id)}
                                        onChange={() => toggleSelect(problem.id)}
                                        className="accent-blue-600 w-5 h-5"
                                    />
                                </td>
                                <td className="font-medium">{problem.user.name} {problem.user.surname}</td>
                                <td>{problem.promotion}</td>
                                <td>{problem.room}</td>
                                <td>{problem.category}</td>
                                <td>{problem.type_of_problem}</td>
                                <td className="max-w-xs">
                                    <div className="break-words">
                                        {problem.description}
                                    </div>
                                </td>
                                <td>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        problem.urgency === 1 ? 'bg-green-100 text-green-800' :
                                        problem.urgency === 2 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {problem.urgency}
                                    </span>
                                </td>
                                <td>
                                    <select
                                        value={problem.state}
                                        onChange={(e) => handleStateChange(problem, e.target.value)}
                                        className={styles.select}
                                    >
                                        <option value="Soumis">Soumis</option>
                                        <option value="En cours de traitement">En cours de traitement</option>
                                        <option value="Problème traité">Problème traité</option>
                                        <option value="Rejeté">Rejeté</option>
                                        <option value="Doublon">Doublon</option>
                                    </select>
                                </td>
                                <td className="text-center font-semibold">{problem.likes_count || 0}</td>
                                <td>
                                    <textarea
                                        value={messages[key] || ''}
                                        onChange={(e) => handleMessageChange(key, e.target.value)}
                                        className={styles.textarea}
                                        placeholder="Message pour l'étudiant..."
                                    />
                                </td>
                                <td>
                                    <button 
                                        onClick={() => handleMessageSubmit(problem)} 
                                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                        title="Envoyer le message"
                                    >
                                        <svg 
                                            width="20" 
                                            height="20" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                            className="transform hover:scale-110 transition-transform duration-200"
                                        >
                                            <path d="M22 2L11 13" />
                                            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            </div>
            
            {filteredProblems.length === 0 && !error && (
                <p className={styles.noData}>Aucun problème soumis pour le moment.</p>
            )}
        </div>
    );
} 
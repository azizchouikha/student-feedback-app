'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { problemsAPI } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Problem } from '@/types';
import { Card } from '@/components/ui/Card';
import { LoadingPage } from '@/components/ui/LoadingPage';
import { useLoadingWithDelay } from '@/hooks/useLoadingWithDelay';
import { authAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function StudentDashboardPage() {
    const [problems, setProblems] = useState<Problem[]>([]);
    const [error, setError] = useState('');
    const { isLoading, showContent, setLoading } = useLoadingWithDelay({ delay: 1000 });
    
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();

    // Vérifier l'authentification
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
    }, [isAuthenticated, router]);

    useEffect(() => {
        fetchProblems();
    }, []);

    const fetchProblems = async () => {
        try {
            setLoading(true);
            const problemsData = await problemsAPI.getAll();
            console.log('problems:', problemsData);
            setProblems(problemsData);
        } catch (err) {
            console.error('Error fetching problems:', err);
            setError('Erreur lors du chargement des problèmes');
        } finally {
            setLoading(false);
        }
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
                title="Chargement du tableau de bord"
                message="Récupération de vos problèmes en cours..."
            />
        );
    }

    return (
        <div className={`min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-blue-50 to-white py-8 px-4 transition-opacity duration-300 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
            <Card className="w-full max-w-7xl mx-auto animate-fade-in">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-center text-gray-900">Tableau de bord Étudiant - Problèmes soumis</h1>
                    <button
                        onClick={handleLogout}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow-md"
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
                <div className="flex flex-col md:flex-row justify-center gap-4 mb-8">
                    <Link href="/submit-problem" className="bg-blue-600 text-white rounded-lg px-6 py-3 font-semibold text-center hover:bg-blue-700 transition-colors w-full md:w-auto shadow-md">
                        Soumettre un nouveau problème
                    </Link>
                    <Link href="/all-problems" className="bg-blue-100 text-blue-700 rounded-lg px-6 py-3 font-semibold text-center hover:bg-blue-200 transition-colors w-full md:w-auto shadow-md">
                        Voir tous les problèmes
                    </Link>
                </div>
                {error && <div className="bg-red-100 text-red-700 px-6 py-4 rounded-lg mb-6 text-center font-medium">{error}</div>}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 bg-white rounded-xl shadow-lg">
                        <thead className="bg-blue-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Salle</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Catégorie</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Autre</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Remarque</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Urgence</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">État</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Message de l&apos;Admin</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {problems.map((problem, index) => (
                                <tr key={problem.id || index} className="hover:bg-blue-50 transition-colors">
                                    <td className="px-6 py-4 text-gray-900 font-medium">{problem.room}</td>
                                    <td className="px-6 py-4 text-gray-900">{problem.category}</td>
                                    <td className="px-6 py-4 text-gray-900">{problem.type_of_problem}</td>
                                    <td className="px-6 py-4 max-w-xs">
                                        <div className="break-words text-gray-900">
                                            {problem.description}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-900">{problem.other || "-"}</td>
                                    <td className="px-6 py-4 text-gray-900">{problem.remark}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                            problem.urgency === 1
                                                ? "bg-green-100 text-green-800"
                                                : problem.urgency === 2
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-red-100 text-red-800"
                                        }`}>
                                            {problem.urgency}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                            problem.state === "Soumis"
                                                ? "bg-blue-100 text-blue-800"
                                                : problem.state === "En cours de traitement"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : problem.state === "Problème traité"
                                                ? "bg-green-100 text-green-800"
                                                : problem.state === "Rejeté"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-gray-100 text-gray-800"
                                        }`}>
                                            {problem.state}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                                        <div className="break-words">
                                            {problem.message || "Aucun message pour ce problème"}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {problems.length === 0 && !error && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg mb-4">Aucun problème soumis pour le moment.</p>
                        <Link href="/submit-problem" className="bg-blue-600 text-white rounded-lg px-6 py-3 font-semibold text-center hover:bg-blue-700 transition-colors shadow-md">
                            Soumettre votre premier problème
                        </Link>
                    </div>
                )}
            </Card>
        </div>
    );
} 
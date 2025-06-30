'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { problemsAPI } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Problem } from '@/types';
import { toast } from 'react-hot-toast';
import { FaRegHeart, FaHeart } from 'react-icons/fa';
import { LoadingPage } from '@/components/ui/LoadingPage';

export default function AllProblemsPage() {
    const [problems, setProblems] = useState<Problem[]>([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
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
        fetchAllProblems();
    }, []);

    const fetchAllProblems = async () => {
        try {
            setIsLoading(true);
            const problemsData = await problemsAPI.getAllProblems();
            setProblems(problemsData);
        } catch (err) {
            console.error('Error fetching all problems:', err);
            setError('Erreur lors du chargement des problèmes');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLike = async (problemId: number) => {
        setProblems((prev) => prev.map(p => p.id === problemId ? { ...p, likeLoading: true } : p));
        try {
            await problemsAPI.like(problemId);
            setProblems((prev) => prev.map(p =>
                p.id === problemId
                    ? {
                        ...p,
                        is_liked: !p.is_liked,
                        likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1,
                        likeLoading: false
                    }
                    : p
            ));
        } catch (err) {
            toast.error("Erreur lors du like");
            setProblems((prev) => prev.map(p => p.id === problemId ? { ...p, likeLoading: false } : p));
        }
    };

    if (isLoading) {
        return (
            <LoadingPage 
                title="Chargement des problèmes"
                message="Récupération de tous les problèmes en cours..."
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8 px-2">
            <div className="flex justify-between items-center mb-8 max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900">Tous les problèmes</h1>
                <Link 
                    href="/submit-problem"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow"
                >
                    Soumettre un problème
                </Link>
            </div>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 max-w-3xl mx-auto">
                    {error}
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {problems
                    .filter(problem => problem.state !== 'Problème traité')
                    .map((problem) => (
                        <div key={problem.id} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-3 hover:shadow-xl transition-shadow border border-blue-50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">{problem.category}</span>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    problem.urgency === 1 ? 'bg-green-100 text-green-800' :
                                    problem.urgency === 2 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                    Urgence {problem.urgency}
                                </span>
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 mb-1">{problem.type_of_problem}</h2>
                            <p className="text-gray-700 mb-2">{problem.description}</p>
                            <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-2">
                                <span className="bg-gray-100 px-2 py-1 rounded">Salle : {problem.room}</span>
                                <span className="bg-gray-100 px-2 py-1 rounded">Promotion : {problem.promotion}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-2">
                                <span className="bg-gray-100 px-2 py-1 rounded">État : <span className={`font-semibold ${
                                    problem.state === 'Soumis' ? 'text-blue-700' :
                                    problem.state === 'En cours de traitement' ? 'text-yellow-700' :
                                    problem.state === 'Problème traité' ? 'text-green-700' :
                                    problem.state === 'Rejeté' ? 'text-red-700' :
                                    'text-gray-700'
                                }`}>{problem.state}</span></span>
                            </div>
                            {problem.remark && <div className="text-sm text-gray-600 italic mb-2">Remarque : {problem.remark}</div>}
                            <div className="flex items-center gap-3 mt-auto">
                                <button
                                    className={`flex items-center gap-1 text-lg focus:outline-none transition-colors ${problem.is_liked ? 'text-pink-600' : 'text-gray-400'} ${problem.likeLoading ? 'opacity-50 pointer-events-none' : ''}`}
                                    onClick={() => handleLike(problem.id)}
                                    disabled={problem.likeLoading}
                                    aria-label={problem.is_liked ? 'Retirer le like' : 'Liker'}
                                >
                                    {problem.is_liked ? <FaHeart /> : <FaRegHeart />}
                                    <span className="text-base font-semibold ml-1">{problem.likes_count}</span>
                                </button>
                            </div>
                        </div>
                    ))}
            </div>
            {problems.length === 0 && !error && (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg mb-4">Aucun problème n&apos;a été soumis pour le moment.</p>
                    <Link 
                        href="/submit-problem"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Être le premier à soumettre un problème
                    </Link>
                </div>
            )}
            <div className="mt-6 max-w-6xl mx-auto">
                <Link 
                    href="/dashboard"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                    ← Retour au tableau de bord
                </Link>
            </div>
        </div>
    );
} 
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { LoadingPage } from '@/components/ui/LoadingPage';

export default function DashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Rediriger selon le rôle
        if (user?.role === 'admin') {
            router.push('/admin');
        } else {
            router.push('/student');
        }
    }, [isAuthenticated, user, router]);

    return (
        <LoadingPage 
            title="Redirection en cours..."
            message="Merci de patienter, nous vous connectons à votre espace personnalisé."
        />
    );
} 
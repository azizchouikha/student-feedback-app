import { useEffect, useState } from 'react';
import { LoadingPage } from './LoadingPage';

interface PageTransitionProps {
    children: React.ReactNode;
    loadingMessage?: string;
    loadingTitle?: string;
    delay?: number; // Délai minimum d'affichage du loading en ms
}

export function PageTransition({ 
    children, 
    loadingMessage = "Chargement de la page...",
    loadingTitle = "Veuillez patienter",
    delay = 500 
}: PageTransitionProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        // Délai minimum pour éviter le flash
        const timer = setTimeout(() => {
            setIsLoading(false);
            setShowContent(true);
        }, delay);

        return () => clearTimeout(timer);
    }, [delay]);

    if (isLoading) {
        return (
            <LoadingPage 
                title={loadingTitle}
                message={loadingMessage}
                showCard={true}
            />
        );
    }

    return (
        <div className={`animate-fade-in ${showContent ? 'opacity-100' : 'opacity-0'}`}>
            {children}
        </div>
    );
} 
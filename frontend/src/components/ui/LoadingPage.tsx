import { Card } from './Card';

interface LoadingPageProps {
    message?: string;
    title?: string;
    showCard?: boolean;
    className?: string;
}

export function LoadingPage({ 
    message = "Chargement en cours...", 
    title = "Veuillez patienter",
    showCard = true,
    className = ""
}: LoadingPageProps) {
    const content = (
        <div className="flex flex-col items-center gap-4 py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h1 className="text-2xl font-bold text-blue-700 mb-2">{title}</h1>
            <p className="text-gray-500">{message}</p>
        </div>
    );

    if (showCard) {
        return (
            <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white ${className}`}>
                <Card className="w-full max-w-md mx-auto text-center animate-fade-in">
                    {content}
                </Card>
            </div>
        );
    }

    return (
        <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white ${className}`}>
            <div className="text-center animate-fade-in">
                {content}
            </div>
        </div>
    );
} 
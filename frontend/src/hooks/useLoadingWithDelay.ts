import { useState, useCallback } from 'react';

interface UseLoadingWithDelayOptions {
    delay?: number; // Délai minimum en ms
    initialLoading?: boolean;
}

export function useLoadingWithDelay(options: UseLoadingWithDelayOptions = {}) {
    const { delay = 800, initialLoading = true } = options;
    const [isLoading, setIsLoading] = useState(initialLoading);
    const [showContent, setShowContent] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);

    const startLoading = useCallback(() => {
        setIsLoading(true);
        setShowContent(false);
        setStartTime(Date.now());
    }, []);

    const stopLoading = useCallback(() => {
        const elapsed = startTime ? Date.now() - startTime : 0;
        const remainingDelay = Math.max(0, delay - elapsed);

        setTimeout(() => {
            setIsLoading(false);
            setShowContent(true);
        }, remainingDelay);
    }, [delay, startTime]);

    const setLoading = useCallback((loading: boolean) => {
        if (loading) {
            startLoading();
        } else {
            stopLoading();
        }
    }, [startLoading, stopLoading]);

    return {
        isLoading,
        showContent,
        setLoading,
        startLoading,
        stopLoading
    };
} 
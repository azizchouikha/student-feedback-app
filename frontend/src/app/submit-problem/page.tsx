'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './submitProblem.module.css';
import { problemsAPI } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { ProblemCreate } from '@/types';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingPage } from '@/components/ui/LoadingPage';
import { toast } from 'react-hot-toast';

export default function SubmitProblemPage() {
    const [formData, setFormData] = useState<ProblemCreate>({
        promotion: '',
        room: '',
        category: '',
        type_of_problem: '',
        description: '',
        other: '',
        urgency: 1,
        remark: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();

    // Vérifier l'authentification avec chargement
    useEffect(() => {
    if (!isAuthenticated) {
        router.push('/login');
            return;
        }
        
        // Délai minimum pour l'affichage de la page
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 500);
        
        return () => clearTimeout(timer);
    }, [isAuthenticated, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'urgency' ? parseInt(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);
        try {
            await problemsAPI.create(formData);
            setSuccess(true);
            toast.success('Problème soumis avec succès !');
            setTimeout(() => router.push('/student'), 1200);
        } catch (err: any) {
            setError('Erreur lors de la soumission du problème');
            toast.error('Erreur lors de la soumission du problème');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <LoadingPage 
                title="Chargement du formulaire"
                message="Préparation du formulaire de soumission..."
            />
        );
    }

    return (
        <div className={`${styles.container} transition-opacity duration-300 ${!isLoading ? 'opacity-100' : 'opacity-0'}`}>
            <Card className={styles.form || ''}>
                <h1 className={styles.title}>Soumettre un problème</h1>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.2rem' }}>
                        <label className={styles.label} htmlFor="promotion">Promotion</label>
                        <select
                            id="promotion"
                            name="promotion"
                            onChange={handleChange}
                            value={formData.promotion}
                            required
                            className={styles.inputField}
                            disabled={isSubmitting}
                        >
                            <option value="">Sélectionnez une promotion</option>
                            <option value="SN1">SN1</option>
                            <option value="SN2">SN2</option>
                            <option value="B3FS">B3FS</option>
                            <option value="B3DS">B3DS</option>
                            <option value="B3INFRA">B3INFRA</option>
                            <option value="B3WIS">B3WIS</option>
                        </select>
                    </div>
                    <div style={{ marginBottom: '1.2rem' }}>
                        <label className={styles.label} htmlFor="room">Salle</label>
                        <select
                            id="room"
                            name="room"
                            onChange={handleChange}
                            value={formData.room}
                            required
                            className={styles.inputField}
                            disabled={isSubmitting}
                        >
                            <option value="">Sélectionnez une salle</option>
                            <option value="Salle de classe">Salle de classe (SC)</option>
                            <option value="Laboratoires informatiques">Laboratoires informatiques</option>
                            <option value="Salle des serveurs">Salle des serveurs</option>
                            <option value="Salle de réunion">Salle de réunion</option>
                            <option value="Salle de conférence">Salle de conférence</option>
                            <option value="Salle de coworking">Salle de coworking</option>
                            <option value="Salle des professeurs">Salle des professeurs</option>
                            <option value="Salle de détente/zone de repos">Salle de détente/zone de repos</option>
                            <option value="Cafétéria/cantine">Cafétéria/cantine</option>
                            <option value="Toilette">Toilette</option>
                            <option value="Autre">Autre</option>
                        </select>
                    </div>
                    <div style={{ marginBottom: '1.2rem' }}>
                        <label className={styles.label} htmlFor="category">Catégorie</label>
                        <select
                            id="category"
                            name="category"
                            onChange={handleChange}
                            value={formData.category}
                            required
                            className={styles.inputField}
                            disabled={isSubmitting}
                        >
                            <option value="">Sélectionnez une catégorie</option>
                            <option value="Technologie et équipement">Technologie et équipement</option>
                            <option value="Vidéoprojecteurs">Vidéoprojecteurs</option>
                            <option value="Écrans multimédias">Écrans multimédias</option>
                            <option value="Ordinateurs et périphériques">Ordinateurs et périphériques</option>
                            <option value="Climatisation">Climatisation</option>
                            <option value="Sanitaires">Sanitaires</option>
                            <option value="Fenêtres">Fenêtres</option>
                            <option value="Classe">Classe</option>
                            <option value="Cafétéria">Cafétéria</option>
                            <option value="Extérieur">Extérieur</option>
                            <option value="Poubelles">Poubelles</option>
                            <option value="Électricité">Électricité</option>
                            <option value="Plomberie">Plomberie</option>
                            <option value="Sécurité">Sécurité</option>
                            <option value="Surveillance">Surveillance</option>
                            <option value="Mobiliers urbains">Mobiliers urbains</option>
                            <option value="Voies d&apos;accès">Voies d&apos;accès</option>
                            <option value="Signalisation">Signalisation</option>
                            <option value="Incivilités">Incivilités</option>
                            <option value="Alarmes et issues de secours">Alarmes et issues de secours</option>
                            <option value="Autre">Autre</option>
                        </select>
                    </div>
                    <div style={{ marginBottom: '1.2rem' }}>
                        <Input
                            type="text"
                            name="type_of_problem"
                            label="Type de problème"
                            placeholder="Type de problème"
                            value={formData.type_of_problem}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div style={{ marginBottom: '1.2rem' }}>
                        <Input
                            type="text"
                            name="other"
                            label="Autre (facultatif)"
                            placeholder="Autre (facultatif)"
                            value={formData.other || ''}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div style={{ marginBottom: '1.2rem' }}>
                        <label className={styles.label} htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            placeholder="Description (Si SC précisez N° de la salle)"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            className={styles.textareaField}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div style={{ marginBottom: '1.2rem' }}>
                        <label className={styles.label} htmlFor="urgency">Urgence</label>
                        <select
                            id="urgency"
                            name="urgency"
                            onChange={handleChange}
                            value={formData.urgency}
                            required
                            className={styles.inputField}
                            disabled={isSubmitting}
                        >
                            <option value="">Sélectionnez l&apos;urgence</option>
                            <option value={1}>1 (Faible)</option>
                            <option value={2}>2 (Moyenne)</option>
                            <option value={3}>3 (Élevée)</option>
                        </select>
                    </div>
                    <div style={{ marginBottom: '1.2rem' }}>
                        <Input
                            type="text"
                            name="remark"
                            label="Remarque"
                            placeholder="Remarque"
                            value={formData.remark}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    {error && <div style={{ color: '#d32f2f', marginTop: 8, textAlign: 'center' }}>{error}</div>}
                    {success && <div style={{ color: '#2563eb', marginTop: 8, textAlign: 'center' }}>Problème soumis avec succès !</div>}
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className={styles.submitButton}
                        disabled={isSubmitting}
                        style={{ marginTop: 24, fontWeight: 600, fontSize: '1.1rem', width: '100%' }}
                    >
                        {isSubmitting ? 'Envoi en cours...' : 'Valider'}
                    </Button>
                </form>
                <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                    <Link href="/student" style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 500, fontSize: '1rem' }}>
                        ← Retour au tableau de bord étudiant
                    </Link>
                </div>
            </Card>
        </div>
    );
} 
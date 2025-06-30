"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/store/auth";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [validationDetails, setValidationDetails] = useState<Record<string, string[]>>({});

    const router = useRouter();
    const { login, register, error, clearError } = useAuthStore();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        clearError();
        try {
            await login(email, password);
            router.push("/dashboard");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        clearError();
        setValidationDetails({});
        try {
            await register({ email, password, name, surname, role: "student" });
            alert("Compte créé avec succès. Vous pouvez maintenant vous connecter.");
            setIsRegistering(false);
        } catch (err: any) {
            if (err.response?.data?.details) {
                setValidationDetails(err.response.data.details);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white py-12 px-4">
            <div className="mb-8 flex flex-col items-center">
                <Image
                    src="/images/Charte_graphique_Workshop_2024-removebg-preview.webp"
                    alt="Logos EPSI et WIS"
                    width={300}
                    height={200}
                    className="object-contain mb-4"
                />
                <h1 className="text-4xl font-extrabold text-blue-700 mb-2 tracking-tight">EasyReport</h1>
                <p className="text-gray-500 text-lg">Plateforme de feedback étudiant</p>
            </div>
            <Card className="w-full max-w-md mx-auto shadow-lg">
                <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
                    {isRegistering ? "Créer un compte" : "Connexion"}
                </h2>
                {Object.keys(validationDetails).length > 0 && (
                    <ul className="mb-4 text-red-600 text-sm">
                        {Object.entries(validationDetails).map(([field, messages]) => {
                            const arr = Array.isArray(messages) ? messages : [messages];
                            return arr.map((msg, idx) => (
                                <li key={field + idx}>{msg}</li>
                            ));
                        })}
                    </ul>
                )}
                {!isRegistering && error && (
                    <div className="mb-4 text-red-600 text-sm text-center">{error}</div>
                )}
                <form
                    onSubmit={isRegistering ? handleRegister : handleLogin}
                    className="space-y-6"
                >
                    {isRegistering && (
                        <>
                            <Input
                                label="Nom"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={isLoading}
                                autoComplete="name"
                            />
                            <Input
                                label="Prénom"
                                type="text"
                                value={surname}
                                onChange={(e) => setSurname(e.target.value)}
                                required
                                disabled={isLoading}
                                autoComplete="given-name"
                            />
                        </>
                    )}
                    <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        autoComplete="email"
                    />
                    <Input
                        label="Mot de passe"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        autoComplete="current-password"
                    />
                    <Button
                        type="submit"
                        loading={isLoading}
                        className="w-full mt-2 text-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        style={{ minHeight: 48 }}
                    >
                        {isRegistering ? "Créer mon compte" : "Se connecter"}
                    </Button>
                </form>
                <div className="mt-8 text-center">
                    {isRegistering ? (
                        <>
                            <span className="text-gray-500 text-base">Déjà un compte ? </span>
                            <button
                                className="text-blue-600 hover:underline font-medium text-base"
                                onClick={() => setIsRegistering(false)}
                                type="button"
                            >
                                Se connecter
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="text-gray-500 text-base">Pas encore de compte ? </span>
                            <button
                                className="text-blue-600 hover:underline font-medium text-base"
                                onClick={() => setIsRegistering(true)}
                                type="button"
                            >
                                Créer un compte
                            </button>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
} 
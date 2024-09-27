// // export default Login;
// import { useState } from 'react';
// import axios from 'axios';
// import Router from 'next/router';
// import styles from './login.module.css';
// import Image from 'next/image';

// const Login = () => {
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');

//     const handleLogin = async (e) => {
//         e.preventDefault();

//         try {

//             const response = await axios.post('/api/login', { mail: email, password: password });

//             console.log('Login successful:', response.data);

 

//             if (response.data.redirect.includes('admin_dashboard')) {

//                 Router.push('/home_admin');

//             } else {

//                 Router.push('/home');

//             }

//         } catch (err) {

//             setError(err.response?.data?.error || 'Unexpected error occurred');

//             console.error('Login failed:', err);

//         }

//         //--------------------------------------------------------------------------------------------

//     };

//     return (
//         <div className={styles.container}>
//             <div className={styles.logoContainer}>
//                 <Image src="/images/Charte_graphique_Workshop_2024-removebg-preview.webp" alt="Logo 1" className={styles.logo} width={150} height={100} />
//             </div>
//             <div className={styles.card}>
//                 <h1 className={styles.title}>Bienvenue sur
//                 EasyReport</h1>
//                 {error && <p className={styles.errorMessage}>{error}</p>}
//                 <form onSubmit={handleLogin}>
//                     <label htmlFor="email" className="block">
//                         Email
//                         <input
//                             type="email"
//                             id="email"
//                             value={email}
//                             onChange={(e) => setEmail(e.target.value)}
//                             required
//                             className={styles.inputField}
//                         />
//                     </label>
//                     <label htmlFor="password" className="block mt-3">
//                         Mot de passe
//                         <input
//                             type="password"
//                             id="password"
//                             value={password}
//                             onChange={(e) => setPassword(e.target.value)}
//                             required
//                             className={styles.inputField}
//                         />
//                     </label>
//                     <button type="submit" className={styles.button}>
//                        Se connecter
//                     </button>
//                 </form>
//             </div>

//             <Image
//                 src="/images/24-removebg-preview.webp"
//                 alt="Rectangle Top Right"
//                 className={styles.backgroundTopRight}
//                 width={1000}
//                 height={500}
//             />
//             <Image
//                 src="/images/23-removebg-preview.webp"
//                 alt="Rectangle Bottom Left"
//                 className={styles.backgroundBottomLeft}
//                 width={1000}
//                 height={500}
//             />
//         </div>
//     );
// };

// export default Login;



import { useState } from 'react';
import axios from 'axios';
import Router from 'next/router';
import styles from './login.module.css';
import Image from 'next/image';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('/api/login', { mail: email, password: password });
            console.log('Login successful:', response.data);

            if (response.data.redirect.includes('admin_dashboard')) {
                Router.push('/home_admin');
            } else {
                Router.push('/home');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Une erreur inattendue s est produite');
            console.error('La connexion a échoué :', err);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('/api/register', {
                email: email,
                password: password,
                name: name,
                surname: surname
            });

            if (response.status === 201) {
                alert('Compte créé avec succès. Vous pouvez maintenant vous connecter.');
                setIsRegistering(false); // Revenir à la page de login
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Unexpected error occurred');
            console.error('Registration failed:', err);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.logoContainer}>
                <Image src="/images/Charte_graphique_Workshop_2024-removebg-preview.webp" alt="Logo 1" className={styles.logo} width={150} height={100} />
            </div>
            <div className={styles.card}>
                <h1 className={styles.title}>{isRegistering ? "Créer un compte" : "Bienvenue sur EasyReport"}</h1>
                {error && <p className={styles.errorMessage}>{error}</p>}
                
                <form onSubmit={isRegistering ? handleRegister : handleLogin}>
                    {isRegistering && (
                        <>
                            <label htmlFor="name" className="block">
                                Nom
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className={styles.inputField}
                                />
                            </label>
                            <label htmlFor="surname" className="block mt-3">
                                Prénom
                                <input
                                    type="text"
                                    id="surname"
                                    value={surname}
                                    onChange={(e) => setSurname(e.target.value)}
                                    required
                                    className={styles.inputField}
                                />
                            </label>
                        </>
                    )}
                    <label htmlFor="email" className="block">
                        Email
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className={styles.inputField}
                        />
                    </label>
                    <label htmlFor="password" className="block mt-3">
                        Mot de passe
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className={styles.inputField}
                        />
                    </label>
                    <button type="submit" className={styles.button}>
                        {isRegistering ? "S'inscrire" : "Se connecter"}
                    </button>
                </form>

                <button
                    className={styles.switchModeButton}
                    onClick={() => {
                        setIsRegistering(!isRegistering);
                        setError(''); // Reset error message when switching
                    }}
                >
                    {isRegistering ? "Vous avez déjà un compte ? Connectez-vous" : "Pas de compte ? Créez-en un"}
                </button>
            </div>

            <Image
                src="/images/24-removebg-preview.webp"
                alt="Rectangle Top Right"
                className={styles.backgroundTopRight}
                width={1000}
                height={500}
            />
            <Image
                src="/images/23-removebg-preview.webp"
                alt="Rectangle Bottom Left"
                className={styles.backgroundBottomLeft}
                width={1000}
                height={500}
            />
        </div>
    );
};

export default Login;

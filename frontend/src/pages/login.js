// import { useState } from 'react';
// import axios from 'axios';
// import Router from 'next/router';

// const Login = () => {
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');

//     const handleLogin = async (e) => {
//         e.preventDefault();

//         try {
//             const response = await axios.post('/api/login', { mail: email, password: password });
//             console.log('Login successful:', response.data);
//             Router.push('/home');
//         } catch (err) {
//             setError(err.response?.data?.error || 'Unexpected error occurred');
//             console.error('Login failed:', err);
//         }
//     };

//     return (
//         <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
//             <div className="p-8 bg-white rounded shadow-md">
//                 <h1 className="text-lg font-bold">Login</h1>
//                 {error && <p className="text-red-500">{error}</p>}
//                 <form onSubmit={handleLogin} className="mt-4">
//                     <label htmlFor="email" className="block">
//                         Email
//                         <input
//                             type="email"
//                             id="email"
//                             value={email}
//                             onChange={(e) => setEmail(e.target.value)}
//                             required
//                             className="w-full p-2 mt-1 border rounded"
//                         />
//                     </label>
//                     <label htmlFor="password" className="block mt-3">
//                         Password
//                         <input
//                             type="password"
//                             id="password"
//                             value={password}
//                             onChange={(e) => setPassword(e.target.value)}
//                             required
//                             className="w-full p-2 mt-1 border rounded"
//                         />
//                     </label>
//                     <button type="submit" className="px-4 py-2 mt-4 text-white bg-blue-500 rounded hover:bg-blue-600">
//                         Log In
//                     </button>
//                 </form>
//             </div>
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

            setError(err.response?.data?.error || 'Unexpected error occurred');

            console.error('Login failed:', err);

        }

        //--------------------------------------------------------------------------------------------

    };

    return (
        <div className={styles.container}>
            <div className={styles.logoContainer}>
                <Image src="/images/Charte_graphique_Workshop_2024-removebg-preview.webp" alt="Logo 1" className={styles.logo} width={150} height={100} />
            </div>
            <div className={styles.card}>
                <h1 className={styles.title}>Login</h1>
                {error && <p className={styles.errorMessage}>{error}</p>}
                <form onSubmit={handleLogin}>
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
                        Password
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
                        Log In
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;


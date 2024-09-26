// import Link from 'next/link';

// const Home = () => {
//     return (
//         <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
//             <h1 className="text-2xl font-bold mb-4">Welcome to the Student Feedback App</h1>
//             <div className="space-y-4">
//                 <Link href="/student_dashboard">
//                     <button className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-150">
//                         Go to Student Dashboard
//                     </button>
//                 </Link>
//                 <Link href="/submit_problem">
//                     <button className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-700 transition duration-150">
//                         Submit a Problem
//                     </button>
//                 </Link>
//             </div>
//         </div>
//     );
// };

// export default Home;
import Link from 'next/link';
import styles from './home.module.css';
import Image from 'next/image';

const Home = () => {
    return (
        <div className={styles.container}>
            <div className={styles.logoContainer}>
                <Image src="/images/Charte_graphique_Workshop_2024-removebg-preview.webp" alt="Logo 1" className={styles.logo} width={150} height={100} />
            </div>
            <h1 className={styles.title}>Accueil</h1>
            <div className={styles.buttonContainer}>
                <Link href="/student_dashboard">
                    <button className={styles.button}>
                     Tableau de bord Etudiant
                    </button>
                </Link>
                <Link href="/submit_problem">
                    <button className={`${styles.button}`}>
                    Soumettre un problème
                    </button>
                </Link>
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

export default Home;

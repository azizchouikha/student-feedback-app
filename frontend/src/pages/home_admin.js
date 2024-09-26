import Link from 'next/link';
import styles from './home.module.css'; // Import the CSS module from the home page
import Image from 'next/image';

const HomeAdmin = () => {
    return (
        <div className={styles.container}>
            <div className={styles.logoContainer}>
                <Image src="/images/Charte_graphique_Workshop_2024-removebg-preview.webp" alt="Logo 1" className={styles.logo} width={150} height={100} />
            </div>
            <h1 className={styles.title}>Welcome to the Admin Dashboard App</h1>
            <div className={styles.buttonContainer}>
                <Link href="/admin_dashboard">
                    <button className={styles.button}>
                        Go to Admin Dashboard
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

export default HomeAdmin;

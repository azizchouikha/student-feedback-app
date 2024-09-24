import Link from 'next/link';
import styles from './home.module.css'; // Import the CSS module from the home page

const HomeAdmin = () => {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Welcome to the Admin Dashboard App</h1>
            <div className={styles.buttonContainer}>
                <Link href="/admin_dashboard">
                    <button className={styles.button}>
                        Go to Admin Dashboard
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default HomeAdmin;

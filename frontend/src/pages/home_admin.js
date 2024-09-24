import Link from 'next/link';

 

const HomeAdmin = () => {

    return (

        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">

            <h1 className="text-2xl font-bold mb-4">Welcome to the Admin Dashboard App</h1>

            <div className="space-y-4">

                <Link href="/admin_dashboard">

                    <button className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-150">

                        Go to Admin Dashboard

                    </button>

                </Link>

            </div>

        </div>

    );

};

 

export default HomeAdmin;
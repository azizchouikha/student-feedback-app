// import { useState } from 'react';
// import axios from 'axios';
// import Router from 'next/router';

// const SubmitProblem = () => {
//     const [formData, setFormData] = useState({
//         promotion: '',
//         room: '',
//         category: '',
//         type_of_problem: '',
//         description: '',
//         other: '',
//         urgency: '',
//         remark: ''
//     });

//     const handleChange = (e) => {
//         setFormData({ ...formData, [e.target.name]: e.target.value });
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         try {
//             await axios.post('/api/submit_problem', formData);
//             alert('Problem submitted successfully');
//             Router.push('/home');
//         } catch (err) {
//             alert(err.response?.data?.error || 'Failed to submit the problem');
//         }
//     };

//     return (
//         <div className="container mx-auto p-4">
//             <h1 className="text-xl font-bold">Submit a Problem</h1>
//             <form onSubmit={handleSubmit} className="mt-4">
//                 <input type="text" name="promotion" placeholder="Promotion" onChange={handleChange} required />
//                 <input type="text" name="room" placeholder="Room" onChange={handleChange} required />
//                 <input type="text" name="category" placeholder="Category" onChange={handleChange} required />
//                 <input type="text" name="type_of_problem" placeholder="Type of Problem" onChange={handleChange} required />
//                 <textarea name="description" placeholder="Description" onChange={handleChange} required></textarea>
//                 <input type="text" name="other" placeholder="Other (optional)" onChange={handleChange} />
//                 <input type="text" name="urgency" placeholder="Urgency" onChange={handleChange} required />
//                 <textarea name="remark" placeholder="Remark" onChange={handleChange} required></textarea>
//                 <button type="submit" className="px-4 py-2 mt-4 text-white bg-blue-500 rounded hover:bg-blue-600">Submit</button>
//             </form>
//         </div>
//     );
// };

// export default SubmitProblem;

import { useState } from 'react';
import axios from 'axios';
import Router from 'next/router';
import styles from './submitProblem.module.css';

const SubmitProblem = () => {
    const [formData, setFormData] = useState({
        promotion: '',
        room: '',
        category: '',
        type_of_problem: '',
        description: '',
        other: '',
        urgency: '',
        remark: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/submit_problem', formData);
            alert('Problem submitted successfully');
            Router.push('/home');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to submit the problem');
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Submit a Problem</h1>
            <form onSubmit={handleSubmit} className={styles.form}>
                <input
                    type="text"
                    name="promotion"
                    placeholder="Promotion"
                    onChange={handleChange}
                    required
                    className={styles.inputField}
                />
                <input
                    type="text"
                    name="room"
                    placeholder="Room"
                    onChange={handleChange}
                    required
                    className={styles.inputField}
                />
                <input
                    type="text"
                    name="category"
                    placeholder="Category"
                    onChange={handleChange}
                    required
                    className={styles.inputField}
                />
                <input
                    type="text"
                    name="type_of_problem"
                    placeholder="Type of Problem"
                    onChange={handleChange}
                    required
                    className={styles.inputField}
                />
                <textarea
                    name="description"
                    placeholder="Description"
                    onChange={handleChange}
                    required
                    className={styles.textareaField}
                ></textarea>
                <input
                    type="text"
                    name="other"
                    placeholder="Other (optional)"
                    onChange={handleChange}
                    className={styles.inputField}
                />
                <input
                    type="text"
                    name="urgency"
                    placeholder="Urgency"
                    onChange={handleChange}
                    required
                    className={styles.inputField}
                />
                <textarea
                    name="remark"
                    placeholder="Remark"
                    onChange={handleChange}
                    required
                    className={styles.textareaField}
                ></textarea>
                <button type="submit" className={styles.submitButton}>
                    Submit
                </button>
            </form>
        </div>
    );
};

export default SubmitProblem;

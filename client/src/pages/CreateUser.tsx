import { CreateUserForm } from '@features/CreateUserForm';
//import { useState, useEffect } from 'react';
import axios from 'axios';

const CreateUser = () => {
    /*
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        console.log(
            'Email: ' +
                email +
                ', Password: ' +
                password +
                ', ConfirmPassword: ' +
                confirmPassword
        );
    }, [email, password, confirmPassword]);
    */

    const handleSubmit = async (data: {
        name: string,
        email: string;
        password: string;
        confirmPassword: string;
    }) => {
        if (data.password !== data.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            const response = await axios.post("http://localhost:3000/createUser", {
                email: data.email,
                password: data.password,
                name: data.name,
            });

            alert("User created successfully!");
            console.log(response.data);
        } catch (error: unknown) {
        
        if (axios.isAxiosError(error)) {
            alert(error.response?.data?.message || "Failed to create user");
            console.error(error.response?.data);
        } else {
            console.error(error);
            alert("Failed to create user");
        }
    }
    };

    return (
        <div className="mt-16">
            <CreateUserForm submitHandler={handleSubmit} />
        </div>
    );
};

export default CreateUser;

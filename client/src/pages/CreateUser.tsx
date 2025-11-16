import { CreateUserForm } from '@features/CreateUserForm';
import { useState, useEffect } from 'react';

const CreateUser = () => {
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

    const handleSubmit = (data: {
        email: string;
        password: string;
        confirmPassword: string;
    }) => {
        setEmail(data.email);
        setPassword(data.password);
        setConfirmPassword(data.confirmPassword);
    };

    return (
        <div className="mt-16">
            <CreateUserForm submitHandler={handleSubmit} />
        </div>
    );
};

export default CreateUser;

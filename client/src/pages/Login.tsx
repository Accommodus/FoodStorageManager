import { LoginForm } from '@features/LoginForm';
import { useState, useEffect } from 'react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        console.log('Email: ' + email + ', Password: ' + password);
    }, [email, password]);

    const handleSubmit = (data: { email: string; password: string }) => {
        setEmail(data.email);
        setPassword(data.password);
    };

    return (
        <div className="mt-16">
            <LoginForm submitHandler={handleSubmit} />
        </div>
    );
};

export default Login;

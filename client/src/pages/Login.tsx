import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { LoginForm } from '@features/LoginForm';
import { useAuth } from '@features/auth/AuthContext';

type LocationState = {
    from?: { pathname?: string };
};

const Login = () => {
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const redirectPath = useMemo(() => {
        const state = location.state as LocationState | null;
        return state?.from?.pathname ?? '/app';
    }, [location.state]);

    useEffect(() => {
        if (!loading && user) {
            navigate(redirectPath, { replace: true });
        }
    }, [loading, navigate, redirectPath, user]);

    const handleSubmit = async (data: { email: string; password: string }) => {
        setError(null);
        setIsSubmitting(true);

        try {
            const result = await login(data.email, data.password);

            if (result.ok) {
                navigate(redirectPath, { replace: true });
            } else {
                setError(result.error ?? 'Invalid email or password.');
            }
        } catch (caughtError) {
            const message =
                caughtError instanceof Error
                    ? caughtError.message
                    : 'Unable to complete sign in.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading && !user) {
        return (
            <div className="mt-16 text-center text-lg text-neutral-700">
                Checking your session...
            </div>
        );
    }

    return (
        <div className="mt-16 flex flex-col items-center gap-4">
            <h1 className="text-3xl font-bold text-neutral-800">
                Food Storage Manager: <span className='text-primary-700'>Garden</span>
            </h1>
            <p className="text-neutral-600">Sign in to manage storage.</p>
            <LoginForm
                submitHandler={handleSubmit}
                isSubmitting={isSubmitting}
                errorMessage={error}
            />
        </div>
    );
};

export default Login;

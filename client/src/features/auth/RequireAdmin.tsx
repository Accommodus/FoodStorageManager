import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from './AuthContext';

export const RequireAdmin = ({ children }: { children: ReactNode }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-neutral-700">
                Checking your permissions...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (user.role !== 'admin') {
        return <Navigate to="/app/inventory" replace state={{ from: location, reason: 'forbidden' }} />;
    }

    return <>{children}</>;
};

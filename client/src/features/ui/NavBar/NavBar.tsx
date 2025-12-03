import { NavLink, useNavigate } from 'react-router';
import { useAuth } from '@features/auth/AuthContext';

export const NavBar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="flex h-16 w-full items-center bg-neutral-900 text-neutral-50">
            <nav className="flex flex-1 items-center justify-around">
                <NavLink to={'/app/inventory'}>Inventory</NavLink>
                {user?.role === 'admin' && <NavLink to={'/app/users'}>Users</NavLink>}
            </nav>
            <div className="flex items-center gap-3 pr-6">
                {user && (
                    <span className="text-sm text-neutral-200">
                        {user.name || user.email}
                    </span>
                )}
                <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded bg-neutral-700 px-3 py-1 text-sm font-semibold text-neutral-100 transition hover:bg-neutral-600"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

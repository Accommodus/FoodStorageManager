import { NavLink } from 'react-router';

export const NavBar = () => {
    return (
        <div className="flex h-16 w-full items-center bg-neutral-900 text-neutral-50">
            <nav className="flex flex-1 items-center justify-around">
                <NavLink to={'/app/inventory'}>Inventory</NavLink>
                <NavLink to={'/app/users'}>Users</NavLink>
            </nav>
        </div>
    );
};

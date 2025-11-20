import { NavBar } from '@features/ui/NavBar';
import { Outlet } from 'react-router';

const AppLayout = () => {
    return (
        <div>
            <NavBar />
            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default AppLayout;

import Login from './pages/Login.tsx';
import AppLayout from './pages/AppLayout.tsx';
import Inventory from './pages/Inventory.tsx';
import Users from './pages/Users.tsx';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { RequireAuth } from '@features/auth/RequireAuth';
import { RequireAdmin } from '@features/auth/RequireAdmin';

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route index element={<Navigate to="login" replace />} />
                <Route path="login" element={<Login />} />
                <Route
                    path="app"
                    element={
                        <RequireAuth>
                            <AppLayout />
                        </RequireAuth>
                    }
                >
                    <Route
                        index
                        element={<Navigate to="inventory" replace />}
                    />
                    <Route path="inventory" element={<Inventory />} />
                    <Route
                        path="users"
                        element={
                            <RequireAdmin>
                                <Users />
                            </RequireAdmin>
                        }
                    />
                </Route>
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;

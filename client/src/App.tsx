import Login from './pages/Login.tsx';
import AppLayout from './pages/AppLayout.tsx';
import Inventory from './pages/Inventory.tsx';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route index element={<Navigate to="login" replace />} />
                <Route path="login" element={<Login />} />
                <Route path="app" element={<AppLayout />}>
                    <Route
                        index
                        element={<Navigate to="inventory" replace />}
                    />
                    <Route path="inventory" element={<Inventory />} />
                </Route>
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;

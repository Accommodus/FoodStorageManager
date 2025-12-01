import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    useCallback,
    type ReactNode,
} from 'react';
import type {
    AuthenticateUserResponse,
    UserResource,
} from '@foodstoragemanager/schema';
import { getSchemaClient } from '@lib/schemaClient';

type AuthResult = { ok: true } | { ok: false; error: string };

type AuthContextValue = {
    user: UserResource | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<AuthResult>;
    logout: () => void;
};

const STORAGE_KEY = 'fsm:auth:user';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const readStoredUser = (): UserResource | null => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as UserResource) : null;
    } catch (error) {
        console.warn("Failed to read stored user session", error);
        return null;
    }
};

const writeStoredUser = (user: UserResource | null) => {
    try {
        if (!user) {
            localStorage.removeItem(STORAGE_KEY);
            return;
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
        console.warn("Failed to persist user session", error);
    }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserResource | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setUser(readStoredUser());
        setLoading(false);
    }, []);

    const login = useCallback(
        async (email: string, password: string): Promise<AuthResult> => {
            try {
                const client = getSchemaClient();
                const payload: AuthenticateUserResponse = await client.authenticateUser({
                    email,
                    password,
                });

                if ('error' in payload) {
                    return { ok: false, error: payload.error.message };
                }

                setUser(payload.user);
                writeStoredUser(payload.user);
                return { ok: true };
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : 'Failed to sign in.';
                return { ok: false, error: message };
            }
        },
        []
    );

    const logout = useCallback(() => {
        setUser(null);
        writeStoredUser(null);
    }, []);

    const value = useMemo(
        () => ({
            user,
            loading,
            login,
            logout,
        }),
        [user, loading, login, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};

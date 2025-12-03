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
    Role,
} from '@foodstoragemanager/schema';
import { toRole } from '@foodstoragemanager/schema';
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

const normalizeUserRole = (user: UserResource | null): UserResource | null => {
    if (!user) return null;

    const rawRole: unknown = Array.isArray((user as unknown as { role?: unknown }).role)
        ? (user as unknown as { role?: unknown[] }).role?.[0]
        : (user as unknown as { role?: unknown }).role;

    const role: Role = toRole(rawRole);
    return { ...user, role };
};

const readStoredUser = (): UserResource | null => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? (JSON.parse(raw) as UserResource) : null;
        return normalizeUserRole(parsed);
    } catch (error) {
        console.warn("Failed to read stored user session", error);
        return null;
    }
};

const writeStoredUser = (user: UserResource | null) => {
    try {
        const normalized = normalizeUserRole(user);
        if (!user) {
            localStorage.removeItem(STORAGE_KEY);
            return;
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
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

                const normalizedUser = normalizeUserRole(payload.user);
                setUser(normalizedUser);
                writeStoredUser(normalizedUser);
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

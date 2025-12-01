import { useEffect, useState } from 'react';
import type { UserResource, ListUsersResponse } from '@foodstoragemanager/schema';
import { UsersList } from '@features/UsersList';
import { ChangeUserRoleModal } from '@features/ChangeUserRoleModal';
import { DeleteUserConfirmationModal } from '@features/DeleteUserConfirmationModal';
import { getSchemaClient } from '@lib/schemaClient';
import { CreateUserForm } from '@features/CreateUserForm';

const Users = () => {
    const [users, setUsers] = useState<UserResource[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<UserResource | null>(null);
    const [deletingUser, setDeletingUser] = useState<UserResource | null>(null);
    const [refreshToken, setRefreshToken] = useState(0);
    const [showCreateForm, setShowCreateForm] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        const client = getSchemaClient();

        const loadUsers = async () => {
            try {
                setIsLoading(true);
                const payload: ListUsersResponse = await client.listUsers({
                    signal: controller.signal
                });

                if ('error' in payload) {
                    const issues =
                        payload.error.issues !== undefined
                            ? ` Details: ${JSON.stringify(
                                  payload.error.issues
                              )}`
                            : '';
                    setError(`${payload.error.message}${issues}`);
                    setUsers([]);
                    return;
                }

                setUsers(payload.users ?? []);
                setError(null);
            } catch (caughtError) {
                if (
                    caughtError instanceof DOMException &&
                    caughtError.name === 'AbortError'
                ) {
                    return;
                }

                const message =
                    caughtError instanceof Error
                        ? caughtError.message
                        : 'Unable to fetch users.';
                setError(message);
                setUsers([]);
            } finally {
                setIsLoading(false);
            }
        };

        void loadUsers();

        return () => {
            controller.abort();
        };
    }, [refreshToken]);

    const handleEditUser = (user: UserResource) => {
        setEditingUser(user);
    };

    const handleRoleChanged = () => {
        setEditingUser(null);
        setRefreshToken((prev) => prev + 1);
    };

    const handleDeleteUser = (user: UserResource) => {
        setDeletingUser(user);
    };

    const handleUserDeleted = () => {
        setDeletingUser(null);
        setRefreshToken((prev) => prev + 1);
    };

    const handleCreateUser = async (data: {
        name: string;
        email: string;
        password: string;
        confirmPassword: string;
    }) => {
        const client = getSchemaClient();
        await client.createUser({
            name: data.name,
            email: data.email,
            password: data.password,
        });

        setShowCreateForm(false);
        setRefreshToken((prev) => prev + 1);
    };

    return (
        <div className="p-10">
            <div className="mb-8 flex items-center justify-between">
                <h1 className="bg-green text-5xl font-bold tracking-wide">
                    Users
                </h1>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                    {showCreateForm ? 'Hide Form' : 'Add New User'}
                </button>
            </div>

            {showCreateForm && (
                <div className="mb-8">
                    <CreateUserForm
                        submitHandler={handleCreateUser}
                        onCancel={() => setShowCreateForm(false)}
                    />
                </div>
            )}

            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-4">
                    <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <ChangeUserRoleModal
                            user={editingUser}
                            onRoleChanged={handleRoleChanged}
                            onCancel={() => setEditingUser(null)}
                        />
                    </div>
                </div>
            )}

            {deletingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-4">
                    <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <DeleteUserConfirmationModal
                            user={deletingUser}
                            onUserDeleted={handleUserDeleted}
                            onCancel={() => setDeletingUser(null)}
                        />
                    </div>
                </div>
            )}

            {isLoading ? (
                <p className="text-neutral-600" role="status">
                    Loading users…
                </p>
            ) : error ? (
                <p className="text-red-600" role="alert">
                    {error}
                </p>
            ) : (
                <UsersList users={users} onEditUser={handleEditUser} onDeleteUser={handleDeleteUser} />
            )}
        </div>
    );
};

export default Users;

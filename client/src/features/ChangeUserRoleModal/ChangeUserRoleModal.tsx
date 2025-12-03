import { useState } from 'react';
import { toRole, type UserResource, type UpdateUserResponse, type Role } from '@foodstoragemanager/schema';
import { getSchemaClient } from '@lib/schemaClient';

interface ChangeUserRoleModalProps {
    user: UserResource;
    onRoleChanged?: () => void;
    onCancel?: () => void;
}

export const ChangeUserRoleModal = ({ user, onRoleChanged, onCancel }: ChangeUserRoleModalProps) => {
    const currentRole: Role = toRole(user.role);
    const [selectedRole, setSelectedRole] = useState<Role>(currentRole);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedRole === currentRole) {
            onCancel?.();
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            const client = getSchemaClient();
            const payload: UpdateUserResponse = await client.updateUser(user._id, {
                role: selectedRole,
            });

            if ('error' in payload) {
                const issues = payload.error.issues ? ` Details: ${JSON.stringify(payload.error.issues)}` : '';
                throw new Error(`${payload.error.message}${issues}`);
            }

            onRoleChanged?.();
        } catch (caughtError) {
            const message = caughtError instanceof Error ? caughtError.message : 'Failed to update user role';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentRoleDisplay = `${currentRole[0].toUpperCase()}${currentRole.slice(1).toLowerCase()}`;

    return (
        <div className="p-6 bg-white rounded-lg shadow-md max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Change User Role</h2>
            <p className="text-sm text-gray-600 mb-4">
                Update role for <strong>{user.name || user.email}</strong>
            </p>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-sm text-gray-600">Current Role:</p>
                    <p className="font-medium text-gray-800">{currentRoleDisplay}</p>
                </div>

                <div>
                    <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 mb-2">
                        Select New Role *
                    </label>
                    <select
                        id="role-select"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(toRole(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={isSubmitting}
                    >
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="volunteer">Volunteer</option>
                    </select>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || selectedRole === currentRole}
                        className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Updating...' : 'Update Role'}
                    </button>
                </div>
            </form>
        </div>
    );
};

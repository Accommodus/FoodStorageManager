import { useState } from 'react';
import type { UserResource, DeleteUserResponse } from '@foodstoragemanager/schema';
import { getSchemaClient } from '@lib/schemaClient';

interface DeleteUserConfirmationModalProps {
    user: UserResource;
    onUserDeleted?: () => void;
    onCancel?: () => void;
}

export const DeleteUserConfirmationModal = ({ user, onUserDeleted, onCancel }: DeleteUserConfirmationModalProps) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            setError(null);

            const client = getSchemaClient();
            const payload: DeleteUserResponse = await client.deleteUser(user._id);

            if ('error' in payload) {
                const issues = payload.error.issues ? ` Details: ${JSON.stringify(payload.error.issues)}` : '';
                throw new Error(`${payload.error.message}${issues}`);
            }

            onUserDeleted?.();
        } catch (caughtError) {
            const message = caughtError instanceof Error ? caughtError.message : 'Failed to delete user';
            setError(message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Delete User</h2>
            
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <p className="text-gray-700 mb-6">
                Are you sure you want to delete <strong>{user.name || user.email}</strong>? 
                This action cannot be undone.
            </p>

            <div className="flex gap-3 justify-end">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isDeleting}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isDeleting ? 'Deleting...' : 'Delete User'}
                </button>
            </div>
        </div>
    );
};


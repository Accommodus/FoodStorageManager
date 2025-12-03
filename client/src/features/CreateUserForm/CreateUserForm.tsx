import { useState } from 'react';
import type { CreateUserResponse, Role } from '@foodstoragemanager/schema';
import { toRole } from '@foodstoragemanager/schema';
import { getSchemaClient } from '@lib/schemaClient';

type FormInputs = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: Role;
};

type CreateUserFormProps = {
    onUserCreated?: () => void;
    onCancel?: () => void;
};

const initialForm: FormInputs = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'volunteer',
};

export const CreateUserForm = ({ onUserCreated, onCancel }: CreateUserFormProps) => {
    const [formData, setFormData] = useState<FormInputs>(initialForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleInputChange = (field: keyof FormInputs, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: field === 'role' ? (toRole(value) as Role) : value,
        }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!formData.name.trim() || !formData.email.trim()) {
            setError('Name and email are required.');
            setSuccess(null);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            setSuccess(null);
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            const client = getSchemaClient();
            const payload: CreateUserResponse = await client.createUser({
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                role: formData.role,
            });

            if ('error' in payload) {
                const issues = payload.error.issues
                    ? ` Details: ${JSON.stringify(payload.error.issues)}`
                    : '';
                throw new Error(`${payload.error.message}${issues}`);
            }

            setSuccess('User created successfully!');
            setFormData(initialForm);

            setTimeout(() => {
                onUserCreated?.();
            }, 1500);
        } catch (caughtError) {
            const message =
                caughtError instanceof Error
                    ? caughtError.message
                    : 'Failed to create user.';
            setError(message);
            setSuccess(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-6 text-2xl font-bold text-gray-800">Create New User</h2>

            {error && (
                <div className="mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 rounded border border-green-400 bg-green-100 p-3 text-green-700">
                    {success}
                </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                    <label
                        htmlFor="name"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Name *
                    </label>
                    <input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(event) => handleInputChange('name', event.target.value)}
                        autoComplete="name"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label
                        htmlFor="email"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Email *
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(event) => handleInputChange('email', event.target.value)}
                        autoComplete="username"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Password *
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(event) => handleInputChange('password', event.target.value)}
                        autoComplete="new-password"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label
                        htmlFor="confirmPassword"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Confirm Password *
                    </label>
                    <input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(event) => handleInputChange('confirmPassword', event.target.value)}
                        autoComplete="new-password"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label
                        htmlFor="role"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Role *
                    </label>
                    <select
                        id="role"
                        value={formData.role}
                        onChange={(event) => handleInputChange('role', event.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    >
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="volunteer">Volunteer</option>
                    </select>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-80"
                    >
                        {isSubmitting ? 'Creating...' : 'Create User'}
                    </button>
                </div>
            </form>
        </div>
    );
};

import type { UserResource } from '@foodstoragemanager/schema';
import { UserItem } from '@features/UsersList/UserItem';

type UsersListProps = {
    users: UserResource[];
    onEditUser?: (user: UserResource) => void;
    onDeleteUser?: (user: UserResource) => void;
};

export const UsersList = ({ users, onEditUser, onDeleteUser }: UsersListProps) => {
    if (users.length === 0) {
        return (
            <p className="text-neutral-600" role="status">
                No users found.
            </p>
        );
    }

    return (
        <ul className="flex max-w-lg flex-col gap-8">
            {users.map((user) => (
                <li key={user._id}>
                    <UserItem user={user} onEditUser={onEditUser} onDeleteUser={onDeleteUser} />
                </li>
            ))}
        </ul>
    );
};

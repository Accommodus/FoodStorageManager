import type { UserResource } from '@foodstoragemanager/schema';
import { UserItem } from '@features/UsersList/UserItem';

type UsersListProps = {
    users: UserResource[];
};

export const UsersList = ({ users }: UsersListProps) => {
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
                <li>
                    <UserItem user={user} />
                </li>
            ))}
        </ul>
    );
};

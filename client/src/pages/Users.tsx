import type { UserResource } from '@foodstoragemanager/schema';
import { UsersList } from '@features/UsersList';

const Users = () => {
    const users: UserResource[] = [
        { _id: '1', email: 'abby@email.com', name: 'Abby' },
        { _id: '2', email: 'bob@email.com', name: 'Bob' },
        { _id: '3', email: 'charlie@email.com', name: 'Charlie' },
        { _id: '4', email: 'dave@email.com', name: 'Dave' },
        { _id: '5', email: 'evan@email.com', name: 'Evan' },
    ];

    return (
        <div className="p-10">
            <h1 className="bg-green text-5xl font-bold tracking-wide">Users</h1>

            <UsersList users={users} />
        </div>
    );
};

export default Users;

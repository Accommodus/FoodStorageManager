import { useMemo } from 'react';
import type { UserResource } from '@foodstoragemanager/schema';
import { BiSolidUser, BiSolidPencil, BiSolidTrash } from 'react-icons/bi';

type UserItemProps = {
    user: UserResource;
    onEditUser?: (user: UserResource) => void;
    onDeleteUser?: (user: UserResource) => void;
};

export const UserItem = ({ user, onEditUser, onDeleteUser }: UserItemProps) => {
    const role = useMemo(() => {
        if (user.role == undefined) return '';

        return user.role[0].toUpperCase() + user.role.slice(1).toLowerCase();
    }, [user.role]);

    const handleEditClick = () => {
        onEditUser?.(user);
    };

    const handleDeleteClick = () => {
        onDeleteUser?.(user);
    };

    return (
        <div className="flex w-full rounded-xl bg-neutral-100 px-8 py-4 shadow-md">
            <div className="mr-auto flex items-center gap-4">
                <button>
                    <BiSolidUser className="size-6 text-neutral-400" />
                </button>
                <h3 className="text-lg">{user.name}</h3>
                <span className="bg-secondary-200 rounded-full px-2 py-1 text-sm">
                    {role == '' ? 'No Role' : role}
                </span>
            </div>
            <div className="flex gap-4">
                <button onClick={handleEditClick}>
                    <BiSolidPencil className="text-accent-500 size-6" />
                </button>
                <button onClick={handleDeleteClick}>
                    <BiSolidTrash className="size-6 text-neutral-400 hover:text-red-500" />
                </button>
            </div>
        </div>
    );
};

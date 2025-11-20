import type { UserResource } from '@foodstoragemanager/schema';
import { BiSolidUser, BiSolidPencil, BiSolidTrash } from 'react-icons/bi';

type UserItemProps = {
    user: UserResource;
};

export const UserItem = ({ user }: UserItemProps) => {
    return (
        <div className="flex w-full rounded-xl bg-neutral-100 px-8 py-4 shadow-md">
            <div className="mr-auto flex gap-4">
                <button>
                    <BiSolidUser className="size-6 text-neutral-400" />
                </button>
                <h3 className="text-lg">{user.name}</h3>
            </div>
            <div className="flex gap-4">
                <button>
                    <BiSolidPencil className="text-accent-500 size-6" />
                </button>
                <button>
                    <BiSolidTrash className="size-6 text-neutral-400" />
                </button>
            </div>
        </div>
    );
};

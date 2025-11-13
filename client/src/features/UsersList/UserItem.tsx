import type { UserResource } from '@foodstoragemanager/schema';

type UserItemProps = {
    user: UserResource;
};

export const UserItem = ({ user }: UserItemProps) => {
    return <div>{user.name}</div>;
};

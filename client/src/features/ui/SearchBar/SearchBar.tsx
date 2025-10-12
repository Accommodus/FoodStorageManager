import { BiSearch } from 'react-icons/bi';

export const SearchBar = () => {
    return (
        <div className="bg-neutral-150 mb-6 flex w-128 gap-2 rounded-full px-4 py-2 shadow-lg">
            <BiSearch className="size-5 self-center text-neutral-700" />
            <input
                type="text"
                placeholder="Search inventory"
                className="text-md w-full"
            />
        </div>
    );
};

import { BiSearch } from 'react-icons/bi';

type SearchBarProps = {
    searchTerm: string;
    setSearchTerm: (searchTerm: string) => void;
};

export const SearchBar = ({ searchTerm, setSearchTerm }: SearchBarProps) => {
    return (
        <div className="bg-neutral-150 mb-16 flex w-128 gap-2 rounded-full px-4 py-2 shadow-lg">
            <BiSearch className="size-5 self-center text-neutral-700" />
            <input
                type="text"
                placeholder="Search inventory"
                onChange={(e) => setSearchTerm(e.target.value)}
                value={searchTerm}
                className="text-md w-full"
            />
        </div>
    );
};

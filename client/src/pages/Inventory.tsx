import { InventoryList } from '@features/InventoryList';
import { SearchBar } from '@features/ui/SearchBar';

const Inventory = () => {
    return (
        <div className="p-10">
            <h1 className="bg-green mb-8 text-5xl font-bold tracking-wide">
                Inventory
            </h1>
            <SearchBar />
            <InventoryList />
        </div>
    );
};

export default Inventory;

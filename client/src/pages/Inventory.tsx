import { InventoryList } from '@features/InventoryList';

const Inventory = () => {
    return (
        <div className="p-10">
            <h1 className="bg-green mb-16 text-5xl font-bold tracking-wide">
                Inventory
            </h1>
            <InventoryList />
        </div>
    );
};

export default Inventory;

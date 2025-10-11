import { InventoryList } from '@features/InventoryList';

const Inventory = () => {
    return (
        <>
            <h1 className="bg-green text-5xl font-bold tracking-wide">
                Inventory
            </h1>
            <InventoryList />
        </>
    );
};

export default Inventory;

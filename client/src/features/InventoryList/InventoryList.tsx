import InventoryItem from './InventoryItem';

export const InventoryList = () => {
    return (
        <ul className="grid grid-cols-3 gap-6">
            <li>
                <InventoryItem />
            </li>
            <li>
                <InventoryItem />
            </li>
            <li>
                <InventoryItem />
            </li>
            <li>
                <InventoryItem />
            </li>
            <li>
                <InventoryItem />
            </li>
            <li>
                <InventoryItem />
            </li>
        </ul>
    );
};

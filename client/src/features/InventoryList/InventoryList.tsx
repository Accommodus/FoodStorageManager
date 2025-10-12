import InventoryItem from './InventoryItem';

export const InventoryList = () => {
    return (
        <ul className="flex flex-wrap gap-x-8 gap-y-12">
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

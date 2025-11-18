import type { ItemResource } from '@foodstoragemanager/schema';
import InventoryItem from './InventoryItem';

type InventoryListProps = {
    items: ItemResource[];
    onEditItem?: (item: ItemResource) => void;
};

export const InventoryList = ({ items, onEditItem }: InventoryListProps) => {
    if (items.length === 0) {
        return (
            <p className="text-neutral-600" role="status">
                No inventory items found.
            </p>
        );
    }

    return (
        <ul className="flex flex-wrap gap-x-8 gap-y-12">
            {items.map((item) => (
                <li key={item._id}>
                    <InventoryItem item={item} onEdit={onEditItem} />
                </li>
            ))}
        </ul>
    );
};

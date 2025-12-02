import type {
    ItemResource,
    LocationResource,
} from '@foodstoragemanager/schema';
import InventoryItem from './InventoryItem';

type InventoryListProps = {
    items: ItemResource[];
    locations: LocationResource[];
    onEditItem?: (item: ItemResource) => void;
    onChangeLocation?: (item: ItemResource) => void;
};

export const InventoryList = ({
    items,
    locations,
    onEditItem,
    onChangeLocation,
}: InventoryListProps) => {
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
                    <InventoryItem
                        item={item}
                        location={locations.find(
                            (loc) => loc._id === item.locationId
                        )}
                        onEdit={onEditItem}
                        onChangeLocation={onChangeLocation}
                    />
                </li>
            ))}
        </ul>
    );
};

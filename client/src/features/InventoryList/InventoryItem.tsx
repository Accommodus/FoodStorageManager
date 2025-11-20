import { useMemo, useState } from 'react';
import {
    BiSolidPencil,
    BiSolidTruck,
    BiInfoCircle,
    BiSolidFactory,
} from 'react-icons/bi';
import type {
    ItemResource,
    LocationResource,
} from '@foodstoragemanager/schema';

type InventoryItemProps = {
    item: ItemResource;
    location: LocationResource | undefined;
    onEdit?: (item: ItemResource) => void;
    onChangeLocation?: (item: ItemResource) => void;
};

const InventoryItem = ({
    item,
    location,
    onEdit,
    onChangeLocation,
}: InventoryItemProps) => {
    const [infoOpen, setInfoOpen] = useState(false);

    const expiryLabel = useMemo(() => {
        if (!item.expiresAt) {
            return 'No expiry date';
        }

        const candidate = new Date(item.expiresAt);
        return Number.isNaN(candidate.valueOf())
            ? 'No expiry date'
            : 'Expires on: ' + candidate.toLocaleDateString();
    }, [item.expiresAt]);

    const quantityLabel = useMemo(() => {
        const amount = item.caseSize ?? 1;
        const unit = item.unit ?? 'ea';
        return `x${amount} ${unit}`;
    }, [item.caseSize, item.unit]);

    const categoryLabel = useMemo(() => {
        const category = item.category;
        if (!category) return 'Miscellaneous';
        return category.charAt(0).toUpperCase() + category.slice(1);
    }, [item.category]);

    const upcLabel = useMemo(() => {
        const upc = item.upc;
        if (!upc) return 'No UPC provided';
        return 'UPC: ' + upc;
    }, [item.upc]);

    const locationLabel = useMemo(() => {
        if (location == null) return 'No Location';

        return location.name;
    }, [location]);

    return (
        <div className="relative">
            {infoOpen && (
                <div className="absolute -top-8 right-0 h-12 rounded-t-md bg-neutral-100 px-4 py-1">
                    <p className="text-sm">{upcLabel}</p>
                </div>
            )}
            <div className="relative flex w-80 flex-col overflow-hidden rounded-2xl bg-neutral-100 shadow-md">
                <div className="bg-neutral-150 relative h-32 content-center">
                    <div className="absolute top-10 w-full p-4">
                        <div className="mb-2 flex justify-between">
                            <h3 className="text-2xl font-medium tracking-wide">
                                {item.name}
                            </h3>
                            <p className="text-md self-end font-light tracking-tight">
                                {quantityLabel}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <BiSolidFactory className="size-4 text-neutral-400" />
                            <p className="text-sm font-light tracking-wide italic">
                                {locationLabel}
                            </p>
                        </div>
                    </div>
                    <span className="bg-accent-400 text-md absolute top-4 left-0 rounded-r-lg px-4 py-1 tracking-wider">
                        {categoryLabel}
                    </span>
                    <button className="absolute top-2 right-2 z-20 m-2">
                        <BiInfoCircle
                            onClick={() => setInfoOpen((prev) => !prev)}
                            className="size-6 text-neutral-700"
                        />
                    </button>
                </div>
                <div className="flex h-auto flex-1 flex-col gap-4 p-4">
                    <span className="bg-primary-200 w-fit rounded-md px-4 py-2 text-sm tracking-wide">
                        {expiryLabel}
                    </span>
                    <div>
                        {item.tags && item.tags.length > 0 && (
                            <>
                                <h4 className="mb-2 font-medium tracking-wide">
                                    Tags
                                </h4>
                                <div className="mb-4 flex flex-wrap gap-2">
                                    {(item.tags ?? []).map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-full bg-neutral-400 px-4 py-1 text-xs text-neutral-50"
                                        >
                                            {tag.charAt(0).toUpperCase() +
                                                tag.slice(1)}
                                        </span>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    <div className="relative z-30 flex w-full justify-end gap-4">
                        <button
                            aria-label="Move inventory item"
                            className="relative z-30 cursor-pointer transition-opacity hover:opacity-70"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onChangeLocation?.(item);
                            }}
                        >
                            <BiSolidTruck className="size-8 text-neutral-400" />
                        </button>
                        <button
                            type="button"
                            aria-label="Edit inventory item"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onEdit?.(item);
                            }}
                            className="relative z-30 cursor-pointer"
                        >
                            <BiSolidPencil className="text-accent-500 size-8" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryItem;

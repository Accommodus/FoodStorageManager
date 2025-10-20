import { useMemo, useState } from 'react';
import {
    BiCheckbox,
    BiCheckboxSquare,
    BiSolidBaguette,
    BiSolidPencil,
    BiSolidTruck,
} from 'react-icons/bi';
import type { ItemResource } from '@foodstoragemanager/schema';

type InventoryItemProps = {
    item: ItemResource;
};

const InventoryItem = ({ item }: InventoryItemProps) => {
    const [selected, setSelected] = useState(false);

    const expiresOn = useMemo(() => {
        if (!item.expiresAt) {
            return 'No expiry date';
        }

        const candidate = new Date(item.expiresAt);
        return Number.isNaN(candidate.valueOf())
            ? 'No expiry date'
            : candidate.toLocaleDateString();
    }, [item.expiresAt]);

    const quantityLabel = useMemo(() => {
        const amount = item.caseSize ?? 1;
        const unit = item.unit ?? 'ea';
        return `x${amount} ${unit}`;
    }, [item.caseSize, item.unit]);

    const metadata = useMemo(() => {
        const pieces = [
            item.category ? `Category: ${item.category}` : null,
            item.tags?.length ? `Tags: ${item.tags.join(', ')}` : null,
            `Location: ${item.locationId}`,
        ].filter(Boolean);

        return pieces.join(' • ');
    }, [item.category, item.tags, item.locationId]);

    return (
        <div className="relative h-96 w-80 overflow-hidden rounded-2xl bg-neutral-100 shadow-md">
            {selected ? (
                <div className="bg-secondary-500 absolute z-10 h-full w-full opacity-20" />
            ) : null}
            <div className="bg-neutral-150 relative h-36 content-center">
                <BiSolidBaguette className="m-auto size-20 text-neutral-300" />
                <div className="absolute -bottom-2 flex w-full justify-between p-4">
                    <h3 className="text-2xl font-medium tracking-wide">
                        {item.name}
                    </h3>
                    <p className="text-sm font-light tracking-tight">
                        {quantityLabel}
                    </p>
                </div>
            </div>
            <div className="flex flex-col gap-4 p-4">
                <span className="bg-primary-200 w-fit rounded-full px-4 py-2 text-sm tracking-wide">
                    Expires on: {expiresOn}
                </span>
                <p className="text-sm text-neutral-700">{metadata}</p>
            </div>
            <div className="absolute bottom-0 z-20 flex w-full gap-4 p-4">
                <button
                    onClick={() => setSelected((prev) => !prev)}
                    className="z-20 mr-auto"
                    aria-pressed={selected}
                    aria-label={
                        selected ? 'Deselect inventory item' : 'Select inventory item'
                    }
                >
                    {selected ? (
                        <BiCheckboxSquare className="size-8 text-neutral-700" />
                    ) : (
                        <BiCheckbox className="size-8 text-neutral-700" />
                    )}
                </button>
                <button aria-label="Move inventory item">
                    <BiSolidTruck className="size-8 text-neutral-400" />
                </button>
                <button aria-label="Edit inventory item">
                    <BiSolidPencil className="text-accent-500 size-8" />
                </button>
            </div>
        </div>
    );
};

export default InventoryItem;

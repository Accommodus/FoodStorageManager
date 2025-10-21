import { useMemo, useState } from 'react';
import {
    BiCheckbox,
    BiCheckboxSquare,
    BiSolidPencil,
    BiSolidTruck,
    BiInfoCircle,
} from 'react-icons/bi';
import type { ItemResource } from '@foodstoragemanager/schema';

type InventoryItemProps = {
    item: ItemResource;
};

const InventoryItem = ({ item }: InventoryItemProps) => {
    const [selected, setSelected] = useState(false);
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

    return (
        <div className="relative">
            {infoOpen && (
                <div className="absolute -top-8 right-0 h-12 rounded-t-md bg-neutral-100 px-4 py-1">
                    <p className="text-sm">{upcLabel}</p>
                </div>
            )}
            <div className="relative flex h-80 w-80 flex-col overflow-hidden rounded-2xl bg-neutral-100 shadow-md">
                {selected && (
                    <div className="bg-secondary-500 absolute z-10 h-full w-full opacity-20" />
                )}
                <div className="bg-neutral-150 relative h-24 content-center">
                    <div className="absolute -bottom-2 flex w-full justify-between p-4">
                        <h3 className="text-2xl font-medium tracking-wide">
                            {item.name}
                        </h3>
                        <p className="self-end text-sm font-light tracking-tight">
                            {quantityLabel}
                        </p>
                    </div>
                    <span className="bg-accent-400 text-md absolute top-4 left-0 rounded-r-lg px-4 py-1 tracking-wider">
                        {categoryLabel}
                    </span>
                    <button className="absolute top-2 right-2 z-20 m-2">
                        <BiInfoCircle
                            onClick={() => setInfoOpen((prev) => !prev)}
                            className="size-6"
                        />
                    </button>
                </div>
                <div className="flex h-auto flex-1 flex-col gap-4 p-4">
                    <span className="bg-primary-200 w-fit rounded-md px-4 py-2 text-sm tracking-wide">
                        {expiryLabel}
                    </span>
                    <div>
                        <h4 className="mb-2 font-medium tracking-wide">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                            {item.tags.map((tag) => (
                                <span className="rounded-full bg-neutral-400 px-4 py-1 text-sm text-neutral-50">
                                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="z-20 mt-auto flex w-full gap-4">
                        <button
                            onClick={() => setSelected((prev) => !prev)}
                            className="z-20 mr-auto"
                            aria-pressed={selected}
                            aria-label={
                                selected
                                    ? 'Deselect inventory item'
                                    : 'Select inventory item'
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
            </div>
        </div>
    );
};

export default InventoryItem;

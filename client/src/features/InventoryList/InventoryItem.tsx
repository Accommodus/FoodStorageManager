import {
    BiCheckbox,
    BiCheckboxSquare,
    BiSolidBaguette,
    BiSolidTruck,
    BiSolidPencil,
} from 'react-icons/bi';
import { useState } from 'react';

const InventoryItem = () => {
    const [selected, setSelected] = useState(false);

    return (
        <div className="relative h-96 w-80 overflow-hidden rounded-2xl bg-neutral-100 shadow-md">
            {selected ? (
                <div className="bg-secondary-500 absolute z-10 h-full w-full opacity-20" />
            ) : null}
            <div className="bg-neutral-150 relative h-36 content-center">
                <BiSolidBaguette className="m-auto size-20 text-neutral-300" />
                <div className="absolute -bottom-2 flex w-full justify-between p-4">
                    <h3 className="text-2xl font-medium tracking-wide">Item</h3>
                    <p className="text-sm font-light tracking-tight">
                        x<span className="text-xl">3</span>
                    </p>
                </div>
            </div>
            <div className="flex flex-col gap-4 p-4">
                <span className="bg-primary-200 w-fit rounded-full px-4 py-2 text-sm tracking-wide">
                    Expires on: 1/1/2026
                </span>
                <p>
                    Lorem ipsum dolor sit amet consectetur adipiscing elit.
                    Dolor sit amet consectetur adipiscing elit quisque faucibus.
                </p>
            </div>
            <div className="absolute bottom-0 z-20 flex w-full gap-4 p-4">
                <button
                    onClick={() => setSelected((prev) => !prev)}
                    className="z-20 mr-auto"
                >
                    {selected ? (
                        <BiCheckboxSquare className="size-8 text-neutral-700" />
                    ) : (
                        <BiCheckbox className="size-8 text-neutral-700" />
                    )}
                </button>
                <button>
                    <BiSolidTruck className="size-8 text-neutral-400" />
                </button>
                <button>
                    <BiSolidPencil className="text-accent-500 size-8" />
                </button>
            </div>
        </div>
    );
};

export default InventoryItem;

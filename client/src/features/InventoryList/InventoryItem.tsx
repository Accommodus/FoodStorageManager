import { BiSolidBaguette, BiSolidTruck, BiSolidPencil } from 'react-icons/bi';

const InventoryItem = () => {
    return (
        <div className="relative h-96 w-80 overflow-hidden rounded-2xl bg-neutral-100 shadow-md">
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
            <div className="absolute bottom-0 flex w-full justify-end gap-4 p-4">
                <BiSolidTruck className="size-8 text-neutral-400" />
                <BiSolidPencil className="text-accent-500 size-8" />
            </div>
        </div>
    );
};

export default InventoryItem;

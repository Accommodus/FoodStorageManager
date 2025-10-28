export const InventoryFilter = () => {
    return (
        <div className="relative z-30 mb-8 w-64 overflow-hidden rounded-2xl bg-neutral-50 2xl:fixed 2xl:top-56 2xl:left-0 2xl:h-96 2xl:w-64 2xl:rounded-r-2xl">
            <div className="bg-primary-400 px-4 py-2">
                <h4 className="text-lg font-semibold tracking-wide text-neutral-900">
                    Filter by Location
                </h4>
            </div>
            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center gap-2">
                    <input
                        className="checked:accent-accent-400 size-4"
                        type="checkbox"
                        id="pantries"
                    />
                    <label className="text-md" htmlFor="pantries">
                        Pantries
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        className="checked:accent-accent-400 size-4"
                        type="checkbox"
                        id="fridges"
                    />
                    <label className="text-md" htmlFor="fridges">
                        Fridges
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        className="checked:accent-accent-400 size-4"
                        type="checkbox"
                        id="freezers"
                    />
                    <label className="text-md" htmlFor="freezers">
                        Freezers
                    </label>
                </div>
            </div>
        </div>
    );
};

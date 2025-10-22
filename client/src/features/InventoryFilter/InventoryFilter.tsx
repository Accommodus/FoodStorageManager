export const InventoryFilter = () => {
    return (
        <div className="l-0 fixed top-56 left-0 z-20 h-96 w-64 overflow-hidden rounded-r-2xl bg-neutral-50">
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

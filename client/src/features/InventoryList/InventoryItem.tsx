const InventoryItem = () => {
    return (
        <div className="h-96 w-80 overflow-hidden rounded-2xl bg-neutral-100 shadow-md">
            <div className="bg-neutral-150 relative h-36 p-4">
                <h3 className="absolute bottom-2 text-2xl font-medium tracking-wide">
                    Item
                </h3>
            </div>
        </div>
    );
};

export default InventoryItem;

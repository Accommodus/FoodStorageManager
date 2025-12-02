import { useEffect, useMemo, useState } from 'react';
import type {
    ItemResource,
    LocationResource,
    ListItemsResponse,
    ListLocationsResponse,
} from '@foodstoragemanager/schema';
import { InventoryList } from '@features/InventoryList';
import { SearchBar } from '@features/ui/SearchBar';
import { CreateItemForm } from '@features/CreateItemForm';
import { EditItemForm } from '@features/EditItemForm';
import { ChangeLocationModal } from '@features/ChangeLocationModal';
import { getSchemaClient } from '@lib/schemaClient';

const Inventory = () => {
    const [items, setItems] = useState<ItemResource[]>([]);
    const [locations, setLocations] = useState<LocationResource[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingItem, setEditingItem] = useState<ItemResource | null>(null);
    const [movingItem, setMovingItem] = useState<ItemResource | null>(null);
    const [refreshToken, setRefreshToken] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        const client = getSchemaClient();

        const loadItems = async () => {
            try {
                setIsLoading(true);
                const payload: ListItemsResponse = await client.listItems(
                    undefined,
                    { signal: controller.signal }
                );

                if ('error' in payload) {
                    const issues =
                        payload.error.issues !== undefined
                            ? ` Details: ${JSON.stringify(
                                  payload.error.issues
                              )}`
                            : '';
                    setError(`${payload.error.message}${issues}`);
                    setItems([]);
                    return;
                }

                setItems(payload.items ?? []);
                setError(null);
            } catch (caughtError) {
                if (
                    caughtError instanceof DOMException &&
                    caughtError.name === 'AbortError'
                ) {
                    return;
                }

                const message =
                    caughtError instanceof Error
                        ? caughtError.message
                        : 'Unable to fetch items.';
                setError(message);
                setItems([]);
            } finally {
                setIsLoading(false);
            }
        };

        const loadLocations = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const client = getSchemaClient();
                const payload: ListLocationsResponse =
                    await client.listLocations();

                if ('error' in payload) {
                    const issues =
                        payload.error.issues !== undefined
                            ? ` Details: ${JSON.stringify(payload.error.issues)}`
                            : '';
                    setError(`${payload.error.message}${issues}`);
                    setLocations([]);
                    return;
                }

                setLocations(payload.locations ?? []);
            } catch (caughtError) {
                const message =
                    caughtError instanceof Error
                        ? caughtError.message
                        : 'Unable to fetch locations.';
                setError(message);
            } finally {
                setIsLoading(false);
            }
        };

        void loadItems();

        void loadLocations();

        return () => {
            controller.abort();
        };
    }, [refreshToken]);

    const filteredItems = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) {
            return items;
        }

        return items.filter((item) => item.name.toLowerCase().includes(term));
    }, [items, searchTerm]);

    const handleItemCreated = () => {
        setShowCreateForm(false);
        setRefreshToken((prev) => prev + 1);
    };

    const handleEditItem = (item: ItemResource) => {
        setEditingItem(item);
        setShowCreateForm(false);
    };

    const handleItemUpdated = () => {
        setEditingItem(null);
        setRefreshToken((prev) => prev + 1);
    };

    const handleChangeLocation = (item: ItemResource) => {
        setMovingItem(item);
    };

    const handleLocationChanged = () => {
        setMovingItem(null);
        setRefreshToken((prev) => prev + 1);
    };

    return (
        <div className="p-10">
            <div className="mb-16 flex items-center justify-between">
                <h1 className="bg-green text-5xl font-bold tracking-wide">
                    Inventory
                </h1>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                    {showCreateForm ? 'Hide Form' : 'Add New Item'}
                </button>
            </div>

            {showCreateForm && (
                <div className="mb-8">
                    <CreateItemForm
                        onItemCreated={handleItemCreated}
                        onCancel={() => setShowCreateForm(false)}
                    />
                </div>
            )}

            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-4">
                    <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto">
                        <EditItemForm
                            item={editingItem}
                            onItemUpdated={handleItemUpdated}
                            onCancel={() => setEditingItem(null)}
                        />
                    </div>
                </div>
            )}

            {movingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-4">
                    <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto">
                        <ChangeLocationModal
                            item={movingItem}
                            onLocationChanged={handleLocationChanged}
                            onCancel={() => setMovingItem(null)}
                        />
                    </div>
                </div>
            )}

            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

            {isLoading ? (
                <p className="text-neutral-600" role="status">
                    Loading inventory…
                </p>
            ) : error ? (
                <p className="text-red-600" role="alert">
                    {error}
                </p>
            ) : (
                <InventoryList
                    items={filteredItems}
                    locations={locations}
                    onEditItem={handleEditItem}
                    onChangeLocation={handleChangeLocation}
                />
            )}
        </div>
    );
};

export default Inventory;

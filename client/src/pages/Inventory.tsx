import { useEffect, useMemo, useState } from 'react';
import type {
    ItemResource,
    ListItemsResponse,
} from '@foodstoragemanager/schema';
import { InventoryList } from '@features/InventoryList';
import { InventoryFilter } from '@features/InventoryFilter';
import { SearchBar } from '@features/ui/SearchBar';
import { CreateItemForm } from '@features/CreateItemForm';
import { getSchemaClient } from '@lib/schemaClient';

const Inventory = () => {
    const [items, setItems] = useState<ItemResource[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
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

        void loadItems();

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

    return (
        <div className="p-10">
            <div className="flex justify-between items-center mb-16">
                <h1 className="bg-green text-5xl font-bold tracking-wide">
                    Inventory
                </h1>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
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
            
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <InventoryFilter />

            {isLoading ? (
                <p className="text-neutral-600" role="status">
                    Loading inventory…
                </p>
            ) : error ? (
                <p className="text-red-600" role="alert">
                    {error}
                </p>
            ) : (
                <InventoryList items={filteredItems} />
            )}
        </div>
    );
};

export default Inventory;

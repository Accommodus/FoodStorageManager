import { useEffect, useState } from 'react';
import type {
    ItemResource,
    ListItemsFailure,
    ListItemsResponse,
    ListItemsSuccess,
} from '@foodstoragemanager/schema';
import { InventoryList } from '@features/InventoryList';
import { InventoryFilter } from '@features/InventoryFilter';
import { SearchBar } from '@features/ui/SearchBar';
import { buildApiUrl } from '@lib/api';

const ITEMS_ENDPOINT = buildApiUrl('/items');

const isListItemsSuccess = (
    payload: ListItemsResponse
): payload is ListItemsSuccess => 'data' in payload && 'items' in payload.data;

const isListItemsFailure = (
    payload: ListItemsResponse
): payload is ListItemsFailure => 'error' in payload;

const Inventory = () => {
    const [items, setItems] = useState<ItemResource[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();

        const loadItems = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(ITEMS_ENDPOINT, {
                    signal: controller.signal,
                });

                if (response.status === 204) {
                    setItems([]);
                    setError(null);
                    return;
                }

                const payload = (await response.json()) as ListItemsResponse;

                if (!response.ok || isListItemsFailure(payload)) {
                    const message = isListItemsFailure(payload)
                        ? payload.error.message
                        : `Unable to fetch items (status ${response.status}).`;
                    const issues =
                        isListItemsFailure(payload) && payload.error.issues
                            ? ` Details: ${JSON.stringify(
                                  payload.error.issues
                              )}`
                            : '';

                    setError(`${message}${issues}`);
                    setItems([]);
                    return;
                }

                if (isListItemsSuccess(payload)) {
                    setItems(payload.data.items);
                    setError(null);
                }
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
    }, []);

    return (
        <div className="m-auto w-240">
            <h1 className="bg-green mb-16 text-5xl font-bold tracking-wide">
                Inventory
            </h1>
            <SearchBar />
            {isLoading || error ? (
                error ? (
                    <p className="text-red-600" role="alert">
                        {error}
                    </p>
                ) : (
                    <p className="text-neutral-600" role="status">
                        Loading inventory...
                    </p>
                )
            ) : (
                <InventoryList items={items} />
            )}
            <InventoryFilter />
        </div>
    );
};

export default Inventory;

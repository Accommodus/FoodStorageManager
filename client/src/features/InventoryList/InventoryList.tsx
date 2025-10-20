import { useEffect, useState } from 'react';
import type {
    ItemResource,
    ListItemsFailure,
    ListItemsResponse,
    ListItemsSuccess,
} from '@foodstoragemanager/schema';
import { buildApiUrl } from '../../lib/api';
import InventoryItem from './InventoryItem';

const ITEMS_ENDPOINT = buildApiUrl('/items');

const isListItemsSuccess = (
    payload: ListItemsResponse
): payload is ListItemsSuccess => 'data' in payload && 'items' in payload.data;

const isListItemsFailure = (
    payload: ListItemsResponse
): payload is ListItemsFailure => 'error' in payload;

export const InventoryList = () => {
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

    if (isLoading) {
        return (
            <p className="text-neutral-600" role="status">
                Loading inventory…
            </p>
        );
    }

    if (error) {
        return (
            <p className="text-red-600" role="alert">
                {error}
            </p>
        );
    }

    if (items.length === 0) {
        return (
            <p className="text-neutral-600" role="status">
                No inventory items found.
            </p>
        );
    }

    return (
        <ul className="flex flex-wrap gap-x-8 gap-y-12">
            {items.map((item) => (
                <li key={item._id}>
                    <InventoryItem item={item} />
                </li>
            ))}
        </ul>
    );
};

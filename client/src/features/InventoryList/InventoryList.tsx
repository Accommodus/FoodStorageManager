import { useEffect, useState } from 'react';
import type {
    ItemResource,
    ListItemsResponse,
} from '@foodstoragemanager/schema';
import InventoryItem from './InventoryItem';
import { getSchemaClient } from '../../lib/schemaClient';

export const InventoryList = () => {
    const [items, setItems] = useState<ItemResource[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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

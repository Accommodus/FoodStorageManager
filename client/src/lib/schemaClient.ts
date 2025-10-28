import { createSchemaClient } from '@foodstoragemanager/schema';
import { getApiBaseUrl } from './api';

let cachedClient: ReturnType<typeof createSchemaClient> | null = null;

export const getSchemaClient = () => {
    if (cachedClient) {
        return cachedClient;
    }

    cachedClient = createSchemaClient({ baseUrl: getApiBaseUrl() });
    return cachedClient;
};

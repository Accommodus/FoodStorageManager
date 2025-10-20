import { defineConfig, type PluginOption } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import type { ItemResource, ListItemsSuccess } from '@foodstoragemanager/schema';

// Mock inventory payload shown when the API origin is not configured locally.
const MOCK_ITEMS: ItemResource[] = [
    {
        _id: '507f1f77bcf86cd799439011',
        name: 'Canned Tomatoes',
        category: 'Pantry',
        tags: ['staple', 'bulk'],
        unit: 'can',
        caseSize: 12,
        locationId: '507f191e810c19729de860ea',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
    },
    {
        _id: '507f1f77bcf86cd799439012',
        name: 'Brown Rice',
        category: 'Grains',
        tags: ['whole grain'],
        unit: 'lb',
        caseSize: 25,
        locationId: '507f191e810c19729de860eb',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
    },
    {
        _id: '507f1f77bcf86cd799439013',
        name: 'Frozen Blueberries',
        category: 'Freezer',
        tags: ['fruit'],
        unit: 'bag',
        caseSize: 6,
        locationId: '507f191e810c19729de860ec',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(),
    },
];

const mockInventoryApiPlugin = (): PluginOption => ({
    name: 'mock-inventory-api',
    apply: 'serve',
    configureServer(server) {
        server.middlewares.use((req, res, next) => {
            if (req.method?.toUpperCase() !== 'GET' || !req.url) {
                next();
                return;
            }

            const [pathname] = req.url.split('?');

            if (pathname !== '/items') {
                next();
                return;
            }

            const payload: ListItemsSuccess = {
                status: 200,
                data: { items: MOCK_ITEMS },
            };

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(payload));
        });
    },
});

const shouldMockInventoryApi = !process.env.VITE_SERVER_ORIGIN;

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        ...(shouldMockInventoryApi ? [mockInventoryApiPlugin()] : []),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@features': resolve(__dirname, 'src/features'),
        },
    },
    server: {
        host: '0.0.0.0',
        port: Number(
            process.env.C_PORT ??
                (() => {
                    throw new Error('Missing Client Port');
                })
        ),
    },
});

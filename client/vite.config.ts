import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
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

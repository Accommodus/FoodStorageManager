let cachedApiBaseUrl: string | null = null;

const normalizeBaseUrl = (rawBaseUrl: string) => {
    const valueWithScheme = /^[a-zA-Z]+:\/\//.test(rawBaseUrl)
        ? rawBaseUrl
        : `http://${rawBaseUrl}`;

    return valueWithScheme.replace(/\/$/, '');
};

const resolveFallbackPort = () => {
    const envPort =
        import.meta.env.SERVER_PORT ??
        import.meta.env.VITE_SERVER_PORT ??
        import.meta.env.S_PORT;

    const parsed = Number(envPort);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 3000;
};

const resolveFallbackBaseUrl = () => {
    if (typeof window === 'undefined') {
        return '';
    }

    const hostname = window.location.hostname || 'localhost';

    if (import.meta.env.PROD) {
        return window.location.origin ?? '';
    }

    const port = resolveFallbackPort();
    return `http://${hostname}:${port}`;
};

export const getApiBaseUrl = () => {
    if (cachedApiBaseUrl !== null) {
        return cachedApiBaseUrl;
    }

    const rawBaseUrl =
        typeof import.meta.env.SERVER_URI === 'string' &&
        import.meta.env.SERVER_URI.length > 0
            ? import.meta.env.SERVER_URI
            : '';

    cachedApiBaseUrl =
        rawBaseUrl.length > 0
            ? normalizeBaseUrl(rawBaseUrl)
            : resolveFallbackBaseUrl();

    return cachedApiBaseUrl;
};

export const buildApiUrl = (path: string) => {
    const baseUrl = getApiBaseUrl();

    if (baseUrl.length === 0) {
        return path;
    }

    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

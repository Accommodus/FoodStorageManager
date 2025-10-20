let cachedApiBaseUrl: string | null = null;

const normalizeBaseUrl = (rawBaseUrl: string) => {
    const valueWithScheme = /^[a-zA-Z]+:\/\//.test(rawBaseUrl)
        ? rawBaseUrl
        : `http://${rawBaseUrl}`;

    return valueWithScheme.replace(/\/$/, '');
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
        rawBaseUrl.length > 0 ? normalizeBaseUrl(rawBaseUrl) : '';

    return cachedApiBaseUrl;
};

export const buildApiUrl = (path: string) => {
    const baseUrl = getApiBaseUrl();

    if (baseUrl.length === 0) {
        return path;
    }

    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

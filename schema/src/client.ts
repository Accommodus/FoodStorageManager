import {
  type AuditDraft,
  type AuditResource,
  type CreateAuditResponse,
  type CreateItemResponse,
  type CreateLocationResponse,
  type DeleteItemResponse,
  type InventoryLotDraft,
  type InventoryLotResource,
  type ItemDraft,
  type ItemResource,
  type ListItemsResponse,
  type ListLocationsResponse,
  type LocationDraft,
  type LocationResource,
  type RecordStockTransactionResponse,
  type StockTransactionDraft,
  type StockTransactionResource,
  type UpdateItemResponse,
  type UpsertInventoryLotResponse,
  type ApiErrorPayload,
} from "./types.js";

import {
  type AuthenticateUserPayload,
  type AuthenticateUserResponse,
  type CreateUserResponse,
  type DeleteUserResponse,
  type ListUsersResponse,
  type UpdateUserResponse,
  type UserDraft,
  type UserResource,
} from "./user.js";

type FetchLike = typeof fetch;

export interface ClientInit {
  baseUrl?: string;
  fetchFn?: FetchLike;
  defaultHeaders?: HeadersInit;
}

export interface RequestOptions {
  signal?: AbortSignal;
  headers?: HeadersInit;
}

type Query = Record<string, string | undefined>;

const JSON_MEDIA_TYPE = "application/json";
const DEFAULT_ERROR_MESSAGE = "The request could not be completed.";

const normalizeHeaders = (input?: HeadersInit) => {
  const headers = new Headers();

  if (!input) {
    return headers;
  }

  if (input instanceof Headers) {
    input.forEach((value, key) => headers.set(key, value));
    return headers;
  }

  if (Array.isArray(input)) {
    for (const [key, value] of input) {
      if (value !== undefined) {
        headers.set(key, value);
      }
    }
    return headers;
  }

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      headers.set(key, value as string);
    }
  }

  return headers;
};

const mergeHeaders = (base?: HeadersInit, overrides?: HeadersInit) => {
  const merged = normalizeHeaders(base);
  const extra = normalizeHeaders(overrides);
  extra.forEach((value, key) => merged.set(key, value));
  return merged;
};

const ensureTrailingSlash = (value: string) =>
  value.endsWith("/") ? value : `${value}/`;

const buildUrl = (path: string, baseUrl?: string, query?: Query) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const params = new URLSearchParams();

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, value);
      }
    }
  }

  const search = params.toString();

  if (baseUrl) {
    const base = ensureTrailingSlash(baseUrl);
    const url = new URL(normalizedPath.replace(/^\//, ""), base);
    if (search) {
      url.search = search;
    }
    return url.toString();
  }

  return search ? `${normalizedPath}?${search}` : normalizedPath;
};

const tryParseJson = async (response: Response) => {
  const contentType = response.headers.get("content-type");

  if (!contentType || !contentType.toLowerCase().includes("application/json")) {
    return undefined;
  }

  try {
    return await response.json();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to parse response JSON payload.";
    throw new Error(message);
  }
};

const extractError = (body: unknown, fallback: string): ApiErrorPayload => {
  if (
    body &&
    typeof body === "object" &&
    "error" in body &&
    typeof (body as { error: unknown }).error === "object" &&
    (body as { error: { message?: unknown } }).error !== null
  ) {
    const payload = (body as { error: Record<string, unknown> }).error;
    const message =
      typeof payload.message === "string" && payload.message.trim().length > 0
        ? payload.message
        : fallback;

    const issues =
      payload.issues && typeof payload.issues === "object"
        ? (payload.issues as Record<string, unknown>)
        : undefined;

    return { message, issues };
  }

  if (typeof body === "string" && body.trim().length > 0) {
    return { message: body.trim() };
  }

  return { message: fallback };
};

export interface SchemaClient {
  listItems(
    query?: { locationId?: string },
    options?: RequestOptions
  ): Promise<ListItemsResponse>;
  createItem(
    item: ItemDraft,
    options?: RequestOptions
  ): Promise<CreateItemResponse>;
  updateItem(
    id: string,
    item: Partial<ItemDraft>,
    options?: RequestOptions
  ): Promise<UpdateItemResponse>;
  deleteItem(id: string, options?: RequestOptions): Promise<DeleteItemResponse>;
  listLocations(options?: RequestOptions): Promise<ListLocationsResponse>;
  createLocation(
    location: LocationDraft,
    options?: RequestOptions
  ): Promise<CreateLocationResponse>;
  upsertInventoryLot(
    lot: InventoryLotDraft,
    options?: RequestOptions
  ): Promise<UpsertInventoryLotResponse>;
  recordStockTransaction(
    transaction: StockTransactionDraft,
    options?: RequestOptions
  ): Promise<RecordStockTransactionResponse>;
  createAudit(
    audit: AuditDraft,
    options?: RequestOptions
  ): Promise<CreateAuditResponse>;
  authenticateUser(
    credentials: AuthenticateUserPayload,
    options?: RequestOptions
  ): Promise<AuthenticateUserResponse>;
  listUsers(options?: RequestOptions): Promise<ListUsersResponse>;
  createUser(
    user: UserDraft,
    options?: RequestOptions
  ): Promise<CreateUserResponse>;
  updateUser(
    id: string,
    user: Partial<UserDraft>,
    options?: RequestOptions
  ): Promise<UpdateUserResponse>;
  deleteUser(id: string, options?: RequestOptions): Promise<DeleteUserResponse>;
}

export const createSchemaClient = (init: ClientInit = {}): SchemaClient => {
  const { baseUrl, defaultHeaders, fetchFn } = init;
  const runtimeFetch =
    fetchFn ??
    (typeof fetch === "function" ? fetch.bind(globalThis) : undefined);

  if (!runtimeFetch) {
    throw new Error(
      "A fetch implementation is required to use the schema client."
    );
  }

  const request = async (
    path: string,
    initRequest: RequestInit & { query?: Query }
  ) => {
    const { query, headers, ...rest } = initRequest;
    const url = buildUrl(path, baseUrl, query);
    const mergedHeaders = mergeHeaders(defaultHeaders, headers);

    const response = await runtimeFetch(url, {
      ...rest,
      headers: mergedHeaders,
    });
    const body = await tryParseJson(response);

    return { response, body };
  };

  const asObject = (value: unknown): Record<string, unknown> | undefined =>
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : undefined;

  const isErrorEnvelope = (
    value: Record<string, unknown> | undefined
  ): value is Record<string, unknown> & { error: unknown } =>
    Boolean(value && "error" in value);

  const handleFailure = (body: unknown, response: Response) => {
    const fallback =
      response.statusText && response.statusText.trim().length > 0
        ? response.statusText
        : DEFAULT_ERROR_MESSAGE;
    return { error: extractError(body, fallback) };
  };

  const toJsonBody = <T>(value: T) =>
    JSON.stringify(value, (_, input) =>
      input === undefined ? undefined : input
    );

  return {
    listItems: async (query, options) => {
      const { response, body } = await request("/items", {
        method: "GET",
        signal: options?.signal,
        headers: options?.headers,
        query: query
          ? {
              locationId: query.locationId,
            }
          : undefined,
      });

      if (response.status === 204) {
        return { items: [] as ItemResource[] };
      }

      if (response.ok) {
        const payload = asObject(body);

        if (isErrorEnvelope(payload)) {
          return handleFailure(body, response);
        }

        const maybeItems = payload?.items;

        if (Array.isArray(maybeItems)) {
          return { items: maybeItems as ItemResource[] };
        }

        if (maybeItems === undefined) {
          return { items: [] as ItemResource[] };
        }

        return handleFailure(body, response);
      }

      return handleFailure(body, response);
    },

    createItem: async (item, options) => {
      const { response, body } = await request("/items", {
        method: "POST",
        signal: options?.signal,
        headers: mergeHeaders(
          { "Content-Type": JSON_MEDIA_TYPE },
          options?.headers
        ),
        body: toJsonBody({ item }),
      });

      if (response.ok) {
        const payload = asObject(body);

        if (isErrorEnvelope(payload)) {
          return handleFailure(body, response);
        }

        if (payload && payload.item) {
          return { item: payload.item as ItemResource };
        }

        return handleFailure(body, response);
      }

      return handleFailure(body, response);
    },

    updateItem: async (itemId, item, options) => {
      const { response, body } = await request(`/items/${itemId}`, {
        method: "PUT",
        signal: options?.signal,
        headers: mergeHeaders(
          { "Content-Type": JSON_MEDIA_TYPE },
          options?.headers
        ),
        body: toJsonBody({ item }),
      });

      if (response.ok) {
        const payload = asObject(body);

        if (isErrorEnvelope(payload)) {
          return handleFailure(body, response);
        }

        if (payload && payload.item) {
          return { item: payload.item as ItemResource };
        }

        return handleFailure(body, response);
      }

      return handleFailure(body, response);
    },

    // Based on "deleteUser"
    deleteItem: async (itemId: string, options?: RequestOptions) => {
      const { response, body } = await request(`/items/${itemId}`, {
        method: "DELETE",
        signal: options?.signal,
        headers: options?.headers,
      });

      if (response.ok) {
        const payload = asObject(body);

        if (isErrorEnvelope(payload)) {
          return handleFailure(body, response);
        }

        return { deleted: true };
      }

      return handleFailure(body, response);
    },

    listLocations: async (options) => {
      const { response, body } = await request("/locations", {
        method: "GET",
        signal: options?.signal,
        headers: options?.headers,
      });

      if (response.status === 204) {
        return { locations: [] as LocationResource[] };
      }

      if (response.ok) {
        const payload = asObject(body);

        if (isErrorEnvelope(payload)) {
          return handleFailure(body, response);
        }

        const maybeLocations = payload?.locations;

        if (Array.isArray(maybeLocations)) {
          return { locations: maybeLocations as LocationResource[] };
        }

        if (maybeLocations === undefined) {
          return { locations: [] as LocationResource[] };
        }

        return handleFailure(body, response);
      }

      return handleFailure(body, response);
    },

    createLocation: async (location, options) => {
      const { response, body } = await request("/locations", {
        method: "POST",
        signal: options?.signal,
        headers: mergeHeaders(
          { "Content-Type": JSON_MEDIA_TYPE },
          options?.headers
        ),
        body: toJsonBody({ location }),
      });

      if (response.ok) {
        const payload = asObject(body);

        if (isErrorEnvelope(payload)) {
          return handleFailure(body, response);
        }

        if (payload && payload.location) {
          return { location: payload.location as LocationResource };
        }

        return handleFailure(body, response);
      }

      return handleFailure(body, response);
    },

    upsertInventoryLot: async (lot, options) => {
      const { response, body } = await request("/inventory/lots", {
        method: "PUT",
        signal: options?.signal,
        headers: mergeHeaders(
          { "Content-Type": JSON_MEDIA_TYPE },
          options?.headers
        ),
        body: toJsonBody({ lot }),
      });

      if (response.ok) {
        const payload = asObject(body);

        if (isErrorEnvelope(payload)) {
          return handleFailure(body, response);
        }

        if (payload && payload.lot) {
          return { lot: payload.lot as InventoryLotResource };
        }

        return handleFailure(body, response);
      }

      return handleFailure(body, response);
    },

    recordStockTransaction: async (transaction, options) => {
      const { response, body } = await request("/stock-transactions", {
        method: "POST",
        signal: options?.signal,
        headers: mergeHeaders(
          { "Content-Type": JSON_MEDIA_TYPE },
          options?.headers
        ),
        body: toJsonBody({ transaction }),
      });

      if (response.ok) {
        const payload = asObject(body);

        if (isErrorEnvelope(payload)) {
          return handleFailure(body, response);
        }

        if (payload && payload.transaction) {
          return {
            transaction: payload.transaction as StockTransactionResource,
          };
        }

        return handleFailure(body, response);
      }

      return handleFailure(body, response);
    },

    createAudit: async (audit, options) => {
      const { response, body } = await request("/audits", {
        method: "POST",
        signal: options?.signal,
        headers: mergeHeaders(
          { "Content-Type": JSON_MEDIA_TYPE },
          options?.headers
        ),
        body: toJsonBody({ audit }),
      });

      if (response.ok) {
        const payload = asObject(body);

        if (isErrorEnvelope(payload)) {
          return handleFailure(body, response);
        }

        if (payload && payload.audit) {
          return { audit: payload.audit as AuditResource };
        }

        return handleFailure(body, response);
      }

      return handleFailure(body, response);
    },

    authenticateUser: async (credentials, options) => {
      const { response, body } = await request("/auth/login", {
        method: "POST",
        signal: options?.signal,
        headers: mergeHeaders(
          { "Content-Type": JSON_MEDIA_TYPE },
          options?.headers
        ),
        body: toJsonBody(credentials),
      });

      if (response.ok) {
        const payload = asObject(body);

        if (isErrorEnvelope(payload)) {
          return handleFailure(body, response);
        }

        if (payload && payload.user) {
          return { user: payload.user as UserResource };
        }

        return handleFailure(body, response);
      }

      return handleFailure(body, response);
    },

    listUsers: async (options) => {
      const { response, body } = await request("/users", {
        method: "GET",
        signal: options?.signal,
        headers: options?.headers,
      });

      if (response.status === 204) {
        return { users: [] as UserResource[] };
      }

      if (response.ok) {
        const payload = asObject(body);

        if (isErrorEnvelope(payload)) {
          return handleFailure(body, response);
        }

        const maybeUsers = payload?.users;

        if (Array.isArray(maybeUsers)) {
          return { users: maybeUsers as UserResource[] };
        }

        if (maybeUsers === undefined) {
          return { users: [] as UserResource[] };
        }

        return handleFailure(body, response);
      }

      return handleFailure(body, response);
    },

    createUser: async (user, options) => {
      const { response, body } = await request("/users", {
        method: "POST",
        signal: options?.signal,
        headers: mergeHeaders(
          { "Content-Type": JSON_MEDIA_TYPE },
          options?.headers
        ),
        body: toJsonBody({ user }),
      });

      if (response.ok) {
        const payload = asObject(body);

        if (isErrorEnvelope(payload)) {
          return handleFailure(body, response);
        }

        if (payload && payload.user) {
          return { user: payload.user as UserResource };
        }

        return handleFailure(body, response);
      }

      return handleFailure(body, response);
    },

    updateUser: async (userId, user, options) => {
      const { response, body } = await request(`/users/${userId}`, {
        method: "PUT",
        signal: options?.signal,
        headers: mergeHeaders(
          { "Content-Type": JSON_MEDIA_TYPE },
          options?.headers
        ),
        body: toJsonBody({ user }),
      });

      if (response.ok) {
        const payload = asObject(body);

        if (isErrorEnvelope(payload)) {
          return handleFailure(body, response);
        }

        if (payload && payload.user) {
          return { user: payload.user as UserResource };
        }

        return handleFailure(body, response);
      }

      return handleFailure(body, response);
    },

    deleteUser: async (userId: string, options?: RequestOptions) => {
      const { response, body } = await request(`/users/${userId}`, {
        method: "DELETE",
        signal: options?.signal,
        headers: options?.headers,
      });

      if (response.ok) {
        const payload = asObject(body);

        if (isErrorEnvelope(payload)) {
          return handleFailure(body, response);
        }

        return { deleted: true };
      }

      return handleFailure(body, response);
    },
  };
};

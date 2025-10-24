import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { ApiHandler, ApiResponse } from "./types.js";
import {
  createItemRecord,
  listItems as listItemRecords,
  serializeItem,
  type CreateItemFailure,
  type CreateItemRequest,
  type CreateItemSuccess,
  type ListItemsRequest,
  type ListItemsFailure,
  type ListItemsSuccess,
} from "@foodstoragemanager/schema";
import { mapErrorToIssues, mapErrorToStatus } from "./error-utils.js";

const isCreateItemRequest = (
  payload: unknown
): payload is CreateItemRequest => {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("body" in payload)
  ) {
    return false;
  }

  const body = (payload as CreateItemRequest).body;
  return typeof body === "object" && body !== null && "item" in body;
};

const isListItemsQuery = (
  query: unknown
): query is ListItemsRequest["query"] => {
  if (!query || typeof query !== "object") {
    return false;
  }

  const { locationId } = query as Record<string, unknown>;

  if (Array.isArray(locationId)) {
    return false;
  }

  return (
    locationId === undefined ||
    (typeof locationId === "string" && locationId.trim().length > 0)
  );
};

export const createItem: ApiHandler = async (req, res, db) => {
  if (db.readyState !== 1) {
    return res.redirect("/health");
  }

  const payload = req.body;

  if (!isCreateItemRequest(payload)) {
    const failure: CreateItemFailure = {
      error: { message: "Invalid item request payload." },
    };
    return new ApiResponse(StatusCodes.BAD_REQUEST, failure).send(res);
  }

  try {
    const createdItem = await createItemRecord(db, payload.body.item);
    const item = serializeItem(createdItem);

    const success: CreateItemSuccess = {
      data: { item },
    };

    return new ApiResponse(StatusCodes.CREATED, success).send(res);
  } catch (error) {
    const status = mapErrorToStatus(error);
    const message =
      error instanceof Error ? error.message : "Failed to create item.";
    const failure: CreateItemFailure = {
      error: {
        message,
        issues: mapErrorToIssues(error),
      },
    };

    return new ApiResponse(status, failure).send(res);
  }
};

export const listItems: ApiHandler = async (req, res, db) => {
  if (db.readyState !== 1) {
    return res.redirect("/health");
  }

  if (!isListItemsQuery(req.query)) {
    const failure: ListItemsFailure = {
      error: {
        message: "Invalid query parameters.",
        issues: { query: req.query },
      },
    };

    return new ApiResponse(StatusCodes.BAD_REQUEST, failure).send(res);
  }

  const locationId = req.query.locationId;

  if (locationId && typeof locationId !== "string") {
    const failure: ListItemsFailure = {
      error: {
        message: "Invalid locationId provided.",
        issues: { locationId },
      },
    };

    return new ApiResponse(StatusCodes.BAD_REQUEST, failure).send(res);
  }

  try {
    const items = await listItemRecords(
      db,
      typeof locationId === "string" && locationId.trim().length > 0
        ? { locationId: locationId.trim() }
        : undefined
    );

    const success: ListItemsSuccess = {
      data: { items },
    };

    return new ApiResponse(StatusCodes.OK, success).send(res);
  } catch (error) {
    const status = mapErrorToStatus(error);
    const message =
      error instanceof Error ? error.message : "Failed to list items.";

    const failure: ListItemsFailure = {
      error: {
        message,
        issues: mapErrorToIssues(error),
      },
    };

    return new ApiResponse(status, failure).send(res);
  }
};

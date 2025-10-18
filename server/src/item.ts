import { StatusCodes } from "http-status-codes";
import { ApiHandler, ApiResponse } from "./types.js";
import {
  createItemRecord,
  listItems as listItemRecords,
  type CreateItemFailure,
  type CreateItemRequest,
  type CreateItemSuccess,
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

export const createItem: ApiHandler = async (req, res, db) => {
  if (db.readyState !== 1) {
    return res.redirect("/health");
  }

  const payload = req.body;

  if (!isCreateItemRequest(payload)) {
    const failure: CreateItemFailure = {
      status: StatusCodes.BAD_REQUEST,
      error: { message: "Invalid item request payload." },
    };
    return new ApiResponse(StatusCodes.BAD_REQUEST, failure).send(res);
  }

  try {
    const createdItem = await createItemRecord(db, payload.body.item);
    const item = createdItem.toObject();

    const success: CreateItemSuccess = {
      data: { item },
      status: StatusCodes.CREATED,
    };

    return new ApiResponse(StatusCodes.CREATED, success).send(res);
  } catch (error) {
    const status = mapErrorToStatus(error);
    const message =
      error instanceof Error ? error.message : "Failed to create item.";
    const failure: CreateItemFailure = {
      status,
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

  try {
    const results = await listItemRecords(db);
    const items = results.map((doc) => doc.toObject());

    const success: ListItemsSuccess = {
      data: { items },
      status: StatusCodes.OK,
    };

    return new ApiResponse(StatusCodes.OK, success).send(res);
  } catch (error) {
    const status = mapErrorToStatus(error);
    const message =
      error instanceof Error ? error.message : "Failed to list items.";

    const failure: ListItemsFailure = {
      status,
      error: {
        message,
        issues: mapErrorToIssues(error),
      },
    };

    return new ApiResponse(status, failure).send(res);
  }
};

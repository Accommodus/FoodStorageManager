import { StatusCodes } from "http-status-codes";
import { ApiHandler, ApiResponse } from "./types.js";
import {
  getItemModel,
  normalizeItemDraft,
  type CreateItemFailure,
  type CreateItemRequest,
  type CreateItemSuccess,
} from "@foodstoragemanager/schema";

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

  let normalized;
  try {
    normalized = normalizeItemDraft(payload.body.item);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid item payload.";
    const failure: CreateItemFailure = {
      status: StatusCodes.BAD_REQUEST,
      error: { message },
    };

    return new ApiResponse(StatusCodes.BAD_REQUEST, failure).send(res);
  }

  try {
    const ItemModel = getItemModel(db);
    const createdItem = await ItemModel.create(normalized);
    const item = createdItem.toObject();

    const success: CreateItemSuccess = {
      data: { item },
      status: StatusCodes.CREATED,
    };

    return new ApiResponse(StatusCodes.CREATED, success).send(res);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create item.";

    const failure: CreateItemFailure = {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      error: {
        message,
        issues: error instanceof Error ? { name: error.name } : undefined,
      },
    };

    return new ApiResponse(StatusCodes.INTERNAL_SERVER_ERROR, failure).send(
      res
    );
  }
};

import { StatusCodes } from "http-status-codes";
import { ApiHandler, ApiResponse } from "./types.js";
import {
  upsertInventoryLot,
  type UpsertInventoryLotFailure,
  type UpsertInventoryLotRequest,
  type UpsertInventoryLotSuccess,
} from "@foodstoragemanager/schema";
import { mapErrorToIssues, mapErrorToStatus } from "./error-utils.js";

const isUpsertInventoryLotRequest = (
  payload: unknown
): payload is UpsertInventoryLotRequest => {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("body" in payload)
  ) {
    return false;
  }

  const body = (payload as UpsertInventoryLotRequest).body;
  return typeof body === "object" && body !== null && "lot" in body;
};

export const upsertLot: ApiHandler = async (req, res, db) => {
  if (db.readyState !== 1) {
    return res.redirect("/health");
  }

  const payload = req.body;

  if (!isUpsertInventoryLotRequest(payload)) {
    const failure: UpsertInventoryLotFailure = {
      status: StatusCodes.BAD_REQUEST,
      error: { message: "Invalid inventory lot payload." },
    };
    return new ApiResponse(StatusCodes.BAD_REQUEST, failure).send(res);
  }

  try {
    const { lot, created } = await upsertInventoryLot(db, payload.body.lot);
    const serialized = lot.toObject();
    const status = created ? StatusCodes.CREATED : StatusCodes.OK;

    const success: UpsertInventoryLotSuccess = {
      data: { lot: serialized },
      status,
    };

    return new ApiResponse(status, success).send(res);
  } catch (error) {
    const status = mapErrorToStatus(error);
    const message =
      error instanceof Error ? error.message : "Failed to upsert inventory lot.";

    const failure: UpsertInventoryLotFailure = {
      status,
      error: {
        message,
        issues: mapErrorToIssues(error),
      },
    };

    return new ApiResponse(status, failure).send(res);
  }
};

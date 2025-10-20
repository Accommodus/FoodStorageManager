import { StatusCodes } from "http-status-codes";
import { ApiHandler, ApiResponse } from "./types.js";
import {
  recordStockTransaction,
  type RecordStockTransactionFailure,
  type RecordStockTransactionRequest,
  type RecordStockTransactionSuccess,
} from "@foodstoragemanager/schema";
import { mapErrorToIssues, mapErrorToStatus } from "./error-utils.js";

const isRecordStockTransactionRequest = (
  payload: unknown
): payload is RecordStockTransactionRequest => {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("body" in payload)
  ) {
    return false;
  }

  const body = (payload as RecordStockTransactionRequest).body;
  return typeof body === "object" && body !== null && "transaction" in body;
};

export const recordTransaction: ApiHandler = async (req, res, db) => {
  if (db.readyState !== 1) {
    return res.redirect("/health");
  }

  const payload = req.body;

  if (!isRecordStockTransactionRequest(payload)) {
    const failure: RecordStockTransactionFailure = {
      error: { message: "Invalid stock transaction payload." },
    };
    return new ApiResponse(StatusCodes.BAD_REQUEST, failure).send(res);
  }

  try {
    const transaction = await recordStockTransaction(
      db,
      payload.body.transaction
    );
    const serialized = transaction.toObject();

    const success: RecordStockTransactionSuccess = {
      data: { transaction: serialized },
    };

    return new ApiResponse(StatusCodes.CREATED, success).send(res);
  } catch (error) {
    const status = mapErrorToStatus(error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to record stock transaction.";

    const failure: RecordStockTransactionFailure = {
      error: {
        message,
        issues: mapErrorToIssues(error),
      },
    };

    return new ApiResponse(status, failure).send(res);
  }
};

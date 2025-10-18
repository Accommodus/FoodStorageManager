import { StatusCodes } from "http-status-codes";
import { ApiHandler, ApiResponse } from "./types.js";
import {
  createAuditRecord,
  type CreateAuditFailure,
  type CreateAuditRequest,
  type CreateAuditSuccess,
} from "@foodstoragemanager/schema";
import { mapErrorToIssues, mapErrorToStatus } from "./error-utils.js";

const isCreateAuditRequest = (
  payload: unknown
): payload is CreateAuditRequest => {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("body" in payload)
  ) {
    return false;
  }

  const body = (payload as CreateAuditRequest).body;
  return typeof body === "object" && body !== null && "audit" in body;
};

export const createAudit: ApiHandler = async (req, res, db) => {
  if (db.readyState !== 1) {
    return res.redirect("/health");
  }

  const payload = req.body;

  if (!isCreateAuditRequest(payload)) {
    const failure: CreateAuditFailure = {
      status: StatusCodes.BAD_REQUEST,
      error: { message: "Invalid audit payload." },
    };
    return new ApiResponse(StatusCodes.BAD_REQUEST, failure).send(res);
  }

  try {
    const audit = await createAuditRecord(db, payload.body.audit);
    const serialized = audit.toObject();

    const success: CreateAuditSuccess = {
      data: { audit: serialized },
      status: StatusCodes.CREATED,
    };

    return new ApiResponse(StatusCodes.CREATED, success).send(res);
  } catch (error) {
    const status = mapErrorToStatus(error);
    const message =
      error instanceof Error ? error.message : "Failed to create audit.";

    const failure: CreateAuditFailure = {
      status,
      error: {
        message,
        issues: mapErrorToIssues(error),
      },
    };

    return new ApiResponse(status, failure).send(res);
  }
};

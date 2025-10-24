import { StatusCodes } from "http-status-codes";
import { ApiHandler, ApiResponse } from "./types.js";
import {
  createLocationRecord,
  listLocations as listLocationRecords,
  serializeLocation,
  type CreateLocationFailure,
  type CreateLocationRequest,
  type CreateLocationSuccess,
  type ListLocationsRequest,
  type ListLocationsFailure,
  type ListLocationsSuccess,
} from "@foodstoragemanager/schema";
import { mapErrorToIssues, mapErrorToStatus } from "./error-utils.js";

const isCreateLocationRequest = (
  payload: unknown
): payload is CreateLocationRequest => {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("body" in payload)
  ) {
    return false;
  }

  const body = (payload as CreateLocationRequest).body;
  return typeof body === "object" && body !== null && "location" in body;
};

export const createLocation: ApiHandler = async (req, res, db) => {
  if (db.readyState !== 1) {
    return res.redirect("/health");
  }

  const payload = req.body;

  if (!isCreateLocationRequest(payload)) {
    const failure: CreateLocationFailure = {
      error: { message: "Invalid location request payload." },
    };
    return new ApiResponse(StatusCodes.BAD_REQUEST, failure).send(res);
  }

  try {
    const createdLocation = await createLocationRecord(
      db,
      payload.body.location
    );
    const location = serializeLocation(createdLocation);

    const success: CreateLocationSuccess = {
      data: { location },
    };

    return new ApiResponse(StatusCodes.CREATED, success).send(res);
  } catch (error) {
    const status = mapErrorToStatus(error);
    const message =
      error instanceof Error ? error.message : "Failed to create location.";

    const failure: CreateLocationFailure = {
      error: {
        message,
        issues: mapErrorToIssues(error),
      },
    };

    return new ApiResponse(status, failure).send(res);
  }
};

export const listLocations: ApiHandler = async (req, res, db) => {
  if (db.readyState !== 1) {
    return res.redirect("/health");
  }

  try {
    const locations = await listLocationRecords(db);

    const success: ListLocationsSuccess = {
      data: { locations },
    };

    return new ApiResponse(StatusCodes.OK, success).send(res);
  } catch (error) {
    const status = mapErrorToStatus(error);
    const message =
      error instanceof Error ? error.message : "Failed to list locations.";

    const failure: ListLocationsFailure = {
      error: {
        message,
        issues: mapErrorToIssues(error),
      },
    };

    return new ApiResponse(status, failure).send(res);
  }
};

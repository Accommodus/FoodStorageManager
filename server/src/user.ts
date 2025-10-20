import { StatusCodes } from "http-status-codes";
import { ApiHandler, ApiResponse } from "./types.js";
import {
  createUserRecord,
  getUserModel,
  type CreateUserFailure,
  type CreateUserRequest,
  type CreateUserSuccess,
  type User,
  type ApiResponse as SchemaApiResponse,
  type ResponseData,
  type ResponseError,
  type ResponseStatus,
} from "@foodstoragemanager/schema";
import { mapErrorToIssues, mapErrorToStatus } from "./error-utils.js";

type ListUsersSuccess = SchemaApiResponse<
  ResponseData<{ users: User[] }>,
  ResponseStatus<200>
>;

type ListUsersFailure = SchemaApiResponse<
  ResponseError<{ message: string }>,
  ResponseStatus<500>
>;

const isCreateUserRequest = (
  payload: unknown
): payload is CreateUserRequest => {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("body" in payload)
  ) {
    return false;
  }

  const body = (payload as CreateUserRequest).body;
  return typeof body === "object" && body !== null && "user" in body;
};

export const createUser: ApiHandler = async (req, res, db) => {
  if (db.readyState !== 1) {
    return res.redirect("/health");
  }

  const payload = req.body;

  if (!isCreateUserRequest(payload)) {
    const failure: CreateUserFailure = {
      error: { message: "Invalid user request payload." },
    };
    return new ApiResponse(StatusCodes.BAD_REQUEST, failure).send(res);
  }

  try {
    const createdUser = await createUserRecord(db, payload.body.user);
    const user = createdUser.toObject();

    const success: CreateUserSuccess = {
      data: { user },
    };

    return new ApiResponse(StatusCodes.CREATED, success).send(res);
  } catch (error) {
    const status = mapErrorToStatus(error);
    const normalizedStatus =
      status === StatusCodes.CONFLICT ? StatusCodes.BAD_REQUEST : status;

    const message =
      error instanceof Error ? error.message : "Failed to create user.";

    const failure: CreateUserFailure = {
      error: {
        message,
        issues: mapErrorToIssues(error),
      },
    };

    return new ApiResponse(normalizedStatus, failure).send(res);
  }
};

export const listUsers: ApiHandler = async (_req, res, db) => {
  if (db.readyState !== 1) {
    return res.redirect("/health");
  }

  try {
    const UserModel = getUserModel(db);
    const userDocuments = await UserModel.find().exec();
    const users = userDocuments.map((userDoc) => userDoc.toObject());

    const success: ListUsersSuccess = {
      data: { users },
    };

    return new ApiResponse(StatusCodes.OK, success).send(res);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch users.";

    const failure: ListUsersFailure = {
      error: { message },
    };

    return new ApiResponse(StatusCodes.INTERNAL_SERVER_ERROR, failure).send(
      res
    );
  }
};

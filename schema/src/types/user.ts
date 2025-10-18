import type {
  ApiRequest,
  ApiResponse,
  RequestBody,
  ResponseData,
  ResponseError,
  ResponseStatus,
} from "./api";
import type { User } from "../models/user.model";

export type UserDraft = {
  email: string;
  name?: string;
  passwordHash?: string;
  roles?: ("admin" | "staff" | "volunteer")[];
  enabled?: boolean;
};

export type CreateUserRequest = ApiRequest<RequestBody<{ user: UserDraft }>>;

export type CreateUserSuccess = ApiResponse<
  ResponseData<{ user: User }>,
  ResponseStatus<201>
>;

export type CreateUserFailure = ApiResponse<
  ResponseError<{ message: string; issues?: Record<string, unknown> }>,
  ResponseStatus<400 | 500>
>;

export type CreateUserResponse = CreateUserSuccess | CreateUserFailure;

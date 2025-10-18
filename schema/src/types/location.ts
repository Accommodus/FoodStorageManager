import type {
  ApiRequest,
  ApiResponse,
  RequestBody,
  ResponseData,
  ResponseError,
  ResponseStatus,
} from "./api";
import type { Location } from "../models/location.model";

export type AddressDraft = {
  line1: string;
  city: string;
  state: string;
  zip: string;
};

export type LocationDraft = {
  name: string;
  type: "freezer" | "fridge" | "pantry";
  address: AddressDraft;
  isActive?: boolean;
};

export type CreateLocationRequest = ApiRequest<
  RequestBody<{ location: LocationDraft }>
>;

export type CreateLocationSuccess = ApiResponse<
  ResponseData<{ location: Location }>,
  ResponseStatus<201>
>;

export type CreateLocationFailure = ApiResponse<
  ResponseError<{ message: string; issues?: Record<string, unknown> }>,
  ResponseStatus<400 | 409 | 500>
>;

export type CreateLocationResponse =
  | CreateLocationSuccess
  | CreateLocationFailure;

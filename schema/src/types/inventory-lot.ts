import type {
  ApiRequest,
  ApiResponse,
  RequestBody,
  ResponseData,
  ResponseError,
  ResponseStatus,
} from "./api";
import type { InventoryLot } from "../models/inventory-lot.model";

type ObjectIdLike = string;

export type InventoryLotDraft = {
  itemId: ObjectIdLike;
  locationId: ObjectIdLike;
  qtyOnHand: number;
  unit?: string;
  lotCode?: string;
  expiresAt?: string;
  receivedAt?: string;
  note?: string;
};

export type UpsertInventoryLotRequest = ApiRequest<
  RequestBody<{ lot: InventoryLotDraft }>
>;

export type UpsertInventoryLotSuccess = ApiResponse<
  ResponseData<{ lot: InventoryLot }>,
  ResponseStatus<201 | 200>
>;

export type UpsertInventoryLotFailure = ApiResponse<
  ResponseError<{ message: string; issues?: Record<string, unknown> }>,
  ResponseStatus<400 | 409 | 500>
>;

export type UpsertInventoryLotResponse =
  | UpsertInventoryLotSuccess
  | UpsertInventoryLotFailure;

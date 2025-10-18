import type { ApiRequest, ApiResponse, RequestBody, ResponseData, ResponseError, ResponseStatus } from "./api";
import type { Item } from "../models/item.model";

type ISODateString = string;

export type ItemDraft = {
  name: string;
  locationId: string;
  upc?: string;
  category?: string;
  tags?: string[];
  unit?: string;
  caseSize?: number;
  expiresAt?: ISODateString;
  shelfLifeDays?: number;
  allergens?: string[];
  isActive?: boolean;
};

export type CreateItemRequest = ApiRequest<RequestBody<{ item: ItemDraft }>>;

export type CreateItemSuccess = ApiResponse<
  ResponseData<{ item: Item }>,
  ResponseStatus<201>
>;

export type CreateItemFailure = ApiResponse<
  ResponseError<{ message: string; issues?: Record<string, unknown> }>,
  ResponseStatus<400 | 500>
>;

export type CreateItemResponse = CreateItemSuccess | CreateItemFailure;

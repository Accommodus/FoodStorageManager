export type ObjectIdString = string;
export type ISODateString = string;

export interface ApiErrorPayload {
  message: string;
  issues?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  error: ApiErrorPayload;
}

export type ApiSuccessResponse<TData> = TData;

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;

export interface ItemDraft {
  name: string;
  locationId: ObjectIdString;
  upc?: string;
  category?: string;
  tags?: string[];
  unit?: string;
  caseSize?: number;
  expiresAt?: ISODateString;
  shelfLifeDays?: number;
  allergens?: string[];
  isActive?: boolean;
  note?: string;
}

export interface ItemResource {
  _id: ObjectIdString;
  name: string;
  locationId: ObjectIdString;
  upc?: string;
  category?: string;
  tags?: string[];
  unit?: string;
  caseSize?: number;
  expiresAt?: ISODateString;
  shelfLifeDays?: number;
  allergens?: string[];
  isActive?: boolean;
  note?: string;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

export type CreateItemResponse = ApiResponse<{ item: ItemResource }>;
export type UpdateItemResponse = ApiResponse<{ item: ItemResource }>;
export type DeleteItemResponse = ApiResponse<{ item: ItemResource }>;
export type ListItemsResponse = ApiResponse<{ items: ItemResource[] }>;

export interface AddressDraft {
  line1: string;
  city: string;
  state: string;
  zip: string;
}

export interface LocationDraft {
  name: string;
  type: "freezer" | "fridge" | "pantry";
  address?: AddressDraft;
  isActive?: boolean;
}

export interface LocationResource extends LocationDraft {
  _id: ObjectIdString;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

export type CreateLocationResponse = ApiResponse<{ location: LocationResource }>;
export type ListLocationsResponse = ApiResponse<{ locations: LocationResource[] }>;

export interface InventoryLotDraft {
  itemId: ObjectIdString;
  locationId: ObjectIdString;
  qtyOnHand: number;
  unit?: string;
  lotCode?: string;
  expiresAt?: ISODateString;
  receivedAt?: ISODateString;
  note?: string;
}

export interface InventoryLotResource {
  _id: ObjectIdString;
  itemId: ObjectIdString;
  locationId: ObjectIdString;
  qtyOnHand: number;
  unit: string;
  lotCode?: string;
  expiresAt?: ISODateString;
  receivedAt?: ISODateString;
  note?: string;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

export type UpsertInventoryLotResponse = ApiResponse<{ lot: InventoryLotResource }>;

export type StockTransactionType = "IN" | "OUT" | "MOVE" | "ADJUST";
export type StockTransactionReason =
  | "donation"
  | "distribution"
  | "damage"
  | "count"
  | "correction"
  | "other";

export interface StockTransactionDraft {
  type: StockTransactionType;
  reason?: StockTransactionReason;
  itemId: ObjectIdString;
  qty: number;
  unit?: string;
  actorId?: ObjectIdString;
  ref?: { model: string; id: ObjectIdString };
  note?: string;
  occurredAt?: ISODateString;
}

export interface StockTransactionResource {
  _id: ObjectIdString;
  type: StockTransactionType;
  reason?: StockTransactionReason;
  itemId: ObjectIdString;
  qty: number;
  unit: string;
  actorId?: ObjectIdString;
  ref?: { model: string; id: ObjectIdString };
  note?: string;
  occurredAt?: ISODateString;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

export type RecordStockTransactionResponse = ApiResponse<{
  transaction: StockTransactionResource;
}>;

export interface AuditLineDraft {
  lotId: ObjectIdString;
  expectedQty: number;
  countedQty: number;
  delta?: number;
  note?: string;
}

export interface AuditDraft {
  countedAt?: ISODateString;
  lines: AuditLineDraft[];
  createdBy?: ObjectIdString;
  status?: "draft" | "posted";
}

export interface AuditLineResource {
  lotId: ObjectIdString;
  expectedQty: number;
  countedQty: number;
  delta: number;
  note?: string;
}

export interface AuditResource {
  _id: ObjectIdString;
  countedAt: ISODateString;
  lines: AuditLineResource[];
  createdBy?: ObjectIdString;
  status: "draft" | "posted";
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

export type CreateAuditResponse = ApiResponse<{ audit: AuditResource }>;

export interface UserDraft {
  email: string;
  name?: string;
  passwordHash?: string;
  roles?: Array<"admin" | "staff" | "volunteer">;
  enabled?: boolean;
}

export interface UserResource {
  _id: ObjectIdString;
  email: string;
  name?: string;
  roles?: Array<"admin" | "staff" | "volunteer">;
  enabled?: boolean;
  createdAt?: ISODateString;
}

export type CreateUserResponse = ApiResponse<{ user: UserResource }>;
export type ListUsersResponse = ApiResponse<{ users: UserResource[] }>;

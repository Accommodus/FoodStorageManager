import type {
  ApiRequest,
  ApiResponse,
  RequestBody,
  ResponseData,
  ResponseError,
  ResponseStatus,
} from "./api";
import type { StockTransaction } from "../models/stock-transaction.model";

type ObjectIdLike = string;

export type StockTransactionDraft = {
  type: "IN" | "OUT" | "MOVE" | "ADJUST";
  reason?:
    | "donation"
    | "distribution"
    | "damage"
    | "count"
    | "correction"
    | "other";
  itemId: ObjectIdLike;
  qty: number;
  unit?: string;
  actorId?: ObjectIdLike;
  ref?: { model: string; id: ObjectIdLike };
  note?: string;
  occurredAt?: string;
};

export type RecordStockTransactionRequest = ApiRequest<
  RequestBody<{ transaction: StockTransactionDraft }>
>;

export type RecordStockTransactionSuccess = ApiResponse<
  ResponseData<{ transaction: StockTransaction }>,
  ResponseStatus<201>
>;

export type RecordStockTransactionFailure = ApiResponse<
  ResponseError<{ message: string; issues?: Record<string, unknown> }>,
  ResponseStatus<400 | 409 | 500>
>;

export type RecordStockTransactionResponse =
  | RecordStockTransactionSuccess
  | RecordStockTransactionFailure;

import {
  Schema,
  model,
  Types,
  type InferSchemaType,
  type Connection,
  type Model,
} from "mongoose";
import type { StockTransactionDraft } from "../types/stock-transaction";

type NormalizedStockTransactionDraft = {
  type: "IN" | "OUT" | "MOVE" | "ADJUST";
  reason?:
    | "donation"
    | "distribution"
    | "damage"
    | "count"
    | "correction"
    | "other";
  itemId: Types.ObjectId;
  qty: number;
  unit: string;
  actorId?: Types.ObjectId;
  ref?: { model: string; id: Types.ObjectId };
  note?: string;
  occurredAt?: Date;
};

const RefSchema = new Schema(
  {
    model: { type: String, required: true },
    id: { type: Schema.Types.ObjectId, required: true },
  },
  { _id: false }
);

export const StockTransactionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["IN", "OUT", "MOVE", "ADJUST"],
      required: true,
    },
    reason: {
      type: String,
      enum: [
        "donation",
        "distribution",
        "damage",
        "count",
        "correction",
        "other",
      ],
      index: true,
    },
    itemId: { type: Schema.Types.ObjectId, ref: "Item", index: true, required: true },
    qty: { type: Number, required: true },
    unit: { type: String, default: "ea" },
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    ref: { type: RefSchema },
    note: String,
    occurredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

StockTransactionSchema.index({ itemId: 1, occurredAt: -1 });

export type StockTransaction = InferSchemaType<typeof StockTransactionSchema>;

export const StockTransactionModel = model<StockTransaction>(
  "StockTransaction",
  StockTransactionSchema
);

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const ensureObjectId = (value: unknown, key: string): Types.ObjectId => {
  if (value instanceof Types.ObjectId) {
    return value;
  }

  if (typeof value === "string" && Types.ObjectId.isValid(value)) {
    return new Types.ObjectId(value);
  }

  throw new Error(`${key} must be a valid ObjectId.`);
};

export function normalizeStockTransactionDraft(
  draft: StockTransactionDraft
): NormalizedStockTransactionDraft {
  if (!["IN", "OUT", "MOVE", "ADJUST"].includes(draft.type)) {
    throw new Error("Transaction type must be IN, OUT, MOVE, or ADJUST.");
  }

  if (!isPositiveNumber(draft.qty)) {
    throw new Error("Transaction quantity must be a positive number.");
  }

  const normalized: NormalizedStockTransactionDraft = {
    type: draft.type,
    reason: draft.reason,
    qty: draft.qty,
    unit: draft.unit ?? "ea",
    note: draft.note?.trim(),
    itemId: ensureObjectId(draft.itemId, "itemId"),
  };

  if (draft.actorId) {
    normalized.actorId = ensureObjectId(draft.actorId, "actorId");
  }

  if (draft.ref) {
    normalized.ref = {
      model: draft.ref.model,
      id: ensureObjectId(draft.ref.id, "ref.id"),
    };
  }

  if (draft.occurredAt) {
    const occurredAt = new Date(draft.occurredAt);
    if (Number.isNaN(occurredAt.valueOf())) {
      throw new Error("occurredAt must be a valid ISO date string.");
    }
    normalized.occurredAt = occurredAt;
  }

  return normalized;
}

export function getStockTransactionModel(
  connection: Connection
): Model<StockTransaction> {
  return (
    (connection.models.StockTransaction as Model<StockTransaction> | undefined) ??
    connection.model<StockTransaction>("StockTransaction", StockTransactionSchema)
  );
}

export async function recordStockTransaction(
  connection: Connection,
  draft: StockTransactionDraft
) {
  const StockTransaction = getStockTransactionModel(connection);
  const normalized = normalizeStockTransactionDraft(draft);
  return StockTransaction.create(normalized);
}

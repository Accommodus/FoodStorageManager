import {
  Schema,
  model,
  Types,
  type InferSchemaType,
  type Connection,
  type Model,
  type HydratedDocument,
} from "mongoose";
import type { InventoryLotDraft } from "../types/inventory-lot";

type NormalizedInventoryLotDraft = {
  itemId: Types.ObjectId;
  locationId: Types.ObjectId;
  qtyOnHand: number;
  unit: string;
  lotCode?: string;
  expiresAt?: Date;
  receivedAt?: Date;
  note?: string;
};

export const InventoryLotSchema = new Schema(
  {
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true, index: true },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: true,
      index: true,
    },
    qtyOnHand: { type: Number, required: true },
    unit: { type: String, default: "ea" },
    lotCode: { type: String },
    expiresAt: { type: Date, index: true },
    receivedAt: { type: Date, default: Date.now },
    note: String,
  },
  { timestamps: true }
);

InventoryLotSchema.index(
  { itemId: 1, locationId: 1, lotCode: 1 },
  {
    unique: true,
    partialFilterExpression: { lotCode: { $type: "string" } },
  }
);

export type InventoryLot = InferSchemaType<typeof InventoryLotSchema>;

export const InventoryLotModel = model<InventoryLot>(
  "InventoryLot",
  InventoryLotSchema
);

const ensureObjectId = (value: unknown, field: string): Types.ObjectId => {
  if (value instanceof Types.ObjectId) return value;
  if (typeof value === "string" && Types.ObjectId.isValid(value)) {
    return new Types.ObjectId(value);
  }
  throw new Error(`${field} must be a valid ObjectId.`);
};

export function normalizeInventoryLotDraft(
  draft: InventoryLotDraft
): NormalizedInventoryLotDraft {
  if (!Number.isFinite(draft.qtyOnHand) || draft.qtyOnHand < 0) {
    throw new Error("qtyOnHand must be a non-negative number.");
  }

  const normalized: NormalizedInventoryLotDraft = {
    itemId: ensureObjectId(draft.itemId, "itemId"),
    locationId: ensureObjectId(draft.locationId, "locationId"),
    qtyOnHand: Number(draft.qtyOnHand),
    unit: draft.unit ?? "ea",
    lotCode: draft.lotCode?.trim() || undefined,
    note: draft.note?.trim(),
  };

  if (draft.expiresAt) {
    const expiresAt = new Date(draft.expiresAt);
    if (Number.isNaN(expiresAt.valueOf())) {
      throw new Error("expiresAt must be a valid ISO date string.");
    }
    normalized.expiresAt = expiresAt;
  }

  if (draft.receivedAt) {
    const receivedAt = new Date(draft.receivedAt);
    if (Number.isNaN(receivedAt.valueOf())) {
      throw new Error("receivedAt must be a valid ISO date string.");
    }
    normalized.receivedAt = receivedAt;
  }

  return normalized;
}

export function getInventoryLotModel(
  connection: Connection
): Model<InventoryLot> {
  return (
    (connection.models.InventoryLot as Model<InventoryLot> | undefined) ??
    connection.model<InventoryLot>("InventoryLot", InventoryLotSchema)
  );
}

export async function upsertInventoryLot(
  connection: Connection,
  draft: InventoryLotDraft
): Promise<{ lot: HydratedDocument<InventoryLot>; created: boolean }> {
  const InventoryLot = getInventoryLotModel(connection);
  const normalized = normalizeInventoryLotDraft(draft);

  const query: Record<string, unknown> = {
    itemId: normalized.itemId,
    locationId: normalized.locationId,
  };

  if (normalized.lotCode) {
    query.lotCode = normalized.lotCode;
  } else {
    query.lotCode = { $in: [null, undefined] };
  }

  const updateSet: Record<string, unknown> = {
    qtyOnHand: normalized.qtyOnHand,
    unit: normalized.unit,
  };
  const updateUnset: Record<string, number> = {};

  if (normalized.lotCode) {
    updateSet.lotCode = normalized.lotCode;
  }

  if (normalized.expiresAt) {
    updateSet.expiresAt = normalized.expiresAt;
  } else {
    updateUnset.expiresAt = 1;
  }

  if (normalized.note) {
    updateSet.note = normalized.note;
  } else {
    updateUnset.note = 1;
  }

  updateSet.receivedAt = normalized.receivedAt ?? new Date();

  const existing = await InventoryLot.findOne(query).exec();

  const result = await InventoryLot.findOneAndUpdate(
    query,
    {
      $set: updateSet,
      ...(Object.keys(updateUnset).length ? { $unset: updateUnset } : {}),
      $setOnInsert: {
        itemId: normalized.itemId,
        locationId: normalized.locationId,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  if (!result) {
    throw new Error("Failed to upsert inventory lot.");
  }

  const created = !existing;

  return { lot: result, created };
}

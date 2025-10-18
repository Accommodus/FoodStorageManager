import {
  Schema,
  model,
  Types,
  type InferSchemaType,
  type Connection,
  type Model,
} from "mongoose";
import type { ItemDraft } from "../types/item";

export const ItemSchema = new Schema({
  name: { type: String, required: true, index: true },
  upc: { type: String, index: true },             // GTIN/UPC if available
  category: { type: String, index: true },        // "Produce", "Grains"
  tags: [String],                                 // "gluten-free", "shelf-stable"
  unit: { type: String, default: "ea" },          // ea, lb, kg, case
  caseSize: Number,                               // units per case (optional)
  expiresAt: { type: Date, index: true },
  shelfLifeDays: Number,                          // default expiry assist
  locationId: { type: Schema.Types.ObjectId, ref: "Location", index: true, required: true },
  allergens: [String],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

ItemSchema.index({ name: 1 }, { unique: true });

export type Item = InferSchemaType<typeof ItemSchema>;

export const ItemModel = model<Item>("Item", ItemSchema);

export function normalizeItemDraft(draft: ItemDraft) {
  if (!draft.name?.trim()) {
    throw new Error("Item name is required.");
  }

  if (!draft.locationId) {
    throw new Error("Item locationId is required.");
  }

  const locationIdCandidate = draft.locationId;
  const locationId = Types.ObjectId.isValid(locationIdCandidate)
    ? new Types.ObjectId(locationIdCandidate)
    : undefined;

  if (!locationId) {
    throw new Error("locationId must be a valid ObjectId.");
  }

  const expiresAt =
    draft.expiresAt !== undefined && draft.expiresAt !== null
      ? new Date(draft.expiresAt)
      : undefined;

  if (expiresAt && Number.isNaN(expiresAt.valueOf())) {
    throw new Error("expiresAt must be a valid ISO date string.");
  }

  return {
    ...draft,
    locationId,
    ...(expiresAt ? { expiresAt } : {}),
    name: draft.name.trim(),
    upc: draft.upc?.trim(),
    category: draft.category?.trim(),
    tags: draft.tags?.map((tag) => tag.trim()).filter(Boolean),
    unit: draft.unit ?? "ea",
    allergens: draft.allergens?.map((allergen) => allergen.trim()).filter(Boolean),
    isActive: draft.isActive ?? true,
  };
}

export function getItemModel(connection: Connection): Model<Item> {
  return (connection.models.Item as Model<Item> | undefined) ??
    connection.model<Item>("Item", ItemSchema);
}

export async function createItemRecord(
  connection: Connection,
  draft: ItemDraft
) {
  const Item = getItemModel(connection);
  const normalized = normalizeItemDraft(draft);
  return Item.create(normalized);
}

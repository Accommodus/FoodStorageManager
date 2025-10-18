import { Schema, model, type InferSchemaType, type Connection, type Model } from "mongoose";
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
  locationId: { ref: "Location", index: true, required: true },
  allergens: [String],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export type Item = InferSchemaType<typeof ItemSchema>;

export const ItemModel = model<Item>("Item", ItemSchema);

export function normalizeItemDraft(draft: ItemDraft) {
  if (!draft.name?.trim()) {
    throw new Error("Item name is required.");
  }

  if (!draft.locationId?.trim()) {
    throw new Error("Item locationId is required.");
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
    ...(expiresAt ? { expiresAt } : {}),
  };
}

export function getItemModel(connection: Connection): Model<Item> {
  return (connection.models.Item as Model<Item> | undefined) ??
    connection.model<Item>("Item", ItemSchema);
}

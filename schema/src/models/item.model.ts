import { Schema, model, type InferSchemaType } from "mongoose";

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
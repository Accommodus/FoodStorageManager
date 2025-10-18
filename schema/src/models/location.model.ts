import {
  Schema,
  model,
  type InferSchemaType,
  type Connection,
  type Model,
} from "mongoose";
import type { LocationDraft } from "../types/location";

const AddressSchema = new Schema(
  {
    line1: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
  },
  { _id: false }
);

export const LocationSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    type: { type: String, enum: ["freezer", "fridge", "pantry"], required: true },
    address: { type: AddressSchema, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

LocationSchema.index({ name: 1 }, { unique: true });

export type Location = InferSchemaType<typeof LocationSchema>;

export const LocationModel = model<Location>("Location", LocationSchema);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export function normalizeLocationDraft(draft: LocationDraft) {
  if (!isNonEmptyString(draft.name)) {
    throw new Error("Location name is required.");
  }

  if (!["freezer", "fridge", "pantry"].includes(draft.type)) {
    throw new Error("Location type must be freezer, fridge, or pantry.");
  }

  const { address } = draft;

  if (!address) {
    throw new Error("Location address is required.");
  }

  const { line1, city, state, zip } = address;

  if (
    !isNonEmptyString(line1) ||
    !isNonEmptyString(city) ||
    !isNonEmptyString(state) ||
    !isNonEmptyString(zip)
  ) {
    throw new Error("Address must include line1, city, state, and zip.");
  }

  return {
    name: draft.name.trim(),
    type: draft.type,
    address: {
      line1: line1.trim(),
      city: city.trim(),
      state: state.trim().toUpperCase(),
      zip: zip.trim(),
    },
    isActive: draft.isActive ?? true,
  };
}

export function getLocationModel(connection: Connection): Model<Location> {
  return (
    (connection.models.Location as Model<Location> | undefined) ??
    connection.model<Location>("Location", LocationSchema)
  );
}

export async function createLocationRecord(
  connection: Connection,
  draft: LocationDraft
) {
  const Location = getLocationModel(connection);
  const normalized = normalizeLocationDraft(draft);
  return Location.create(normalized);
}

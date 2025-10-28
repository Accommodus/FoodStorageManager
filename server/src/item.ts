import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import type { ApiHandler } from "./types.js";
import {
  assertSafePayload,
  isPlainObject,
  sanitizeNumber,
  sanitizeObjectId,
  sanitizeOptionalDate,
  sanitizeString,
} from "./validation.js";
import {
  handleDatabaseError,
  sendError,
  sendSuccess,
} from "./responses.js";

const COLLECTION = "items";

const toObjectIdString = (value: unknown) =>
  value instanceof Types.ObjectId ? value.toString() : String(value);

const toIsoString = (value: unknown) =>
  value instanceof Date ? value.toISOString() : undefined;

const serializeItem = (doc: Record<string, unknown>) => ({
  _id: toObjectIdString(doc._id),
  name: String(doc.name),
  locationId: toObjectIdString(doc.locationId),
  upc: doc.upc ? String(doc.upc) : undefined,
  category: doc.category ? String(doc.category) : undefined,
  tags: Array.isArray(doc.tags)
    ? doc.tags.map((tag) => String(tag))
    : undefined,
  unit: doc.unit ? String(doc.unit) : "ea",
  caseSize:
    typeof doc.caseSize === "number" ? doc.caseSize : undefined,
  expiresAt: doc.expiresAt ? toIsoString(doc.expiresAt) : undefined,
  shelfLifeDays:
    typeof doc.shelfLifeDays === "number" ? doc.shelfLifeDays : undefined,
  allergens: Array.isArray(doc.allergens)
    ? doc.allergens.map((allergen) => String(allergen))
    : undefined,
  isActive:
    typeof doc.isActive === "boolean" ? doc.isActive : undefined,
  note: doc.note ? String(doc.note) : undefined,
  createdAt: doc.createdAt ? toIsoString(doc.createdAt) : undefined,
  updatedAt: doc.updatedAt ? toIsoString(doc.updatedAt) : undefined,
});

const sanitizeStringArray = (
  value: unknown,
  field: string
): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const sanitized = value
    .map((entry, index) =>
      sanitizeString(entry, `${field}[${index}]`) ?? undefined
    )
    .filter((entry): entry is string => Boolean(entry));

  return sanitized.length > 0 ? sanitized : undefined;
};

export const createItem: ApiHandler = async (req, res, db) => {
  if (db.readyState !== 1) {
    res.redirect("/health");
    return;
  }

  const payload = req.body;

  try {
    assertSafePayload(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid item payload.";
    return sendError(res, StatusCodes.BAD_REQUEST, message);
  }

  if (!isPlainObject(payload) || !isPlainObject(payload.item)) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      "Invalid item request payload."
    );
  }

  const draft = payload.item as Record<string, unknown>;

  let document: Record<string, unknown>;

  try {
    const name = sanitizeString(draft.name, "item.name", {
      required: true,
    });
    if (!name) {
      throw new Error("item.name is required.");
    }
    const locationId = sanitizeObjectId(
      draft.locationId,
      "item.locationId"
    );

    const unit =
      sanitizeString(draft.unit, "item.unit") ??
      "ea";

    document = {
      name,
      locationId,
      unit,
      isActive:
        typeof draft.isActive === "boolean" ? draft.isActive : true,
    };

    const upc = sanitizeString(draft.upc, "item.upc");
    if (upc) {
      document.upc = upc;
    }

    const category = sanitizeString(draft.category, "item.category");
    if (category) {
      document.category = category;
    }

    const note = sanitizeString(draft.note, "item.note");
    if (note) {
      document.note = note;
    }

    const tags = sanitizeStringArray(draft.tags, "item.tags");
    if (tags) {
      document.tags = tags;
    }

    const allergens = sanitizeStringArray(
      draft.allergens,
      "item.allergens"
    );
    if (allergens) {
      document.allergens = allergens;
    }

    if (draft.caseSize !== undefined) {
      document.caseSize = sanitizeNumber(
        draft.caseSize,
        "item.caseSize",
        { min: 0 }
      );
    }

    if (draft.shelfLifeDays !== undefined) {
      document.shelfLifeDays = sanitizeNumber(
        draft.shelfLifeDays,
        "item.shelfLifeDays",
        { min: 0 }
      );
    }

    const expiresAt = sanitizeOptionalDate(
      draft.expiresAt,
      "item.expiresAt"
    );
    if (expiresAt) {
      document.expiresAt = expiresAt;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid item payload.";
    return sendError(res, StatusCodes.BAD_REQUEST, message);
  }

  try {
    const collection = db.collection(COLLECTION);
    const now = new Date();
    document.createdAt = now;
    document.updatedAt = now;

    const result = await collection.insertOne(document);
    const created = await collection.findOne({ _id: result.insertedId });

    if (!created) {
      throw new Error("Item could not be retrieved after creation.");
    }

    return sendSuccess(res, StatusCodes.CREATED, {
      item: serializeItem(created),
    });
  } catch (error) {
    return handleDatabaseError(res, error, {
      fallbackMessage: "Failed to create item.",
      duplicateMessage: "An item with that name already exists.",
    });
  }
};

const sanitizeLocationQuery = (value: unknown) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error("locationId must be a string.");
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  return sanitizeObjectId(trimmed, "query.locationId");
};

export const listItems: ApiHandler = async (req, res, db) => {
  if (db.readyState !== 1) {
    res.redirect("/health");
    return;
  }

  const { locationId } = req.query as Record<string, unknown>;

  let filter: Record<string, unknown> = {};

  try {
    if (locationId !== undefined) {
      const id = sanitizeLocationQuery(locationId);
      if (id) {
        filter = { locationId: id };
      }
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid query parameters.";
    return sendError(res, StatusCodes.BAD_REQUEST, message, {
      query: req.query,
    });
  }

  try {
    const collection = db.collection(COLLECTION);
    const documents = await collection
      .find(filter)
      .sort({ name: 1 })
      .toArray();

    if (documents.length === 0) {
      res.status(StatusCodes.NO_CONTENT).send();
      return;
    }

    const items = documents.map((doc) =>
      serializeItem(doc as Record<string, unknown>)
    );

    return sendSuccess(res, StatusCodes.OK, { items });
  } catch (error) {
    return handleDatabaseError(res, error, {
      fallbackMessage: "Failed to list items.",
    });
  }
};

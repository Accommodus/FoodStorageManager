import { StatusCodes } from "http-status-codes";
import type { ApiHandler } from "./types.js";
import {
  assertSafePayload,
  isPlainObject,
  sanitizeString,
} from "./validation.js";
import {
  handleDatabaseError,
  sendError,
  sendSuccess,
} from "./responses.js";

const COLLECTION = "locations";
const ALLOWED_TYPES = new Set(["freezer", "fridge", "pantry"]);

const toIsoString = (value: unknown) =>
  value instanceof Date ? value.toISOString() : undefined;

const serializeLocation = (doc: Record<string, unknown>) => {
  const rawAddress = isPlainObject(doc.address)
    ? (doc.address as Record<string, unknown>)
    : {};

  return {
    _id: String(doc._id),
    name: String(doc.name),
    type: String(doc.type),
    address: {
      line1: rawAddress.line1 ? String(rawAddress.line1) : "",
      city: rawAddress.city ? String(rawAddress.city) : "",
      state: rawAddress.state ? String(rawAddress.state) : "",
      zip: rawAddress.zip ? String(rawAddress.zip) : "",
    },
    isActive:
      typeof doc.isActive === "boolean" ? doc.isActive : undefined,
    createdAt: doc.createdAt ? toIsoString(doc.createdAt) : undefined,
    updatedAt: doc.updatedAt ? toIsoString(doc.updatedAt) : undefined,
  };
};

const sanitizeAddress = (value: unknown) => {
  if (!isPlainObject(value)) {
    throw new Error("location.address must be an object.");
  }

  const address = value as Record<string, unknown>;

  const line1 = sanitizeString(address["line1"], "location.address.line1", {
    required: true,
  });
  const city = sanitizeString(address["city"], "location.address.city", {
    required: true,
  });
  const state = sanitizeString(address["state"], "location.address.state", {
    required: true,
  });
  const zip = sanitizeString(address["zip"], "location.address.zip", {
    required: true,
  });

  if (!line1 || !city || !state || !zip) {
    throw new Error("location.address must include line1, city, state, and zip.");
  }

  return {
    line1,
    city,
    state: state.toUpperCase(),
    zip,
  };
};

export const createLocation: ApiHandler = async (req, res, db) => {
  if (db.readyState !== 1) {
    res.redirect("/health");
    return;
  }

  const payload = req.body;

  try {
    assertSafePayload(payload);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Invalid location payload.";
    return sendError(res, StatusCodes.BAD_REQUEST, message);
  }

  if (!isPlainObject(payload) || !isPlainObject(payload.location)) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      "Invalid location request payload."
    );
  }

  const draft = payload.location as Record<string, unknown>;

  let document: Record<string, unknown>;

  try {
    const name = sanitizeString(draft.name, "location.name", {
      required: true,
    });
    if (!name) {
      throw new Error("location.name is required.");
    }

    const type = sanitizeString(draft.type, "location.type", {
      required: true,
    });
    if (!type) {
      throw new Error("location.type is required.");
    }

    if (!ALLOWED_TYPES.has(type)) {
      throw new Error(
        "location.type must be one of freezer, fridge, or pantry."
      );
    }

    const address = sanitizeAddress(draft.address);

    document = {
      name,
      type,
      address,
      isActive:
        typeof draft.isActive === "boolean" ? draft.isActive : true,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Invalid location payload.";
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
      throw new Error("Location could not be retrieved after creation.");
    }

    return sendSuccess(res, StatusCodes.CREATED, {
      location: serializeLocation(created as Record<string, unknown>),
    });
  } catch (error) {
    return handleDatabaseError(res, error, {
      fallbackMessage: "Failed to create location.",
      duplicateMessage: "A location with that name already exists.",
    });
  }
};

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

const COLLECTION = "inventorylots";

const toObjectIdString = (value: unknown) =>
  value instanceof Types.ObjectId ? value.toString() : String(value);

const toIsoString = (value: unknown) =>
  value instanceof Date ? value.toISOString() : undefined;

const serializeLot = (doc: Record<string, unknown>) => ({
  _id: toObjectIdString(doc._id),
  itemId: toObjectIdString(doc.itemId),
  locationId: toObjectIdString(doc.locationId),
  qtyOnHand:
    typeof doc.qtyOnHand === "number" ? doc.qtyOnHand : 0,
  unit: doc.unit ? String(doc.unit) : "ea",
  lotCode: doc.lotCode ? String(doc.lotCode) : undefined,
  expiresAt: doc.expiresAt ? toIsoString(doc.expiresAt) : undefined,
  receivedAt: doc.receivedAt ? toIsoString(doc.receivedAt) : undefined,
  note: doc.note ? String(doc.note) : undefined,
  createdAt: doc.createdAt ? toIsoString(doc.createdAt) : undefined,
  updatedAt: doc.updatedAt ? toIsoString(doc.updatedAt) : undefined,
});

export const upsertLot: ApiHandler = async (req, res, db) => {
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
        : "Invalid inventory lot payload.";
    return sendError(res, StatusCodes.BAD_REQUEST, message);
  }

  if (!isPlainObject(payload) || !isPlainObject(payload.lot)) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      "Invalid inventory lot payload."
    );
  }

  const draft = payload.lot as Record<string, unknown>;

  let query: Record<string, unknown>;
  let updateSet: Record<string, unknown>;
  let updateUnset: Record<string, unknown> = {};

  try {
    const itemId = sanitizeObjectId(draft.itemId, "lot.itemId");
    const locationId = sanitizeObjectId(
      draft.locationId,
      "lot.locationId"
    );
    const qtyOnHand = sanitizeNumber(
      draft.qtyOnHand,
      "lot.qtyOnHand",
      { min: 0 }
    );
    const unit =
      sanitizeString(draft.unit, "lot.unit") ??
      "ea";

    const lotCode = sanitizeString(draft.lotCode, "lot.lotCode");
    const note = sanitizeString(draft.note, "lot.note");
    const expiresAt = sanitizeOptionalDate(
      draft.expiresAt,
      "lot.expiresAt"
    );
    const receivedAt =
      sanitizeOptionalDate(draft.receivedAt, "lot.receivedAt") ??
      new Date();

    query =
      lotCode && lotCode.length > 0
        ? { itemId, locationId, lotCode }
        : { itemId, locationId, lotCode: { $in: [null, undefined] } };

    updateSet = {
      qtyOnHand,
      unit,
      receivedAt,
      updatedAt: new Date(),
    };

    if (lotCode && lotCode.length > 0) {
      updateSet.lotCode = lotCode;
    } else {
      updateUnset.lotCode = "";
    }

    if (expiresAt) {
      updateSet.expiresAt = expiresAt;
    } else {
      updateUnset.expiresAt = "";
    }

    if (note) {
      updateSet.note = note;
    } else {
      updateUnset.note = "";
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Invalid inventory lot payload.";
    return sendError(res, StatusCodes.BAD_REQUEST, message);
  }

  try {
    const collection = db.collection(COLLECTION);
    const now = new Date();
    const update = {
      $set: { ...updateSet },
      ...(Object.keys(updateUnset).length > 0
        ? { $unset: updateUnset }
        : {}),
      $setOnInsert: {
        createdAt: now,
        itemId: query.itemId,
        locationId: query.locationId,
      },
    };

    const result = await collection.findOneAndUpdate(
      query,
      update,
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    if (!result || !result.value) {
      throw new Error("Inventory lot could not be retrieved.");
    }

    const created =
      Boolean(result.lastErrorObject?.upserted);

    return sendSuccess(
      res,
      created ? StatusCodes.CREATED : StatusCodes.OK,
      { lot: serializeLot(result.value as Record<string, unknown>) }
    );
  } catch (error) {
    return handleDatabaseError(res, error, {
      fallbackMessage: "Failed to upsert inventory lot.",
    });
  }
};

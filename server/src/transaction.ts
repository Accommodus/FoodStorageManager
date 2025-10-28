import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import type { ApiHandler } from "./types.js";
import {
  assertSafePayload,
  isPlainObject,
  sanitizeNumber,
  sanitizeObjectId,
  sanitizeOptionalObjectId,
  sanitizeOptionalDate,
  sanitizeString,
} from "./validation.js";
import {
  handleDatabaseError,
  sendError,
  sendSuccess,
} from "./responses.js";

const COLLECTION = "stocktransactions";
const ALLOWED_TYPES = new Set(["IN", "OUT", "MOVE", "ADJUST"]);
const ALLOWED_REASONS = new Set([
  "donation",
  "distribution",
  "damage",
  "count",
  "correction",
  "other",
]);

const toObjectIdString = (value: unknown) =>
  value instanceof Types.ObjectId ? value.toString() : String(value);

const toIsoString = (value: unknown) =>
  value instanceof Date ? value.toISOString() : undefined;

const serializeTransaction = (doc: Record<string, unknown>) => ({
  _id: toObjectIdString(doc._id),
  type: String(doc.type),
  reason: doc.reason ? String(doc.reason) : undefined,
  itemId: toObjectIdString(doc.itemId),
  qty: typeof doc.qty === "number" ? doc.qty : 0,
  unit: doc.unit ? String(doc.unit) : "ea",
  actorId: doc.actorId ? toObjectIdString(doc.actorId) : undefined,
  ref:
    doc.ref && typeof doc.ref === "object"
      ? {
          model: String((doc.ref as Record<string, unknown>).model ?? ""),
          id: toObjectIdString(
            (doc.ref as Record<string, unknown>).id ?? ""
          ),
        }
      : undefined,
  note: doc.note ? String(doc.note) : undefined,
  occurredAt: doc.occurredAt ? toIsoString(doc.occurredAt) : undefined,
  createdAt: doc.createdAt ? toIsoString(doc.createdAt) : undefined,
  updatedAt: doc.updatedAt ? toIsoString(doc.updatedAt) : undefined,
});

export const recordTransaction: ApiHandler = async (req, res, db) => {
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
        : "Invalid stock transaction payload.";
    return sendError(res, StatusCodes.BAD_REQUEST, message);
  }

  if (
    !isPlainObject(payload) ||
    !isPlainObject(payload.transaction)
  ) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      "Invalid stock transaction payload."
    );
  }

  const draft = payload.transaction as Record<string, unknown>;

  let document: Record<string, unknown> | null = null;

  try {
    const type = sanitizeString(draft.type, "transaction.type", {
      required: true,
    });
    if (!type) {
      throw new Error("transaction.type is required.");
    }

    if (!ALLOWED_TYPES.has(type)) {
      throw new Error(
        "transaction.type must be IN, OUT, MOVE, or ADJUST."
      );
    }

    const reason = sanitizeString(
      draft.reason,
      "transaction.reason"
    );
    if (reason && !ALLOWED_REASONS.has(reason)) {
      throw new Error(
        "transaction.reason is not supported."
      );
    }

    const itemId = sanitizeObjectId(
      draft.itemId,
      "transaction.itemId"
    );
    const qty = sanitizeNumber(draft.qty, "transaction.qty", {
      min: 0,
    });

    if (qty <= 0) {
      throw new Error("transaction.qty must be greater than zero.");
    }

    const unit =
      sanitizeString(draft.unit, "transaction.unit") ?? "ea";
    const actorId = sanitizeOptionalObjectId(
      draft.actorId,
      "transaction.actorId"
    );

    let ref:
      | { model: string; id: Types.ObjectId }
      | undefined;

    if (draft.ref !== undefined && draft.ref !== null) {
      if (!isPlainObject(draft.ref)) {
        throw new Error(
          "transaction.ref must include model and id."
        );
      }

      const refModel = sanitizeString(
        draft.ref.model,
        "transaction.ref.model",
        { required: true }
      );
      if (!refModel) {
        throw new Error("transaction.ref.model is required.");
      }

      const refId = sanitizeObjectId(
        draft.ref.id,
        "transaction.ref.id"
      );

      ref = { model: refModel, id: refId };
    }

    const note = sanitizeString(draft.note, "transaction.note");
    const occurredAt =
      sanitizeOptionalDate(
        draft.occurredAt,
        "transaction.occurredAt"
      ) ?? new Date();

    const now = new Date();

    document = {
      type,
      itemId,
      qty,
      unit,
      occurredAt,
      createdAt: now,
      updatedAt: now,
    };

    if (reason) {
      document.reason = reason;
    }

    if (actorId) {
      document.actorId = actorId;
    }

    if (ref) {
      document.ref = ref;
    }

    if (note) {
      document.note = note;
    }

  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Invalid stock transaction payload.";
    return sendError(res, StatusCodes.BAD_REQUEST, message);
  }

  try {
    const collection = db.collection(COLLECTION);
    const prepared = document;

    if (!prepared) {
      throw new Error("Failed to prepare transaction payload.");
    }

    const result = await collection.insertOne(prepared);
    const created = await collection.findOne({ _id: result.insertedId });

    if (!created) {
      throw new Error("Stock transaction could not be retrieved.");
    }

    return sendSuccess(res, StatusCodes.CREATED, {
      transaction: serializeTransaction(
        created as Record<string, unknown>
      ),
    });
  } catch (error) {
    return handleDatabaseError(res, error, {
      fallbackMessage: "Failed to record stock transaction.",
    });
  }
};

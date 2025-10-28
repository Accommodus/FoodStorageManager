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

const COLLECTION = "audits";
const ALLOWED_STATUS = new Set(["draft", "posted"]);

const toObjectIdString = (value: unknown) =>
  value instanceof Types.ObjectId ? value.toString() : String(value);

const toIsoString = (value: unknown) =>
  value instanceof Date ? value.toISOString() : undefined;

const sanitizeAuditLines = (value: unknown) => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("audit.lines must include at least one entry.");
  }

  return value.map((entry, index) => {
    if (!isPlainObject(entry)) {
      throw new Error(`audit.lines[${index}] must be an object.`);
    }

    const lotId = sanitizeObjectId(
      entry.lotId,
      `audit.lines[${index}].lotId`
    );
    const expectedQty = sanitizeNumber(
      entry.expectedQty,
      `audit.lines[${index}].expectedQty`,
      { min: 0 }
    );
    const countedQty = sanitizeNumber(
      entry.countedQty,
      `audit.lines[${index}].countedQty`,
      { min: 0 }
    );
    const note = sanitizeString(
      entry.note,
      `audit.lines[${index}].note`
    );

    const delta = countedQty - expectedQty;

    return {
      lotId,
      expectedQty,
      countedQty,
      delta,
      ...(note ? { note } : {}),
    };
  });
};

const serializeAuditLine = (line: Record<string, unknown>) => ({
  lotId: toObjectIdString(line.lotId),
  expectedQty:
    typeof line.expectedQty === "number" ? line.expectedQty : 0,
  countedQty:
    typeof line.countedQty === "number" ? line.countedQty : 0,
  delta: typeof line.delta === "number"
    ? line.delta
    : (typeof line.countedQty === "number"
        ? line.countedQty
        : 0) - (typeof line.expectedQty === "number"
        ? line.expectedQty
        : 0),
  note: line.note ? String(line.note) : undefined,
});

const serializeAudit = (doc: Record<string, unknown>) => ({
  _id: toObjectIdString(doc._id),
  countedAt: doc.countedAt ? toIsoString(doc.countedAt) : undefined,
  lines: Array.isArray(doc.lines)
    ? doc.lines.map((line) =>
        serializeAuditLine(line as Record<string, unknown>)
      )
    : [],
  createdBy: doc.createdBy ? toObjectIdString(doc.createdBy) : undefined,
  status: doc.status ? String(doc.status) : "draft",
  createdAt: doc.createdAt ? toIsoString(doc.createdAt) : undefined,
  updatedAt: doc.updatedAt ? toIsoString(doc.updatedAt) : undefined,
});

export const createAudit: ApiHandler = async (req, res, db) => {
  if (db.readyState !== 1) {
    res.redirect("/health");
    return;
  }

  const payload = req.body;

  try {
    assertSafePayload(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid audit payload.";
    return sendError(res, StatusCodes.BAD_REQUEST, message);
  }

  if (!isPlainObject(payload) || !isPlainObject(payload.audit)) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      "Invalid audit request payload."
    );
  }

  const draft = payload.audit as Record<string, unknown>;

  let document: Record<string, unknown> | null = null;

  try {
    const countedAt =
      sanitizeOptionalDate(draft.countedAt, "audit.countedAt") ??
      new Date();
    const createdBy = draft.createdBy
      ? sanitizeObjectId(draft.createdBy, "audit.createdBy")
      : undefined;
    const lines = sanitizeAuditLines(draft.lines);
    const statusRaw = sanitizeString(draft.status, "audit.status");
    const status =
      statusRaw && ALLOWED_STATUS.has(statusRaw)
        ? statusRaw
        : "draft";

    const now = new Date();

    document = {
      countedAt,
      lines,
      status,
      createdAt: now,
      updatedAt: now,
    };

    if (createdBy) {
      document.createdBy = createdBy;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid audit payload.";
    return sendError(res, StatusCodes.BAD_REQUEST, message);
  }

  try {
    const prepared = document;

    if (!prepared) {
      throw new Error("Failed to prepare audit payload.");
    }

    const collection = db.collection(COLLECTION);
    const result = await collection.insertOne(prepared);
    const created = await collection.findOne({ _id: result.insertedId });

    if (!created) {
      throw new Error("Audit could not be retrieved after creation.");
    }

    return sendSuccess(res, StatusCodes.CREATED, {
      audit: serializeAudit(created as Record<string, unknown>),
    });
  } catch (error) {
    return handleDatabaseError(res, error, {
      fallbackMessage: "Failed to create audit.",
    });
  }
};

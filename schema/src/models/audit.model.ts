import {
  Schema,
  model,
  Types,
  type InferSchemaType,
  type Connection,
  type Model,
} from "mongoose";
import type { AuditDraft, AuditLineDraft } from "../types/audit";

type NormalizedAuditDraft = {
  countedAt: Date;
  lines: ReturnType<typeof normalizeAuditLine>[];
  createdBy?: Types.ObjectId;
  status: "draft" | "posted";
};

const AuditLineSchema = new Schema(
  {
    lotId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryLot",
      required: true,
    },
    expectedQty: { type: Number, required: true },
    countedQty: { type: Number, required: true },
    delta: { type: Number, required: true },
    note: String,
  },
  { _id: false }
);

export const AuditSchema = new Schema(
  {
    countedAt: { type: Date, default: Date.now },
    lines: { type: [AuditLineSchema], required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["draft", "posted"], default: "posted" },
  },
  { timestamps: true }
);

export type Audit = InferSchemaType<typeof AuditSchema>;

export const AuditModel = model<Audit>("Audit", AuditSchema);

const ensureObjectId = (value: unknown, field: string): Types.ObjectId => {
  if (value instanceof Types.ObjectId) return value;
  if (typeof value === "string" && Types.ObjectId.isValid(value)) {
    return new Types.ObjectId(value);
  }
  throw new Error(`${field} must be a valid ObjectId.`);
};

const normalizeAuditLine = (line: AuditLineDraft) => {
  const countedQty = Number(line.countedQty);
  const expectedQty = Number(line.expectedQty);

  if (!Number.isFinite(countedQty)) {
    throw new Error("countedQty must be a valid number.");
  }

  if (!Number.isFinite(expectedQty)) {
    throw new Error("expectedQty must be a valid number.");
  }

  const lotId = ensureObjectId(line.lotId, "lines[].lotId");

  const delta =
    line.delta !== undefined && line.delta !== null
      ? Number(line.delta)
      : countedQty - expectedQty;

  if (!Number.isFinite(delta)) {
    throw new Error("delta must be a valid number when provided.");
  }

  return {
    lotId,
    expectedQty,
    countedQty,
    delta,
    note: line.note?.trim(),
  };
};

export function normalizeAuditDraft(draft: AuditDraft): NormalizedAuditDraft {
  if (!Array.isArray(draft.lines) || draft.lines.length === 0) {
    throw new Error("Audit must include at least one line.");
  }

  const countedAt = draft.countedAt
    ? new Date(draft.countedAt)
    : new Date(Date.now());

  if (Number.isNaN(countedAt.valueOf())) {
    throw new Error("countedAt must be a valid ISO date string.");
  }

  const lines = draft.lines.map(normalizeAuditLine);

  const normalized: NormalizedAuditDraft = {
    countedAt,
    lines,
    status: draft.status ?? "posted",
  };

  if (draft.createdBy) {
    normalized.createdBy = ensureObjectId(draft.createdBy, "createdBy");
  }

  return normalized;
}

export function getAuditModel(connection: Connection): Model<Audit> {
  return (
    (connection.models.Audit as Model<Audit> | undefined) ??
    connection.model<Audit>("Audit", AuditSchema)
  );
}

export async function createAuditRecord(
  connection: Connection,
  draft: AuditDraft
) {
  const Audit = getAuditModel(connection);
  const normalized = normalizeAuditDraft(draft);
  return Audit.create(normalized);
}

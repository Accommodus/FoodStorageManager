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

const COLLECTION = "users";
const ALLOWED_ROLES = new Set(["admin", "staff", "volunteer"]);

const toIsoString = (value: unknown) =>
  value instanceof Date ? value.toISOString() : undefined;

const sanitizeRoles = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  const roles = value
    .map((entry) =>
      typeof entry === "string" ? entry.trim().toLowerCase() : undefined
    )
    .filter((entry): entry is string => Boolean(entry));

  return roles.filter((role) => ALLOWED_ROLES.has(role));
};

const serializeUser = (doc: Record<string, unknown>) => ({
  _id: String(doc._id),
  email: String(doc.email),
  name: doc.name ? String(doc.name) : undefined,
  roles: Array.isArray(doc.roles)
    ? doc.roles.map((role) => String(role))
    : [],
  enabled:
    typeof doc.enabled === "boolean" ? doc.enabled : undefined,
  createdAt: doc.createdAt ? toIsoString(doc.createdAt) : undefined,
});

export const createUser: ApiHandler = async (req, res, db) => {
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
        : "Invalid user payload.";
    return sendError(res, StatusCodes.BAD_REQUEST, message);
  }

  if (!isPlainObject(payload) || !isPlainObject(payload.user)) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      "Invalid user request payload."
    );
  }

  const draft = payload.user as Record<string, unknown>;

  let document: Record<string, unknown> | null = null;

  try {
    const email = sanitizeString(draft.email, "user.email", {
      required: true,
      lowercase: true,
    });

    if (!email) {
      throw new Error("user.email is required.");
    }

    const name = sanitizeString(draft.name, "user.name");
    const passwordHash = sanitizeString(
      draft.passwordHash,
      "user.passwordHash",
      { allowEmpty: true }
    );

    const roles = sanitizeRoles(draft.roles);
    const enabled =
      typeof draft.enabled === "boolean" ? draft.enabled : true;

    const now = new Date();

    document = {
      email,
      roles,
      enabled,
      createdAt: now,
    };

    if (name) {
      document.name = name;
    }

    if (passwordHash) {
      document.passwordHash = passwordHash;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid user payload.";
    return sendError(res, StatusCodes.BAD_REQUEST, message);
  }

  try {
    const prepared = document;

    if (!prepared) {
      throw new Error("Failed to prepare user payload.");
    }

    const collection = db.collection(COLLECTION);
    const result = await collection.insertOne(prepared);
    const created = await collection.findOne({ _id: result.insertedId });

    if (!created) {
      throw new Error("User could not be retrieved after creation.");
    }

    return sendSuccess(res, StatusCodes.CREATED, {
      user: serializeUser(created as Record<string, unknown>),
    });
  } catch (error) {
    return handleDatabaseError(res, error, {
      fallbackMessage: "Failed to create user.",
      duplicateMessage: "A user with that email already exists.",
    });
  }
};

export const listUsers: ApiHandler = async (_req, res, db) => {
  if (db.readyState !== 1) {
    res.redirect("/health");
    return;
  }

  try {
    const collection = db.collection(COLLECTION);
    const documents = await collection.find().sort({ email: 1 }).toArray();

    const users = documents.map((doc) =>
      serializeUser(doc as Record<string, unknown>)
    );

    return sendSuccess(res, StatusCodes.OK, { users });
  } catch (error) {
    return handleDatabaseError(res, error, {
      fallbackMessage: "Failed to fetch users.",
    });
  }
};

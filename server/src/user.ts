import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";
import type { Types } from "mongoose";
import type { ApiHandler } from "./types.js";
import {
  assertSafePayload,
  isPlainObject,
  sanitizeString,
  sanitizeObjectId,
} from "./validation.js";
import { handleDatabaseError, sendError, sendSuccess } from "./responses.js";

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

const serializeUser = (doc: Record<string, unknown>) => {
  const roles = Array.isArray(doc.roles)
    ? doc.roles.map((role) => String(role))
    : [];
  // Convert roles array to single role for client (take first role or undefined)
  const role = roles.length > 0 ? roles[0] : undefined;

  return {
    _id: String(doc._id),
    email: String(doc.email),
    name: doc.name ? String(doc.name) : undefined,
    role: role as "admin" | "staff" | "volunteer" | undefined,
    enabled: typeof doc.enabled === "boolean" ? doc.enabled : undefined,
    createdAt: doc.createdAt ? toIsoString(doc.createdAt) : undefined,
  };
};

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
      error instanceof Error ? error.message : "Invalid user payload.";
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
    });

    const name = sanitizeString(draft.name, "user.name", {
      required: true,
    });

    const password =
      sanitizeString(draft.password, "user.password", {
        required: true,
      }) ??
      (() => {
        throw new Error("Missing Password");
      })();
    const passwordHash = await bcrypt.hash(password, 10);

    // Convert single role to roles array for database
    const role = sanitizeString(draft.role, "user.role", {
      allowEmpty: true,
    }) ?? "volunteer";
    const roles = [role];

    const enabled = typeof draft.enabled === "boolean" ? draft.enabled : true;

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

export const updateUser: ApiHandler = async (req, res, db) => {
  if (db.readyState !== 1) {
    res.redirect("/health");
    return;
  }

  const { id } = req.params;
  const payload = req.body;

  try {
    assertSafePayload(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid user payload.";
    return sendError(res, StatusCodes.BAD_REQUEST, message);
  }

  if (!isPlainObject(payload) || !isPlainObject(payload.user)) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      "Invalid user request payload."
    );
  }

  let userId: Types.ObjectId;
  try {
    userId = sanitizeObjectId(id, "user.id");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid user ID.";
    return sendError(res, StatusCodes.BAD_REQUEST, message);
  }

  const draft = payload.user as Record<string, unknown>;
  const update: Record<string, unknown> = {};

  try {
    if (draft.name !== undefined) {
      const name = sanitizeString(draft.name, "user.name");
      update.name = name || null;
    }

    if (draft.role !== undefined) {
      // Convert single role to roles array for database
      const role =
        typeof draft.role === "string"
          ? draft.role.trim().toLowerCase()
          : undefined;

      if (role && ALLOWED_ROLES.has(role)) {
        update.roles = [role];
      } else if (role === null || role === undefined || role === "") {
        update.roles = [];
      } else {
        throw new Error(
          `Invalid role: ${role}. Allowed roles are: admin, staff, volunteer.`
        );
      }
    }

    if (draft.enabled !== undefined) {
      update.enabled =
        typeof draft.enabled === "boolean" ? draft.enabled : true;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid user payload.";
    return sendError(res, StatusCodes.BAD_REQUEST, message);
  }

  try {
    const collection = db.collection(COLLECTION);
    const existing = await collection.findOne({ _id: userId });

    if (!existing) {
      return sendError(res, StatusCodes.NOT_FOUND, "User not found.");
    }

    await collection.updateOne({ _id: userId }, { $set: update });
    const updated = await collection.findOne({ _id: userId });

    if (!updated) {
      throw new Error("User could not be retrieved after update.");
    }

    return sendSuccess(res, StatusCodes.OK, {
      user: serializeUser(updated as Record<string, unknown>),
    });
  } catch (error) {
    return handleDatabaseError(res, error, {
      fallbackMessage: "Failed to update user.",
    });
  }
};

export const deleteUser: ApiHandler = async (req, res, db) => {
  if (db.readyState !== 1) {
    res.redirect("/health");
    return;
  }

  const { id } = req.params;

  let userId: Types.ObjectId;
  try {
    userId = sanitizeObjectId(id, "user.id");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid user ID.";
    return sendError(res, StatusCodes.BAD_REQUEST, message);
  }

  try {
    const collection = db.collection(COLLECTION);
    const result = await collection.deleteOne({ _id: userId });

    if (result.deletedCount === 0) {
      return sendError(res, StatusCodes.NOT_FOUND, "User not found.");
    }

    return sendSuccess(res, StatusCodes.OK, { deleted: true });
  } catch (error) {
    return handleDatabaseError(res, error, {
      fallbackMessage: "Failed to delete user.",
    });
  }
};

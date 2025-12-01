import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";
import { type Connection, type Types } from "mongoose";
import type { ApiHandler } from "./types.js";
import {
  assertSafePayload,
  isPlainObject,
  sanitizeString,
  sanitizeObjectId,
} from "./validation.js";
import { handleDatabaseError, sendError, sendSuccess } from "./responses.js";
import type { UserResource } from "@foodstoragemanager/schema";

const COLLECTION = "users";
const ALLOWED_ROLES = new Set(["admin", "staff", "volunteer"]);

function formatNow(): string {
  return new Date().toISOString();
}

function toIsoString(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString();
  else if (typeof value === "string") {
    const date = new Date(value);
    return date.toISOString();
  } else return undefined;
}

function sanitizeRoles(value: unknown): string | undefined {
  if (Array.isArray(value) && value.length > 0) {
    const role = typeof value[0] === "string" ? value[0] : undefined;
    const normalized = role?.trim().toLowerCase();
    return normalized && ALLOWED_ROLES.has(normalized) ? normalized : undefined;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ALLOWED_ROLES.has(normalized) ? normalized : undefined;
  }

  return undefined;
}

function serializeUser(doc: Record<string, unknown>): UserResource {
  const role = sanitizeRoles(doc.roles ?? doc.role) ?? "volunteer";
  const createdAt: string = toIsoString(doc.createdAt) ?? formatNow();

  return {
    _id: String(doc._id),
    email: String(doc.email),
    name: doc.name ? String(doc.name) : "",
    role: [role as "admin" | "staff" | "volunteer"],
    enabled: typeof doc.enabled === "boolean" ? doc.enabled : true,
    createdAt: createdAt,
  };
}

async function getUsers(db: Connection): Promise<UserResource[]> {
  const collection = db.collection(COLLECTION);
  const documents = await collection.find().sort({ email: 1 }).toArray();

  const users = documents.map((doc) =>
    serializeUser(doc as Record<string, unknown>)
  );

  return users;
}

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
      lowercase: true,
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

    const role = sanitizeString(draft.role, "user.role", {
      allowEmpty: true,
      lowercase: true,
    });

    const enabled = typeof draft.enabled === "boolean" ? draft.enabled : true;

    const now = new Date();
    document = {
      email,
      roles: role && ALLOWED_ROLES.has(role) ? [role] : ["volunteer"],
      enabled,
      createdAt: now,
      updatedAt: now,
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
    const users = await getUsers(db);

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

export const authenticateUser: ApiHandler = async (req, res, db) => {
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
        : "Invalid authentication payload.";
    return sendError(res, StatusCodes.BAD_REQUEST, message);
  }

  if (!isPlainObject(payload)) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      "Invalid authentication request payload."
    );
  }

  let emailRaw: string;
  let password: string;

  try {
    emailRaw = sanitizeString(payload.email, "auth.email", {
      required: true,
    })!;
    password = sanitizeString(payload.password, "auth.password", {
      required: true,
    })!;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Invalid authentication payload.";
    return sendError(res, StatusCodes.BAD_REQUEST, message);
  }

  const normalizedEmail = emailRaw.toLowerCase();
  const emailCandidates = Array.from(new Set([normalizedEmail, emailRaw]));

  try {
    const collection = db.collection(COLLECTION);
    const user = await collection.findOne({
      email: { $in: emailCandidates },
    });

    const passwordHash =
      user && typeof (user as Record<string, unknown>).passwordHash === "string"
        ? (user as Record<string, string>).passwordHash
        : undefined;

    if (!user || !passwordHash) {
      return sendError(
        res,
        StatusCodes.UNAUTHORIZED,
        "Invalid email or password."
      );
    }

    const isMatch = await bcrypt.compare(password, passwordHash);

    if (!isMatch) {
      return sendError(
        res,
        StatusCodes.UNAUTHORIZED,
        "Invalid email or password."
      );
    }

    if (user.enabled === false) {
      return sendError(
        res,
        StatusCodes.FORBIDDEN,
        "This account is disabled. Contact an administrator."
      );
    }

    return sendSuccess(res, StatusCodes.OK, {
      user: serializeUser(user as Record<string, unknown>),
    });
  } catch (error) {
    return handleDatabaseError(res, error, {
      fallbackMessage: "Failed to authenticate user.",
    });
  }
};

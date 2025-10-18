import {
  Schema,
  model,
  type InferSchemaType,
  type Connection,
  type Model,
} from "mongoose";
import type { UserDraft } from "../types/user";

export const UserSchema = new Schema({
  email: { type: String, unique: true, index: true, required: true },
  name: String,
  passwordHash: String,
  roles: [{ type: String, enum: ["admin", "staff", "volunteer"] }],
  enabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export type User = InferSchemaType<typeof UserSchema>;

export const UserModel = model<User>("User", UserSchema);

export function normalizeUserDraft(draft: UserDraft) {
  if (!draft.email?.trim()) {
    throw new Error("User email is required.");
  }

  const normalizedRoles =
    draft.roles?.filter((role): role is "admin" | "staff" | "volunteer" =>
      ["admin", "staff", "volunteer"].includes(role as string)
    ) ?? [];

  return {
    email: draft.email.trim().toLowerCase(),
    name: draft.name?.trim(),
    passwordHash: draft.passwordHash,
    roles: normalizedRoles,
    enabled: draft.enabled ?? true,
  };
}

export function getUserModel(connection: Connection): Model<User> {
  return (
    (connection.models.User as Model<User> | undefined) ??
    connection.model<User>("User", UserSchema)
  );
}

export async function createUserRecord(
  connection: Connection,
  draft: UserDraft
) {
  const User = getUserModel(connection);
  const normalized = normalizeUserDraft(draft);
  return User.create(normalized);
}

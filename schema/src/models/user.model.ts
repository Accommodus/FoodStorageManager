import { Schema, model, type InferSchemaType } from "mongoose";

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

import type { ApiResponse, ISODateString, ObjectIdString } from "./types.js";

const allowedRoles = ["admin", "staff", "volunteer"] as const;
export type Role = (typeof allowedRoles)[number];

export function toRole(value: unknown): Role {
  return typeof value === "string" && allowedRoles.includes(value as Role)
    ? (value as Role)
    : "volunteer";
}

export interface UserDraft {
  email: string;
  name: string;
  password: string;
  role?: Role;
}

export interface UserResource {
  _id: ObjectIdString;
  email: string;
  name: string;
  role: Role;
  enabled: boolean;
  createdAt: ISODateString;
}

export interface AuthenticateUserPayload {
  email: string;
  password: string;
}

export type AuthenticateUserResponse = ApiResponse<{ user: UserResource }>;
export type CreateUserResponse = ApiResponse<{ user: UserResource }>;
export type UpdateUserResponse = ApiResponse<{ user: UserResource }>;
export type DeleteUserResponse = ApiResponse<{ deleted: boolean }>;
export type ListUsersResponse = ApiResponse<{ users: UserResource[] }>;

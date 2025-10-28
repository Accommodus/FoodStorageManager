import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";
import type { ServerHealth } from "./types.js";
import { sendError, sendSuccess } from "./responses.js";

export function getHealth(
  _req: Request,
  res: Response,
  health: ServerHealth
) {
  if (health.ok) {
    return sendSuccess(res, StatusCodes.OK, { healthy: true });
  }

  const message = health.error?.message ?? "Database connection unavailable.";
  return sendError(res, StatusCodes.SERVICE_UNAVAILABLE, message, {
    reason: health.error?.name,
  });
}

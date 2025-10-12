import { ApiResponse, ServerHealth } from "./types";
import { Request, Response } from "express";

type HealthData = { healthy: true } | { healthy: false; error: Error };

export function getHealth(_req: Request, res: Response, health: ServerHealth) {
  if (health.ok) {
    new ApiResponse<HealthData>(200, { healthy: true }).send(res);
  } else {
    new ApiResponse<HealthData>(503, {
      healthy: false,
      error: health.error,
    }).send(res);
  }
}

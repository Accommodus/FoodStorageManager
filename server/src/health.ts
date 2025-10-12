import { connectDB } from "./db";
import { ApiHandler, ApiResponse } from "./types";

type HealthData = { healthy: true } | { healthy: false; error: Error };

export const getHealth: ApiHandler = async (_req, res) => {
  let health = await connectDB();

  if (health.ok) {
    new ApiResponse<HealthData>(200, {healthy: true}).send(res)
  } else {
    new ApiResponse<HealthData>(503, {healthy: false, error: health.error}).send(res)
  }
};

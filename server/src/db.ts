import mongoose from "mongoose";
import { ServerHealth } from "./types";

const mongoUri: string =
  process.env.MONGODB_URI ??
  (() => {
    throw new Error("Missing MONGODB_URI");
  })();
//const mongoUri: string = process.env.MONGODB_URI ?? "mongodb://db:27017/local"

export function connectDB(uri: string = mongoUri): ServerHealth {
  try {
    mongoose.connect(uri);
    return { ok: true, value: mongoose.connection };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return { ok: false, error };
  }
}

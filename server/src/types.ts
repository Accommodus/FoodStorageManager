import type express from "express";
import type mongoose from "mongoose";

export type Result<T> = { ok: true; value: T } | { ok: false; error: Error };

type MaybePromise = void | Promise<void>;

export type ApiHandler = (
  req: express.Request,
  res: express.Response,
  db: mongoose.Connection
) => MaybePromise;

export type ServerHealth = Result<mongoose.Connection>;

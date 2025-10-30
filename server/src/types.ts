import express from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

export type Result<T> = { ok: true; value: T } | { ok: false; error: Error };

type MaybePromise = void | Promise<void>;
export type ApiHandler<WithDB extends boolean = true> = WithDB extends true
  ? (
      req: express.Request,
      res: express.Response,
      db: mongoose.Connection
    ) => MaybePromise
  : (req: express.Request, res: express.Response) => MaybePromise;

type StatusCode = (typeof StatusCodes)[keyof typeof StatusCodes];
export class ApiResponse<T> {
  constructor(public status: StatusCode, public data: T) {}

  send(res: express.Response) {
    res.status(this.status).json(this.data);
  }
}

export type ServerHealth = Result<mongoose.Connection>;

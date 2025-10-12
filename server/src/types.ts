import express from "express";
import { StatusCodes } from "http-status-codes";

export type MaybeError = { ok: true } | { ok: false; error: Error };

type MaybePromise = void | Promise<void>;
export type ApiHandler = (
  req: express.Request,
  res: express.Response
) => MaybePromise;

type StatusCode = (typeof StatusCodes)[keyof typeof StatusCodes];
export class ApiResponse<T> {
  constructor(public status: StatusCode, public data: T) {}

  send(res: express.Response) {
    res.status(this.status).json(this.data)
  }
}

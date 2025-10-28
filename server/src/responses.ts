import type express from "express";
import { StatusCodes } from "http-status-codes";

type Issues = Record<string, unknown> | undefined;

export const sendSuccess = <TData extends Record<string, unknown>>(
  res: express.Response,
  status: number,
  data: TData
) => {
  res.status(status).json(data);
};

export const sendError = (
  res: express.Response,
  status: number,
  message: string,
  issues?: Issues
) => {
  const payload: {
    error: { message: string; issues?: Issues };
  } = { error: { message } };

  if (issues && Object.keys(issues).length > 0) {
    payload.error.issues = issues;
  }

  res.status(status).json(payload);
};

type MongoLikeError = { code?: number } | undefined;

export const handleDatabaseError = (
  res: express.Response,
  error: unknown,
  options: {
    fallbackMessage: string;
    duplicateMessage?: string;
  }
) => {
  const code =
    (typeof error === "object" && error !== null
      ? (error as MongoLikeError)?.code
      : undefined) ?? undefined;

  if (typeof code === "number" && code === 11000) {
    return sendError(
      res,
      StatusCodes.CONFLICT,
      options.duplicateMessage ?? options.fallbackMessage
    );
  }

  return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, options.fallbackMessage);
};

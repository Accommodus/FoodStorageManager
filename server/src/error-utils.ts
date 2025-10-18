import { StatusCodes } from "http-status-codes";

type MongoError = Error & { code?: number };
type ValidationLikeError = Error & { errors?: Record<string, unknown> };

const validationErrorNames = new Set([
  "ValidationError",
  "CastError",
  "SchemaValidationError",
]);

const isMongoDuplicateKeyError = (error: MongoError) =>
  typeof error.code === "number" && error.code === 11000;

const looksLikeValidationMessage = (message: string) => {
  const lowered = message.toLowerCase();
  return (
    lowered.includes("must") ||
    lowered.includes("required") ||
    lowered.includes("invalid") ||
    lowered.includes("not a valid")
  );
};

export function mapErrorToStatus(error: unknown): 400 | 409 | 500 {
  if (!(error instanceof Error)) {
    return StatusCodes.INTERNAL_SERVER_ERROR;
  }

  if (validationErrorNames.has(error.name)) {
    return StatusCodes.BAD_REQUEST;
  }

  if (
    looksLikeValidationMessage(error.message) ||
    "errors" in (error as ValidationLikeError)
  ) {
    return StatusCodes.BAD_REQUEST;
  }

  if (isMongoDuplicateKeyError(error as MongoError)) {
    return StatusCodes.CONFLICT;
  }

  return StatusCodes.INTERNAL_SERVER_ERROR;
}

export function mapErrorToIssues(error: unknown) {
  if (!(error instanceof Error)) {
    return undefined;
  }

  const issues: Record<string, unknown> = { name: error.name };

  if ("errors" in error && typeof error.errors === "object") {
    issues.validation = error.errors;
  }

  return issues;
}

import { Types } from "mongoose";

const ILLEGAL_KEY_PATTERN = /(^\$)|(\.)/;
const MALICIOUS_STRING_PATTERN = /<\s*script|<\/\s*script|javascript:/i;

export const isPlainObject = (
  value: unknown
): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === "[object Object]";

export const assertSafePayload = (
  value: unknown,
  path = "payload"
): void => {
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      assertSafePayload(entry, `${path}[${index}]`)
    );
    return;
  }

  if (!isPlainObject(value)) {
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    if (ILLEGAL_KEY_PATTERN.test(key)) {
      throw new Error(`Unsafe key "${key}" detected at ${path}.`);
    }

    if (typeof child === "string") {
      const candidate = child.trim();
      if (
        candidate.length > 0 &&
        MALICIOUS_STRING_PATTERN.test(candidate)
      ) {
        throw new Error(
          `Potentially malicious content detected at ${path}.${key}.`
        );
      }
    }

    if (child && typeof child === "object") {
      assertSafePayload(child, `${path}.${key}`);
    }
  }
};

type StringOptions = {
  required?: boolean;
  lowercase?: boolean;
  allowEmpty?: boolean;
  maxLength?: number;
};

export const sanitizeString = (
  input: unknown,
  field: string,
  options: StringOptions = {}
): string | undefined => {
  if (input === undefined || input === null) {
    if (options.required) {
      throw new Error(`${field} is required.`);
    }
    return undefined;
  }

  if (typeof input !== "string") {
    throw new Error(`${field} must be a string.`);
  }

  let value = input.trim();

  if (!options.allowEmpty && value.length === 0) {
    if (options.required) {
      throw new Error(`${field} is required.`);
    }
    return undefined;
  }

  if (value.length > 0 && MALICIOUS_STRING_PATTERN.test(value)) {
    throw new Error(`${field} contains disallowed content.`);
  }

  if (options.lowercase) {
    value = value.toLowerCase();
  }

  if (options.maxLength && value.length > options.maxLength) {
    value = value.slice(0, options.maxLength);
  }

  return value;
};

export const sanitizeNumber = (
  input: unknown,
  field: string,
  options: { min?: number; max?: number } = {}
): number => {
  const value =
    typeof input === "number" ? input : Number.parseFloat(String(input));

  if (!Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number.`);
  }

  if (options.min !== undefined && value < options.min) {
    throw new Error(`${field} must be >= ${options.min}.`);
  }

  if (options.max !== undefined && value > options.max) {
    throw new Error(`${field} must be <= ${options.max}.`);
  }

  return value;
};

export const sanitizeObjectId = (
  input: unknown,
  field: string
): Types.ObjectId => {
  if (input instanceof Types.ObjectId) {
    return input;
  }

  if (typeof input === "string" && Types.ObjectId.isValid(input)) {
    return new Types.ObjectId(input);
  }

  throw new Error(`${field} must be a valid ObjectId string.`);
};

export const sanitizeOptionalObjectId = (
  input: unknown,
  field: string
): Types.ObjectId | undefined => {
  if (input === undefined || input === null || input === "") {
    return undefined;
  }

  return sanitizeObjectId(input, field);
};

export const sanitizeOptionalDate = (
  input: unknown,
  field: string
): Date | undefined => {
  if (input === undefined || input === null || input === "") {
    return undefined;
  }

  if (input instanceof Date && !Number.isNaN(input.valueOf())) {
    return input;
  }

  const candidate =
    typeof input === "string" || typeof input === "number"
      ? new Date(input)
      : undefined;

  if (candidate && !Number.isNaN(candidate.valueOf())) {
    return candidate;
  }

  throw new Error(`${field} must be a valid date.`);
};

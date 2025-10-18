import type {
  ApiRequest,
  ApiResponse,
  RequestBody,
  ResponseData,
  ResponseError,
  ResponseStatus,
} from "./api";
import type { Audit } from "../models/audit.model";

type ObjectIdLike = string;

export type AuditLineDraft = {
  lotId: ObjectIdLike;
  expectedQty: number;
  countedQty: number;
  delta?: number;
  note?: string;
};

export type AuditDraft = {
  countedAt?: string;
  lines: AuditLineDraft[];
  createdBy?: ObjectIdLike;
  status?: "draft" | "posted";
};

export type CreateAuditRequest = ApiRequest<
  RequestBody<{ audit: AuditDraft }>
>;

export type CreateAuditSuccess = ApiResponse<
  ResponseData<{ audit: Audit }>,
  ResponseStatus<201>
>;

export type CreateAuditFailure = ApiResponse<
  ResponseError<{ message: string; issues?: Record<string, unknown> }>,
  ResponseStatus<400 | 409 | 500>
>;

export type CreateAuditResponse = CreateAuditSuccess | CreateAuditFailure;

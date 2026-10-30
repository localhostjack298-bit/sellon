export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "LIMIT"
  | "POLICY"
  | "RATE_LIMITED"
  | "INTERNAL";

const STATUS: Record<ErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  VALIDATION: 422,
  NOT_FOUND: 404,
  CONFLICT: 409,
  LIMIT: 409,
  POLICY: 422,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

/** Expected, user-presentable failure. Anything else is treated as an unexpected internal error. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly fieldErrors?: Record<string, string[]>;
  readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, opts: { fieldErrors?: Record<string, string[]>; details?: Record<string, unknown> } = {}) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.fieldErrors = opts.fieldErrors;
    this.details = opts.details;
  }

  get status() {
    return STATUS[this.code];
  }
}

export const Errors = {
  unauthenticated: (message = "Please sign in to continue.") => new AppError("UNAUTHENTICATED", message),
  forbidden: (message = "You don't have permission to do that.", details?: Record<string, unknown>) => new AppError("FORBIDDEN", message, { details }),
  notFound: (what = "That record") => new AppError("NOT_FOUND", `${what} could not be found.`),
  conflict: (message: string) => new AppError("CONFLICT", message),
  limit: (message: string, details?: Record<string, unknown>) => new AppError("LIMIT", message, { details }),
  policy: (message: string) => new AppError("POLICY", message),
  validation: (message: string, fieldErrors?: Record<string, string[]>) => new AppError("VALIDATION", message, { fieldErrors }),
};

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}

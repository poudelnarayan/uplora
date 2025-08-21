// Simple API response utilities for Clerk integration

export function createSuccessResponse(data: any) {
  return {
    ok: true,
    ...data
  };
}

export function createErrorResponse(code: string, message: string, fieldErrors?: Record<string, string>) {
  return {
    ok: false,
    code,
    message,
    fieldErrors
  };
}

export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DUPLICATE_EMAIL: "DUPLICATE_EMAIL",
  INTERNAL_ERROR: "INTERNAL_ERROR"
} as const;

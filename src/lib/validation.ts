import { z } from "zod";

// Authentication schemas
export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Invalid or missing token"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const teamCreateSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100, "Team name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
});

// Error codes for consistent API responses
export const ErrorCodes = {
  // Authentication
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  DUPLICATE_EMAIL: "DUPLICATE_EMAIL",
  WEAK_PASSWORD: "WEAK_PASSWORD",
  INVALID_EMAIL: "INVALID_EMAIL",
  
  // Authorization
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  
  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  MISSING_FIELDS: "MISSING_FIELDS",
  
  // Database
  DATABASE_ERROR: "DATABASE_ERROR",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  
  // General
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NOT_FOUND: "NOT_FOUND",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// Standard API error response
export interface ApiErrorResponse {
  ok: false;
  code: ErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
  details?: string;
}

// Standard API success response
export interface ApiSuccessResponse<T = any> {
  ok: true;
  data: T;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// Helper function to create error responses
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  fieldErrors?: Record<string, string>,
  details?: string
): ApiErrorResponse {
  return {
    ok: false,
    code,
    message,
    fieldErrors,
    details,
  };
}

// Helper function to create success responses
export function createSuccessResponse<T>(data: T): ApiSuccessResponse<T> {
  return {
    ok: true,
    data,
  };
}

// Helper function to handle Zod validation errors
export function handleZodError(error: z.ZodError): ApiErrorResponse {
  const fieldErrors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const field = err.path.join(".");
    fieldErrors[field] = err.message;
  });

  return createErrorResponse(
    ErrorCodes.VALIDATION_ERROR,
    "Validation failed",
    fieldErrors
  );
}

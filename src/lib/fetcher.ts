import React from "react";
import { signOut } from "next-auth/react";
import { useNotifications } from "@/components/ui/Notification";
import { ApiResponse, createErrorResponse, ErrorCodes } from "./validation";

// Global notification instance (will be set by the hook)
let globalNotifications: ReturnType<typeof useNotifications> | null = null;

export function setGlobalNotifications(notifications: ReturnType<typeof useNotifications>) {
  globalNotifications = notifications;
}

// Enhanced fetch with error handling and 401 interceptor
export async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    // Handle 401 Unauthorized globally
    if (response.status === 401) {
      // Show session expired notification
      if (globalNotifications) {
        globalNotifications.addNotification({
          type: "error",
          title: "Session Expired",
          message: "Please sign in again to continue.",
        });
      }
      
      // Sign out and redirect to signin
      await signOut({ redirect: false });
      window.location.href = "/signin";
      
      return createErrorResponse(
        ErrorCodes.UNAUTHORIZED,
        "Session expired. Please sign in again."
      );
    }

    // Handle 405 Method Not Allowed
    if (response.status === 405) {
      return createErrorResponse(
        ErrorCodes.METHOD_NOT_ALLOWED,
        "Method not allowed for this endpoint."
      );
    }

    // Handle other HTTP errors
    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        // If response is not JSON, create generic error
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }

      return createErrorResponse(
        errorData.code || ErrorCodes.INTERNAL_ERROR,
        errorData.message || `Request failed with status ${response.status}`,
        errorData.fieldErrors,
        errorData.details
      );
    }

    // Parse successful response
    const data = await response.json();
    return {
      ok: true,
      data,
    };
  } catch (error) {
    console.error("API fetch error:", error);
    
    // Network or parsing error
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Network error. Please check your connection and try again."
    );
  }
}

// Convenience methods for common HTTP verbs
export const api = {
  get: <T = any>(url: string, options?: RequestInit) =>
    apiFetch<T>(url, { ...options, method: "GET" }),
    
  post: <T = any>(url: string, data?: any, options?: RequestInit) =>
    apiFetch<T>(url, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  put: <T = any>(url: string, data?: any, options?: RequestInit) =>
    apiFetch<T>(url, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  patch: <T = any>(url: string, data?: any, options?: RequestInit) =>
    apiFetch<T>(url, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  delete: <T = any>(url: string, options?: RequestInit) =>
    apiFetch<T>(url, { ...options, method: "DELETE" }),
};

// Hook for components to use the enhanced fetch
export function useApi() {
  const notifications = useNotifications();
  
  // Set global notifications for 401 handling
  React.useEffect(() => {
    setGlobalNotifications(notifications);
  }, [notifications]);
  
  return api;
}

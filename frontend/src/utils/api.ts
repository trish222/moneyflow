/**
 * api.ts is the single entry point for every backend request.
 * - Attaches the bearer token and clears the session on 401
 * - Unwraps the backend's { success, data, error } envelope so callers read payloads directly
 */

const API_BASE_URL = "http://localhost:3000/api";

export interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface ApiEnvelope {
  success: boolean;
  data: unknown;
  error: { code: string; message: string; details?: unknown } | null;
}

function isEnvelope(body: unknown): body is ApiEnvelope {
  return (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    "data" in body &&
    "error" in body
  );
}

export async function apiCall(endpoint: string, options: FetchOptions = {}) {
  const token = localStorage.getItem("accessToken");
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = isFormData
    ? { ...options.headers }
    : {
        "Content-Type": "application/json",
        ...options.headers,
      };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  // Unwrap the envelope here so pages keep reading the payload (or { error, message }) directly
  const readJson = response.json.bind(response);
  response.json = async () => {
    const body = await readJson();
    if (!isEnvelope(body)) return body;
    if (body.success) return body.data;
    return {
      error: body.error?.code,
      message: body.error?.message,
      details: body.error?.details,
    };
  };

  return response;
}

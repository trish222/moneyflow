const API_BASE_URL = "http://localhost:3000/api";

export interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
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

  return response;
}

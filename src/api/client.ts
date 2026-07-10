const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Unified API Client wrapping the native Fetch API.
 * Handles base URL configuration, automatically formats headers,
 * and throws structured errors on non-2xx responses so TanStack Query handles errors.
 */
export async function apiClient<T>(path: string, options?: RequestInit): Promise<T> {
  // Combine base URL and target endpoint path
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  // Native fetch does not throw on HTTP status errors (like 404 or 500)
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const body = await response.json();
      if (body && body.error) {
        errorMessage = body.error;
      }
    } catch {
      // Fallback to generic status text if response is not JSON
    }
    throw new Error(errorMessage);
  }

  const payload = await response.json();
  
  // Standard API envelope uses { data: T }
  return payload.data !== undefined ? payload.data : payload;
}
export default apiClient;

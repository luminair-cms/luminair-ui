import type { ProblemDetails } from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Query helper for GET requests.
 * Handles base URL configuration, automatically formats headers,
 * unwraps the `{ data: T }` response envelope, and throws a structured
 * `Error` on non-2xx responses so TanStack Query handles errors.
 */
export async function apiQuery<T>(path: string, options?: RequestInit): Promise<T> {
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

/**
 * Mutation helper for non-GET requests (POST, PUT, DELETE).
 *
 * Unlike {@link apiQuery}, this function:
 * - Returns both `data` and `headers` so callers can inspect response headers
 *   (e.g., the `Location` header from a 201 Created response).
 * - Throws a {@link ProblemDetails} object on non-2xx responses, giving
 *   mutations a consistent, structured error type matching the backend's
 *   RFC 7807 / RFC 9457 error format.
 * - Handles empty response bodies (e.g., 201 Created with no body).
 */
export async function apiMutate<TResponse, TBody = unknown>(
  path: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: TBody,
): Promise<{ data: TResponse; headers: Headers }> {
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    // Backend returns RFC 7807 Problem Details on error
    const err: ProblemDetails = await response.json();
    throw err;
  }

  // Some endpoints (e.g. 201 Created) return an empty body
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as { data?: TResponse } | TResponse) : undefined;
  const data =
    payload !== undefined && typeof payload === 'object' && payload !== null && 'data' in payload
      ? (payload as { data: TResponse }).data
      : (payload as TResponse);

  return { data, headers: response.headers };
}

export default apiQuery;

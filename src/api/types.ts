// --- Truly Shared API Schema Interfaces (Conforming to Backend DTOs) ---

export interface DocumentResponse {
  id: string;
  title: string;
  type: 'collection' | 'single';
  description: string | null;
}

/** RFC 7807 / RFC 9457 Problem Details — shape returned by the backend on error */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiQuery, apiMutate } from './client';

describe('API Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('apiQuery', () => {
    it('returns data directly if data key exists in response payload', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { id: 1, name: 'Test' } }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await apiQuery<{ id: number; name: string }>('/test');
      expect(result).toEqual({ id: 1, name: 'Test' });
      expect(mockFetch).toHaveBeenCalledWith('/test', expect.any(Object));
    });

    it('returns payload directly if data key does not exist in response payload', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await apiQuery('/test');
      expect(result).toEqual({ success: true });
    });

    it('throws structured error if response is not ok', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Bad Request Parameter' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(apiQuery('/test')).rejects.toThrow('Bad Request Parameter');
    });
  });

  describe('apiMutate', () => {
    it('sends body and returns response data + headers', async () => {
      const mockHeaders = new Headers();
      mockHeaders.append('Location', '/api/documents/brands/1');
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ data: { success: true } })),
        headers: mockHeaders,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await apiMutate<{ success: boolean }, { name: string }>('/test', 'POST', {
        name: 'New Brand',
      });

      expect(result.data).toEqual({ success: true });
      expect(result.headers.get('Location')).toBe('/api/documents/brands/1');
      expect(mockFetch).toHaveBeenCalledWith(
        '/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'New Brand' }),
        }),
      );
    });

    it('throws raw ProblemDetails object if response is not ok', async () => {
      const mockError = {
        type: 'https://tools.ietf.org/html/rfc7807',
        title: 'Validation Error',
        status: 422,
        detail: 'Name is required',
      };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(mockError),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(apiMutate('/test', 'POST')).rejects.toEqual(mockError);
    });
  });
});
export default apiQuery;

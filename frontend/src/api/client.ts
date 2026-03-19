const API_BASE = '/api/v1';

/** Structured error from API responses. */
class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Sends a request to the API and unwraps the `data` field from the response. */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const json = await response.json();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      json.error?.code || 'UNKNOWN_ERROR',
      json.error?.message || 'Request failed',
    );
  }

  return json.data as T;
}

export interface LinkResponse {
  id: string;
  slug: string;
  targetUrl: string;
  expiresAt: string | null;
  createdAt: string;
  deletedAt: string | null;
  _count?: { clicks: number };
}

export interface CreateLinkRequest {
  url: string;
  slug?: string;
  expiresAt?: string;
}

export interface UpdateLinkRequest {
  url?: string;
  expiresAt?: string | null;
}

export interface AnalyticsResponse {
  totalClicks: number;
  dailyClicks: Array<{ date: string; count: number }>;
  browserBreakdown: Array<{ name: string; count: number }>;
  osBreakdown: Array<{ name: string; count: number }>;
  deviceBreakdown: Array<{ name: string; count: number }>;
}

export const api = {
  links: {
    list: () => request<LinkResponse[]>('/links'),
    create: (body: CreateLinkRequest) =>
      request<LinkResponse>('/links', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (id: string, body: UpdateLinkRequest) =>
      request<LinkResponse>(`/links/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      request<void>(`/links/${id}`, {
        method: 'DELETE',
      }),
  },
  analytics: {
    get: (linkId: string, range = '30d') =>
      request<AnalyticsResponse>(`/links/${linkId}/analytics?range=${range}`),
  },
};

export { ApiError };

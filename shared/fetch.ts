// Interface définissant le contrat du fetch

export interface FetchOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
}

export interface FetchResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
}

// Interface du fetch - contrat que doivent respecter fake et real fetch
export interface FetchInterface {
  <T = unknown>(url: string, options?: FetchOptions): Promise<FetchResponse<T>>;
}

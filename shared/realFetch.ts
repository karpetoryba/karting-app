// Real fetch implementation - appels HTTP réels

import { FetchInterface, FetchOptions, FetchResponse } from './fetch';

// Base URL for the API - à configurer selon l'environnement
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

export const realFetch: FetchInterface = async <T = unknown>(
  url: string,
  options: FetchOptions = { method: 'GET' }
): Promise<FetchResponse<T>> => {
  try {
    const fullUrl = `${API_BASE_URL}${url}`;

    const fetchOptions: RequestInit = {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    if (options.body && options.method !== 'GET') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(fullUrl, fetchOptions);

    let data: T | undefined;

    // Try to parse JSON response
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      return {
        ok: false,
        error: (data as { message?: string })?.message || `HTTP Error: ${response.status}`,
        status: response.status,
      };
    }

    return {
      ok: true,
      data,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
  }
};

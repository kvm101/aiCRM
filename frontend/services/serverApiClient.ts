import { cookies } from 'next/headers';

const API_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface FetchOptions extends RequestInit {
  // Add custom options if needed
}

/**
 * Server-side API client using native fetch.
 * To be used ONLY in Server Components, Server Actions, or Route Handlers.
 */
export async function serverFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;
  
  if (userId) {
    headers.set('X-User-Id', userId);
    // Для BFF можна тимчасово передавати дефолтну роль, оскільки бекенд має доступ до бази
    headers.set('X-User-Role', 'MANAGER');
  }

  const config: RequestInit = {
    ...options,
    headers,
    cache: 'no-store', // Завжди отримувати свіжі дані з бекенду
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    throw new Error(`Server API Error: ${response.status} ${response.statusText} for ${url}`);
  }

  // Handle empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

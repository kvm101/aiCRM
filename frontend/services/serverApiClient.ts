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

  // In a real app, you would read the auth token or user info from cookies here:
  // const cookieStore = await cookies();
  // const token = cookieStore.get('auth-token')?.value;
  // if (token) headers.set('Authorization', `Bearer ${token}`);
  
  // Since we use mock user headers in the client app, we can mock them here as well
  headers.set('X-User-Id', '1');
  headers.set('X-User-Role', 'TeamLead');

  const config: RequestInit = {
    ...options,
    headers,
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

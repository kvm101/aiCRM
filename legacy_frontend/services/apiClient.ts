import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useProjectStore } from '@/store/useProjectStore';

// In a real app this would come from process.env.NEXT_PUBLIC_API_URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to simulate passing current user id if needed (or token)
apiClient.interceptors.request.use((config) => {
  const state = useAuthStore.getState();
  if (state.currentUser) {
    config.headers['X-User-Id'] = state.currentUser.id;
    config.headers['X-User-Role'] = state.currentUser.role;
  }

  const projectState = useProjectStore.getState();
  if (projectState.activeProjectId) {
    config.headers['X-Project-Id'] = projectState.activeProjectId;
  } else {
    // Fallback: try cookie, then default to 1
    const cookieMatch = typeof document !== 'undefined' && document.cookie.match(/project_id=(\d+)/);
    config.headers['X-Project-Id'] = cookieMatch ? cookieMatch[1] : '1';
  }

  return config;
});

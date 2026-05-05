import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// In a real app this would come from process.env.NEXT_PUBLIC_API_URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

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
  return config;
});

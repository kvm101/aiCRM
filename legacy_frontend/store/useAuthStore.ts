import { create } from "zustand";
import { apiClient } from "@/services/apiClient";

export type Role = "ADMIN" | "MANAGER" | "ACCOUNT_MANAGER" | "MARKETING" | "SUPPORT" | "FINANCE" | "TeamLead" | "Sales";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isGmailConnected?: boolean;
}

interface AuthState {
  currentUser: User | null;
  isLoading: boolean;
  fetchCurrentUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isLoading: true,
  fetchCurrentUser: async () => {
    try {
      const response = await apiClient.get("/users/me", { withCredentials: true });
      set({ currentUser: response.data, isLoading: false });
    } catch (error) {
      set({ currentUser: null, isLoading: false });
    }
  },
  logout: async () => {
    try {
      await apiClient.post("/auth/logout", {}, { withCredentials: true });
      set({ currentUser: null });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed", error);
    }
  },
}));

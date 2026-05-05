import { create } from "zustand";

export type Role = "TeamLead" | "Sales";

interface User {
  id: string;
  name: string;
  role: Role;
}

interface AuthState {
  currentUser: User;
  switchUser: (role: Role) => void;
}

const USERS: Record<Role, User> = {
  TeamLead: { id: "1", name: "Team Lead (ID 1)", role: "TeamLead" },
  Sales: { id: "2", name: "Sales Rep (ID 2)", role: "Sales" },
};

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: USERS.TeamLead,
  switchUser: (role) => set({ currentUser: USERS[role] }),
}));

"use client";

import { useAuthStore } from "@/store/useAuthStore";

export function DashboardGreeting() {
  const { currentUser } = useAuthStore();

  if (!currentUser) return null;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Welcome back, {currentUser.name}
      </h1>
      <p className="text-zinc-500 dark:text-zinc-400 mt-2">
        Here's what's happening with your CRM today.
      </p>
    </div>
  );
}

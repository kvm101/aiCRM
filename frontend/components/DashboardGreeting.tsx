"use client";

import { useAuthStore } from "@/store/useAuthStore";

export function DashboardGreeting() {
  const { currentUser } = useAuthStore();

  if (!currentUser) return null;

  const hour = new Date().getHours();
  let greeting = "Добрий день";
  if (hour < 6) greeting = "Доброї ночі";
  else if (hour < 12) greeting = "Доброго ранку";
  else if (hour >= 18) greeting = "Добрий вечір";

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {greeting}, {currentUser.name} 👋
      </h1>
      <p className="text-zinc-500 dark:text-zinc-400 mt-2">
        Ось що відбувається у вашій CRM сьогодні.
      </p>
    </div>
  );
}

"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { usePathname } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading } = useAuthStore();
  const pathname = usePathname();

  // Не блокуємо сторінку логіну
  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-sm text-zinc-500">Перевірка авторизації...</p>
        </div>
      </div>
    );
  }

  // Якщо користувач не знайдений, сторінка буде порожньою, а Header зробить редірект
  if (!currentUser) {
    return null;
  }

  return <>{children}</>;
}

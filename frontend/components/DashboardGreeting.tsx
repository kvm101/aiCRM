"use client";

import { useLanguageStore } from "@/store/useLanguageStore";
import { t } from "@/lib/i18n";

export function DashboardGreeting() {
  const { lang } = useLanguageStore();
  const tr = t(lang);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {tr.greeting.title}
      </h1>
      <p className="text-zinc-500 dark:text-zinc-400 mt-2">
        {tr.greeting.subtitle}
      </p>
    </div>
  );
}

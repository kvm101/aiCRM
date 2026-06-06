"use client";

import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { useLanguageStore } from "@/store/useLanguageStore";
import { t } from "@/lib/i18n";

export default function KanbanPage() {
  const { lang } = useLanguageStore();
  const tr = t(lang);

  return (
    <div className="space-y-6 max-w-6xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
      <div className="shrink-0">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {tr.kanbanPage.title}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {tr.kanbanPage.subtitle}
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <KanbanBoard />
      </div>
    </div>
  );
}

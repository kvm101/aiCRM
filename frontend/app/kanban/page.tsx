"use client";

import { KanbanBoard } from "@/components/kanban/KanbanBoard";

export default function KanbanPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Sales Kanban</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Перетягуйте завдання між колонками.</p>
      </div>

      <KanbanBoard />
    </div>
  );
}

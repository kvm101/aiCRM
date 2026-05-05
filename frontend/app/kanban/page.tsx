"use client";

import { KanbanBoard } from "@/components/kanban/KanbanBoard";

export default function KanbanPage() {
  return (
    <div className="flex flex-col h-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Sales Kanban</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Drag and drop deals across stages.</p>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <KanbanBoard />
      </div>
    </div>
  );
}

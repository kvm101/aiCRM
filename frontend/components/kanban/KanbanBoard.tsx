"use client";

import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Loader2, Calendar, Plus } from "lucide-react";
import { useTasks, useUpdateTask, useCreateTask, Task } from "@/hooks/useSales";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const COLUMNS: Task['tag'][] = ["PLANNED", "IN_WORK", "DONE"];
const COLUMN_NAMES: Record<Task['tag'], string> = {
  PLANNED: "Заплановано",
  IN_WORK: "У роботі",
  DONE: "Виконано",
};

export function KanbanBoard() {
  const { data: serverTasks = [], isLoading } = useTasks();
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: createTask } = useCreateTask();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    description: "",
    deadline: new Date().toISOString(),
    tag: "PLANNED",
  });

  useEffect(() => {
    setTasks(serverTasks);
  }, [serverTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeIdStr);
    if (!activeTask) return;

    let targetTag: Task['tag'] | null = null;

    if (COLUMNS.includes(overIdStr as Task['tag'])) {
      if (activeTask.tag !== overIdStr) {
        targetTag = overIdStr as Task['tag'];
      }
    } else {
      const overTask = tasks.find((t) => t.id === overIdStr);
      if (overTask && activeTask.tag !== overTask.tag) {
        targetTag = overTask.tag;
      }
    }

    if (targetTag) {
      // Optimistic update
      setTasks(tasks.map(t => t.id === activeIdStr ? { ...t, tag: targetTag as Task['tag'] } : t));
      updateTask({ id: activeIdStr, tag: targetTag });
    }
  };

  const handleCreateTask = () => {
    createTask(newTask as any, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        setNewTask({ title: "", description: "", deadline: new Date().toISOString(), tag: "PLANNED" });
      },
    });
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" /> Додати завдання
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Нове завдання</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                placeholder="Назва"
                value={newTask.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTask({ ...newTask, title: e.target.value })}
              />
              <Textarea
                placeholder="Опис"
                value={newTask.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewTask({ ...newTask, description: e.target.value })}
              />
              <Input
                type="datetime-local"
                value={newTask.deadline?.slice(0, 16)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTask({ ...newTask, deadline: new Date(e.target.value).toISOString() })}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleCreateTask}>Створити</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex h-full w-full gap-4 overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {COLUMNS.map((columnId) => (
            <Column
              key={columnId}
              columnId={columnId}
              tasks={tasks.filter((t) => t.tag === columnId)}
            />
          ))}
          <DragOverlay>
            {activeTask ? (
              <div className="opacity-80 w-80">
                <TaskCard task={activeTask} isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

function Column({ columnId, tasks }: { columnId: Task['tag']; tasks: Task[] }) {
  const { setNodeRef } = useDroppable({
    id: columnId,
  });

  return (
    <div className="flex flex-col flex-shrink-0 w-80 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex justify-between items-center mb-6 px-1">
        <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">
          {COLUMN_NAMES[columnId]}
        </h3>
        <Badge variant="secondary" className="bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
          {tasks.length}
        </Badge>
      </div>

      <div ref={setNodeRef} className="flex-1 min-h-[500px] space-y-3">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} />
    </div>
  );
}

function TaskCard({ task, isOverlay = false }: { task: Task; isOverlay?: boolean }) {
  return (
    <Card className={`cursor-grab active:cursor-grabbing hover:border-indigo-500/50 transition-all ${isOverlay ? 'shadow-xl border-indigo-500' : ''}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm leading-tight">
            {task.title}
          </span>
          <GripVertical className="h-4 w-4 text-zinc-400 flex-shrink-0" />
        </div>
        
        {task.description && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 italic">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-medium">
          <Calendar className="h-3 w-3" />
          {new Date(task.deadline).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}

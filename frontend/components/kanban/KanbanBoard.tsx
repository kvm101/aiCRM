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
import { GripVertical, Loader2, Calendar, Plus, Pencil } from "lucide-react";
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
  const { data: serverTasks, isLoading } = useTasks();
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: createTask } = useCreateTask();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    description: "",
    deadline: new Date().toISOString(),
    tag: "PLANNED",
  });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (serverTasks) {
      setTasks(serverTasks);
    }
  }, [serverTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeIdNum = active.id as number;
    const overId = over.id;

    const activeTask = tasks.find((t) => t.id === activeIdNum);
    if (!activeTask) return;

    let targetTag: Task['tag'] | null = null;

    if (typeof overId === 'string' && COLUMNS.includes(overId as Task['tag'])) {
      if (activeTask.tag !== overId) {
        targetTag = overId as Task['tag'];
      }
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask && activeTask.tag !== overTask.tag) {
        targetTag = overTask.tag;
      }
    }

    if (targetTag) {
      // Optimistic update
      setTasks(tasks.map(t => t.id === activeIdNum ? { ...t, tag: targetTag as Task['tag'] } : t));
      updateTask({ id: activeIdNum, tag: targetTag });
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

  const handleEditTaskSave = () => {
    if (!editingTask) return;
    updateTask(editingTask, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setEditingTask(null);
      },
    });
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
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

        {/* Edit Task Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редагувати завдання</DialogTitle>
            </DialogHeader>
            {editingTask && (
              <div className="grid gap-4 py-4">
                <Input
                  placeholder="Назва"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                />
                <Textarea
                  placeholder="Опис"
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                />
                <Input
                  type="datetime-local"
                  value={editingTask.deadline?.slice(0, 16)}
                  onChange={(e) => setEditingTask({ ...editingTask, deadline: new Date(e.target.value).toISOString() })}
                />
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleEditTaskSave}>Зберегти</Button>
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
              onEditTask={openEditDialog}
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

function Column({ columnId, tasks, onEditTask }: { columnId: Task['tag']; tasks: Task[]; onEditTask: (t: Task) => void }) {
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
            <SortableTaskCard key={task.id} task={task} onEditTask={onEditTask} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function SortableTaskCard({ task, onEditTask }: { task: Task; onEditTask: (t: Task) => void }) {
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
      <TaskCard task={task} onEditTask={onEditTask} />
    </div>
  );
}

function TaskCard({ task, isOverlay = false, onEditTask }: { task: Task; isOverlay?: boolean; onEditTask?: (t: Task) => void }) {
  return (
    <Card className={`cursor-grab active:cursor-grabbing hover:border-indigo-500/50 transition-all ${isOverlay ? 'shadow-xl border-indigo-500' : ''}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm leading-tight">
            {task.title}
          </span>
          <div className="flex items-center gap-1">
            {onEditTask && (
              <button 
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-indigo-500 transition-colors"
                onPointerDown={(e) => {
                  e.stopPropagation(); // Запобігаємо DND
                  onEditTask(task);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            <GripVertical className="h-4 w-4 text-zinc-400 flex-shrink-0" />
          </div>
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

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
import { GripVertical, Loader2, Calendar, Plus, Pencil, CheckCircle2, User, Paperclip, Download, Trash2 } from "lucide-react";
import { useTasks, useUpdateTask, useCreateTask, Task, useDeals, useClients, useUploadAttachment, useAttachments, useDeleteAttachment, FileAttachment } from "@/hooks/useSales";
import { useProjectStore } from "@/store/useProjectStore";
import { DeleteAttachmentDialog } from "@/components/attachments/DeleteAttachmentDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLUMNS: Task['tag'][] = ["PLANNED", "IN_WORK", "DONE"];
const COLUMN_NAMES: Record<Task['tag'], string> = {
  PLANNED: "Заплановано",
  IN_WORK: "У роботі",
  DONE: "Виконано",
};

export function KanbanBoard() {
  const { data: serverTasks, isLoading } = useTasks();
  const { data: attachments = [] } = useAttachments();
  const { data: deals = [] } = useDeals();
  const { data: clients = [] } = useClients();
  
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: createTask } = useCreateTask();
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [attachmentToDelete, setAttachmentToDelete] = useState<FileAttachment | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    description: "",
    deadline: new Date().toISOString(),
    tag: "PLANNED",
    dealId: undefined,
    clientId: undefined,
  });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const [taskToComplete, setTaskToComplete] = useState<{ id: number; tag: Task['tag'] } | null>(null);
  const [taskResult, setTaskResult] = useState("");
  const [uploadingTaskId, setUploadingTaskId] = useState<number | null>(null);
  const [createFollowup, setCreateFollowup] = useState(false);
  const [followupTitle, setFollowupTitle] = useState("");
  const [followupDays, setFollowupDays] = useState("1");

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
      if (targetTag === "DONE" && activeTask.tag !== "DONE") {
        // Замість миттєвого оновлення, відкриваємо модалку для введення результату
        setTaskToComplete({ id: activeIdNum, tag: targetTag });
      } else {
        // Optimistic update
        setTasks(tasks.map(t => t.id === activeIdNum ? { ...t, tag: targetTag as Task['tag'] } : t));
        updateTask({ id: activeIdNum, tag: targetTag });
      }
    }
  };

  const handleCompleteTaskSave = () => {
    if (!taskToComplete) return;
    
    // Оновлюємо стейт оптимістично
    setTasks(tasks.map(t => t.id === taskToComplete.id ? { ...t, tag: taskToComplete.tag } : t));
    
    updateTask({ id: taskToComplete.id, tag: taskToComplete.tag, result: taskResult }, {
      onSuccess: () => {
        // Якщо потрібно створити наступне завдання
        if (createFollowup && followupTitle.trim()) {
          const originalTask = tasks.find(t => t.id === taskToComplete.id);
          const nextDeadline = new Date();
          nextDeadline.setDate(nextDeadline.getDate() + parseInt(followupDays));
          
          createTask({
            title: followupTitle,
            description: `Створено автоматично як продовження завдання "${originalTask?.title || ''}"`,
            tag: "PLANNED",
            deadline: nextDeadline.toISOString(),
            dealId: originalTask?.dealId,
            clientId: originalTask?.clientId,
          } as any);
        }
        
        setTaskToComplete(null);
        setTaskResult("");
        setCreateFollowup(false);
        setFollowupTitle("");
      }
    });
  };

  const handleCreateTask = () => {
    createTask(newTask as any, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        setNewTask({ title: "", description: "", deadline: new Date().toISOString(), tag: "PLANNED", dealId: undefined, clientId: undefined });
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

  const openViewDialog = (task: Task) => {
    setViewingTask(task);
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  const handleUploadToTask = (taskId: number, file: File | null) => {
    if (!file) return;
    setUploadingTaskId(taskId);
    uploadAttachment.mutate(
      { file, taskId },
      {
        onSettled: () => setUploadingTaskId(null),
      }
    );
  };

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex min-h-[240px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <DeleteAttachmentDialog
        attachment={attachmentToDelete}
        open={attachmentToDelete != null}
        onOpenChange={(o) => {
          if (!o) setAttachmentToDelete(null);
        }}
        onConfirm={() => {
          if (!attachmentToDelete) return;
          deleteAttachment.mutate(attachmentToDelete.id, {
            onSuccess: () => setAttachmentToDelete(null),
          });
        }}
        isPending={deleteAttachment.isPending}
      />
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
              <Select
                value={newTask.dealId ? String(newTask.dealId) : "none"}
                onValueChange={(v) => setNewTask({ ...newTask, dealId: v === "none" ? undefined : Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Прив'язати до Угоди (необов'язково)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без угоди</SelectItem>
                  {deals.map(d => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={newTask.clientId ? String(newTask.clientId) : "none"}
                onValueChange={(v) => setNewTask({ ...newTask, clientId: v === "none" ? undefined : Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Прив'язати до Контакту (необов'язково)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без контакту</SelectItem>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name} {c.company ? `(${c.company})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Select
                  value={editingTask.dealId ? String(editingTask.dealId) : "none"}
                  onValueChange={(v) => setEditingTask({ ...editingTask, dealId: v === "none" ? undefined : Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Прив'язати до Угоди (необов'язково)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без угоди</SelectItem>
                    {deals.map(d => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={editingTask.clientId ? String(editingTask.clientId) : "none"}
                  onValueChange={(v) => setEditingTask({ ...editingTask, clientId: v === "none" ? undefined : Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Прив'язати до Контакту (необов'язково)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без контакту</SelectItem>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name} {c.company ? `(${c.company})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleEditTaskSave}>Зберегти</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Task Dialog */}
        <Dialog open={!!viewingTask} onOpenChange={(open) => !open && setViewingTask(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-4">
                <span className="truncate">{viewingTask?.title || "Завдання"}</span>
                {viewingTask && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      openEditDialog(viewingTask);
                      setViewingTask(null);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Редагувати
                  </Button>
                )}
              </DialogTitle>
              {viewingTask?.description ? (
                <DialogDescription className="whitespace-pre-wrap break-words">
                  {viewingTask.description}
                </DialogDescription>
              ) : (
                <DialogDescription>Опис відсутній.</DialogDescription>
              )}
            </DialogHeader>

            {viewingTask && (
              <div className="grid gap-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    Статус: {viewingTask.tag}
                  </Badge>
                  {(viewingTask.dealTitle || viewingTask.dealId) && (
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                      Угода: {viewingTask.dealTitle || `#${viewingTask.dealId}`}
                    </Badge>
                  )}
                  {(viewingTask.clientName || viewingTask.clientId) && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      Клієнт: {viewingTask.clientName || `#${viewingTask.clientId}`}
                    </Badge>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
                    <div className="text-xs text-zinc-500 mb-1">Дедлайн</div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-zinc-400" />
                      {new Date(viewingTask.dueDate || viewingTask.deadline).toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 sm:col-span-2">
                    <div className="text-xs text-zinc-500 mb-2">Вкладення</div>
                    {attachments.filter((a) => a.taskId === viewingTask.id).length === 0 ? (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        Немає файлів. Додайте через іконку скріпки на картці.
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {attachments
                          .filter((a) => a.taskId === viewingTask.id)
                          .map((f) => (
                            <li
                              key={f.id}
                              className="flex items-center justify-between gap-2 rounded-md bg-zinc-50 dark:bg-zinc-900/50 px-2 py-1.5 text-xs"
                            >
                              <span className="truncate text-zinc-800 dark:text-zinc-200">{f.originalFilename}</span>
                              <div className="flex shrink-0 items-center gap-0.5">
                                <button
                                  type="button"
                                  className="opacity-50 hover:opacity-100 p-1 rounded text-red-600 hover:text-red-700"
                                  title="Видалити"
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={() => setAttachmentToDelete(f)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  className="opacity-50 hover:opacity-100 p-1 rounded"
                                  title="Скачати"
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={() => {
                                    const pid = useProjectStore.getState().activeProjectId;
                                    const q = pid != null ? `?projectId=${pid}` : "";
                                    window.open(`/api/files/${f.id}/download${q}`, "_blank", "noopener,noreferrer");
                                  }}
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                </div>

                {viewingTask.result && (
                  <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-3">
                    <div className="text-xs text-emerald-700 dark:text-emerald-300 mb-1">Результат</div>
                    <div className="text-sm text-emerald-800 dark:text-emerald-200 whitespace-pre-wrap">
                      {viewingTask.result}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Complete Task Modal */}
        <Dialog open={!!taskToComplete} onOpenChange={(open) => !open && setTaskToComplete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Завершення завдання</DialogTitle>
              <DialogDescription>
                Опишіть результат виконання цього завдання (наприклад, "Клієнт погодився на зустріч").
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <Textarea
                placeholder="Результат завдання..."
                value={taskResult}
                onChange={(e) => setTaskResult(e.target.value)}
                className="min-h-[100px]"
              />
              
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-3">
                  <input 
                    type="checkbox" 
                    id="followup" 
                    checked={createFollowup} 
                    onChange={(e) => setCreateFollowup(e.target.checked)}
                    className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="followup" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Створити наступне завдання
                  </label>
                </div>
                
                {createFollowup && (
                  <div className="grid gap-3 pl-6 border-l-2 border-indigo-100 dark:border-indigo-900 ml-1">
                    <Input 
                      placeholder="Що потрібно зробити?" 
                      value={followupTitle}
                      onChange={(e) => setFollowupTitle(e.target.value)}
                    />
                    <Select value={followupDays} onValueChange={setFollowupDays}>
                      <SelectTrigger>
                        <SelectValue placeholder="Коли?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">На завтра</SelectItem>
                        <SelectItem value="3">Через 3 дні</SelectItem>
                        <SelectItem value="7">Через тиждень</SelectItem>
                        <SelectItem value="14">Через 2 тижні</SelectItem>
                        <SelectItem value="30">Через місяць</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTaskToComplete(null)}>Скасувати</Button>
              <Button onClick={handleCompleteTaskSave}>Зберегти результат</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex w-full gap-4 overflow-x-auto pb-4 items-start">
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
              attachments={attachments}
              onEditTask={openEditDialog}
              onViewTask={openViewDialog}
              onAttachFile={handleUploadToTask}
              onRequestDeleteAttachment={setAttachmentToDelete}
              uploadingTaskId={uploadingTaskId}
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

function Column({
  columnId,
  tasks,
  attachments,
  onEditTask,
  onViewTask,
  onAttachFile,
  onRequestDeleteAttachment,
  uploadingTaskId
}: {
  columnId: Task['tag'];
  tasks: Task[];
  attachments: FileAttachment[];
  onEditTask: (t: Task) => void;
  onViewTask: (t: Task) => void;
  onAttachFile: (taskId: number, file: File | null) => void;
  onRequestDeleteAttachment: (f: FileAttachment) => void;
  uploadingTaskId: number | null;
}) {
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

      <div ref={setNodeRef} className="flex flex-col gap-3 min-h-[80px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              taskFiles={attachments.filter((a) => a.taskId === task.id)}
              onEditTask={onEditTask}
              onViewTask={onViewTask}
              onAttachFile={onAttachFile}
              onRequestDeleteAttachment={onRequestDeleteAttachment}
              uploadingTaskId={uploadingTaskId}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function SortableTaskCard({
  task,
  taskFiles,
  onEditTask,
  onViewTask,
  onAttachFile,
  onRequestDeleteAttachment,
  uploadingTaskId
}: {
  task: Task;
  taskFiles: FileAttachment[];
  onEditTask: (t: Task) => void;
  onViewTask: (t: Task) => void;
  onAttachFile: (taskId: number, file: File | null) => void;
  onRequestDeleteAttachment: (f: FileAttachment) => void;
  uploadingTaskId: number | null;
}) {
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
      <TaskCard
        task={task}
        taskFiles={taskFiles}
        onEditTask={onEditTask}
        onViewTask={onViewTask}
        onAttachFile={onAttachFile}
        onRequestDeleteAttachment={onRequestDeleteAttachment}
        uploadingTaskId={uploadingTaskId}
      />
    </div>
  );
}

function TaskCard({
  task,
  taskFiles = [],
  isOverlay = false,
  onEditTask,
  onViewTask,
  onAttachFile,
  onRequestDeleteAttachment,
  uploadingTaskId
}: {
  task: Task;
  taskFiles?: FileAttachment[];
  isOverlay?: boolean;
  onEditTask?: (t: Task) => void;
  onViewTask?: (t: Task) => void;
  onAttachFile?: (taskId: number, file: File | null) => void;
  onRequestDeleteAttachment?: (f: FileAttachment) => void;
  uploadingTaskId?: number | null;
}) {
  return (
    <Card
      className={`cursor-grab active:cursor-grabbing hover:border-indigo-500/50 transition-all ${isOverlay ? 'shadow-xl border-indigo-500' : ''}`}
      onClick={() => {
        if (!isOverlay && onViewTask) {
          onViewTask(task);
        }
      }}
    >
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
            {onAttachFile && (
              <label
                title="Прикріпити файл"
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-indigo-500 transition-colors cursor-pointer"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Paperclip className="h-3.5 w-3.5" />
                <input
                  type="file"
                  className="hidden"
                  disabled={uploadingTaskId === task.id}
                  onChange={(e) => {
                    const selected = e.target.files?.[0] ?? null;
                    onAttachFile(task.id, selected);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            )}
            <GripVertical className="h-4 w-4 text-zinc-400 flex-shrink-0" />
          </div>
        </div>
        
        {task.description && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 italic">
            {task.description}
          </p>
        )}

        <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          {task.dealTitle && (
            <div className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded w-fit">
              Угода: {task.dealTitle}
            </div>
          )}
          {task.clientName && (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded w-fit">
              <User className="h-3 w-3" /> {task.clientName}
            </div>
          )}
          <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-medium">
            <Calendar className="h-3 w-3" />
            {new Date(task.dueDate || task.deadline).toLocaleDateString()}
          </div>
          {task.result && (
            <div className="flex items-start gap-1 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-1.5 rounded">
              <CheckCircle2 className="h-3 w-3 flex-shrink-0 mt-0.5" />
              <span>{task.result}</span>
            </div>
          )}
          {uploadingTaskId === task.id && (
            <div className="text-[10px] text-zinc-400">Завантаження файлу...</div>
          )}
          {taskFiles.length > 0 && (
            <div className="mt-1 space-y-1">
              {taskFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-2 rounded bg-zinc-100/80 dark:bg-zinc-800/60 px-2 py-1 text-[10px] text-zinc-600 dark:text-zinc-300"
                >
                  <span className="truncate flex items-center gap-1 min-w-0">
                    <Paperclip className="h-3 w-3 shrink-0 opacity-70" />
                    {f.originalFilename}
                  </span>
                  <div className="flex shrink-0 items-center gap-0.5">
                    {onRequestDeleteAttachment && (
                      <button
                        type="button"
                        className="opacity-45 hover:opacity-100 p-0.5 text-red-600 hover:text-red-700"
                        title="Видалити"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestDeleteAttachment(f);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      className="opacity-45 hover:opacity-100 p-0.5"
                      title="Скачати"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        const pid = useProjectStore.getState().activeProjectId;
                        const q = pid != null ? `?projectId=${pid}` : "";
                        window.open(`/api/files/${f.id}/download${q}`, "_blank", "noopener,noreferrer");
                      }}
                    >
                      <Download className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

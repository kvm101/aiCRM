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
import { TaskStatusBadge } from "@/components/ui/status-badge";
import { GripVertical, Loader2, Calendar, Plus, Pencil, CheckCircle2, User, Paperclip, Download, Trash2 } from "lucide-react";
import { useTasks, useUpdateTask, useCreateTask, Task, useDeals, useClients, useUploadAttachment, useAttachments, useDeleteAttachment, FileAttachment } from "@/hooks/useSales";
import { useProjectStore } from "@/store/useProjectStore";
import { DeleteAttachmentDialog } from "@/components/attachments/DeleteAttachmentDialog";
import { Button } from "@/components/ui/button";
import { useLanguageStore } from "@/store/useLanguageStore";
import { t } from "@/lib/i18n";
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

export function KanbanBoard() {
  const { lang } = useLanguageStore();
  const tr = t(lang);

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
        setTaskToComplete({ id: activeIdNum, tag: targetTag });
      } else {
        setTasks(tasks.map(t => t.id === activeIdNum ? { ...t, tag: targetTag as Task['tag'] } : t));
        updateTask({ id: activeIdNum, tag: targetTag });
      }
    }
  };

  const handleCompleteTaskSave = () => {
    if (!taskToComplete) return;
    
    setTasks(tasks.map(t => t.id === taskToComplete.id ? { ...t, tag: taskToComplete.tag } : t));
    
    updateTask({ id: taskToComplete.id, tag: taskToComplete.tag, result: taskResult }, {
      onSuccess: () => {
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
    <div className="flex flex-col space-y-4 h-full">
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
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" /> {tr.kanbanPage.addTask}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{lang === 'ua' ? 'Нова задача' : 'New Task'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                placeholder={lang === 'ua' ? 'Назва' : 'Title'}
                value={newTask.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTask({ ...newTask, title: e.target.value })}
              />
              <Textarea
                placeholder={lang === 'ua' ? 'Опис' : 'Description'}
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
                  <SelectValue placeholder={lang === 'ua' ? "Прив'язати до угоди (необов'язково)" : "Link to Deal (optional)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{lang === 'ua' ? 'Без угоди' : 'No deal'}</SelectItem>
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
                  <SelectValue placeholder={lang === 'ua' ? "Прив'язати до контакту (необов'язково)" : "Link to Contact (optional)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{lang === 'ua' ? 'Без контакту' : 'No contact'}</SelectItem>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name} {c.company ? `(${c.company})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateTask}>{lang === 'ua' ? 'Створити' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{lang === 'ua' ? 'Редагувати задачу' : 'Edit Task'}</DialogTitle>
            </DialogHeader>
            {editingTask && (
              <div className="grid gap-4 py-4">
                <Input
                  placeholder={lang === 'ua' ? 'Назва' : 'Title'}
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                />
                <Textarea
                  placeholder={lang === 'ua' ? 'Опис' : 'Description'}
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
                    <SelectValue placeholder={lang === 'ua' ? "Прив'язати до угоди (необов'язково)" : "Link to Deal (optional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{lang === 'ua' ? 'Без угоди' : 'No deal'}</SelectItem>
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
                    <SelectValue placeholder={lang === 'ua' ? "Прив'язати до контакту (необов'язково)" : "Link to Contact (optional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{lang === 'ua' ? 'Без контакту' : 'No contact'}</SelectItem>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name} {c.company ? `(${c.company})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleEditTaskSave}>{lang === 'ua' ? 'Зберегти' : 'Save'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!viewingTask} onOpenChange={(open) => !open && setViewingTask(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-4">
                <span className="truncate">{viewingTask?.title || (lang === 'ua' ? 'Задача' : 'Task')}</span>
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
                    {lang === 'ua' ? 'Редагувати' : 'Edit'}
                  </Button>
                )}
              </DialogTitle>
              {viewingTask?.description ? (
                <DialogDescription className="whitespace-pre-wrap break-words">
                  {viewingTask.description}
                </DialogDescription>
              ) : (
                <DialogDescription>{lang === 'ua' ? 'Опис відсутній.' : 'No description.'}</DialogDescription>
              )}
            </DialogHeader>

            {viewingTask && (
              <div className="grid gap-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <TaskStatusBadge
                    status={viewingTask.tag}
                    label={tr.taskStatus[viewingTask.tag as keyof typeof tr.taskStatus] || viewingTask.tag}
                  />
                  {(viewingTask.dealTitle || viewingTask.dealId) && (
                    <Badge variant="outline" className="border-2 font-semibold">
                      {lang === 'ua' ? 'Угода' : 'Deal'}: {viewingTask.dealTitle || `#${viewingTask.dealId}`}
                    </Badge>
                  )}
                  {(viewingTask.clientName || viewingTask.clientId) && (
                    <Badge variant="outline" className="border-2 font-semibold">
                      {lang === 'ua' ? 'Клієнт' : 'Client'}: {viewingTask.clientName || `#${viewingTask.clientId}`}
                    </Badge>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
                    <div className="text-xs text-zinc-500 mb-1">{lang === 'ua' ? 'Дедлайн' : 'Deadline'}</div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-zinc-400" />
                      {new Date(viewingTask.dueDate || viewingTask.deadline).toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 sm:col-span-2">
                    <div className="text-xs text-zinc-500 mb-2">{lang === 'ua' ? 'Вкладення' : 'Attachments'}</div>
                    {attachments.filter((a) => a.taskId === viewingTask.id).length === 0 ? (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        {lang === 'ua' ? 'Немає файлів. Додайте через іконку скріпки на картці.' : 'No files. Add via paperclip icon on the card.'}
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
                                  className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-md text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  title={lang === 'ua' ? 'Видалити' : 'Delete'}
                                  aria-label={lang === 'ua' ? 'Видалити файл' : 'Delete file'}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={() => setAttachmentToDelete(f)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                  title={lang === 'ua' ? 'Завантажити' : 'Download'}
                                  aria-label={lang === 'ua' ? 'Завантажити файл' : 'Download file'}
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
                    <div className="text-xs text-emerald-700 dark:text-emerald-300 mb-1">{lang === 'ua' ? 'Результат виконання' : 'Result'}</div>
                    <div className="text-sm text-emerald-800 dark:text-emerald-200 whitespace-pre-wrap">
                      {viewingTask.result}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!taskToComplete} onOpenChange={(open) => !open && setTaskToComplete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{lang === 'ua' ? 'Завершення завдання' : 'Task Completion'}</DialogTitle>
              <DialogDescription>
                {lang === 'ua' ? 'Опишіть результат виконання цього завдання.' : 'Describe the result of this task.'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <Textarea
                placeholder={lang === 'ua' ? 'Результат завдання...' : 'Result...'}
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
                    className="rounded border-zinc-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="followup" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {lang === 'ua' ? 'Створити наступне завдання' : 'Create follow-up task'}
                  </label>
                </div>
                
                {createFollowup && (
                  <div className="grid gap-3 pl-6 border-l-2 border-primary/30 ml-1">
                    <Input 
                      placeholder={lang === 'ua' ? 'Що потрібно зробити?' : 'What needs to be done?'} 
                      value={followupTitle}
                      onChange={(e) => setFollowupTitle(e.target.value)}
                    />
                    <Select value={followupDays} onValueChange={setFollowupDays}>
                      <SelectTrigger>
                        <SelectValue placeholder={lang === 'ua' ? "Коли?" : "When?"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">{lang === 'ua' ? 'На завтра' : 'Tomorrow'}</SelectItem>
                        <SelectItem value="3">{lang === 'ua' ? 'Через 3 дні' : 'In 3 days'}</SelectItem>
                        <SelectItem value="7">{lang === 'ua' ? 'Через тиждень' : 'In a week'}</SelectItem>
                        <SelectItem value="14">{lang === 'ua' ? 'Через 2 тижні' : 'In 2 weeks'}</SelectItem>
                        <SelectItem value="30">{lang === 'ua' ? 'Через місяць' : 'In a month'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTaskToComplete(null)}>{lang === 'ua' ? 'Скасувати' : 'Cancel'}</Button>
              <Button onClick={handleCompleteTaskSave}>{lang === 'ua' ? 'Зберегти результат' : 'Save result'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 flex w-full gap-4 overflow-x-auto pb-4 items-start min-h-0">
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
  const { lang } = useLanguageStore();
  const tr = t(lang);

  return (
    <div className="flex flex-col flex-shrink-0 w-80 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 max-h-full">
      <div className="flex justify-between items-center mb-6 px-1 gap-2">
        <TaskStatusBadge
          status={columnId}
          label={tr.taskStatus[columnId]}
          variant="chip"
        />
        <Badge variant="outline" className="border-2 font-data tabular-nums" aria-label={`${tasks.length} ${lang === 'ua' ? 'задач' : 'tasks'}`}>
          {tasks.length}
        </Badge>
      </div>

      <div ref={setNodeRef} className="flex-1 flex flex-col gap-3 min-h-[80px] overflow-y-auto pr-1">
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
  const { lang } = useLanguageStore();

  return (
    <Card
      className={`cursor-grab active:cursor-grabbing hover:border-primary/50 transition-all ${isOverlay ? 'shadow-xl border-primary' : ''}`}
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
                className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-primary dark:hover:bg-zinc-800 transition-colors"
                aria-label={lang === 'ua' ? 'Редагувати' : 'Edit'}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onEditTask(task);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {onAttachFile && (
              <label
                title={lang === 'ua' ? 'Прикріпити файл' : 'Attach file'}
                className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-primary dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label={lang === 'ua' ? 'Прикріпити файл' : 'Attach file'}
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
          <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          {task.dealTitle && (
            <div className="text-[11px] font-semibold text-foreground border-2 border-border px-2 py-0.5 rounded w-fit">
              {lang === 'ua' ? 'Угода' : 'Deal'}: {task.dealTitle}
            </div>
          )}
          {task.clientName && (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground border-2 border-border px-2 py-0.5 rounded w-fit">
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
            <div className="text-[10px] text-zinc-400">{lang === 'ua' ? 'Завантаження файлу...' : 'Uploading file...'}</div>
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
                        className="inline-flex min-h-7 min-w-7 items-center justify-center text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
                        title={lang === 'ua' ? 'Видалити' : 'Delete'}
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
                      className="inline-flex min-h-7 min-w-7 items-center justify-center rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      title={lang === 'ua' ? 'Завантажити' : 'Download'}
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

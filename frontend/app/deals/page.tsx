"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Trash2, Pencil, FolderOpen, MessageSquare, Send, User, Bot, History, Clock, CheckCircle2, Paperclip, X, Download } from "lucide-react";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  useDeals, useCreateDeal, useUpdateDeal, useDeleteDeal, useUpdateDealStatus,
  Deal, useClients, useDealEvents, useCreateDealNote, useCreateTask,
  useUploadAttachment, useAttachments, useDeleteAttachment, type FileAttachment,
} from "@/hooks/useSales";
import { useProjectStore } from "@/store/useProjectStore";
import { DeleteAttachmentDialog } from "@/components/attachments/DeleteAttachmentDialog";
import { useLanguageStore } from "@/store/useLanguageStore";
import { t, formatDealEventDescription, getEventTypeLabel } from "@/lib/i18n";
import { DealStatusBadge } from "@/components/ui/status-badge";

const DEAL_STATUS_KEYS = ["NEW", "QUALIFICATION", "DELIVERY", "DONE", "LOST"] as const;

const CURRENCY_SYMBOLS: Record<string, string> = {
  UAH: "₴",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export default function DealsPage() {
  const { lang } = useLanguageStore();
  const tr = t(lang);

  const STATUS_MAP_I18N = tr.dealStatus;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const { data: deals = [], isLoading } = useDeals();
  const { data: clients = [] } = useClients();
  const createDeal = useCreateDeal();
  const updateDealStatus = useUpdateDealStatus();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({
    title: "",
    budget: 0,
    currency: "USD",
    clientId: 0,
  });

  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const handleAddDeal = () => {
    if (!newDeal.title || !newDeal.clientId) return;
    createDeal.mutate(newDeal, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        setNewDeal({ title: "", budget: 0, currency: "USD", clientId: 0 });
      },
    });
  };

  const filteredDeals = deals.filter((d) => {
    const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (selectedDeal) {
    return (
      <div className="h-[calc(100vh-7rem)] w-full max-w-6xl mx-auto">
        <DealDetailsPanel deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
      {/* Панель: Таблиця угод */}
      <div className="flex-1 flex flex-col space-y-4 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{tr.dealsPage.title}</h1>
              <Badge variant="secondary" className="text-sm rounded-full px-3 bg-primary text-primary-foreground">
                {tr.dealsPage.title}: {deals.length}
              </Badge>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{tr.dealsPage.subtitle}</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder={tr.dealsPage.searchPlaceholder}
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> {tr.dealsPage.addDeal}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{tr.dealsPage.addDeal}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Input
                    placeholder="Назва угоди"
                    value={newDeal.title}
                    onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Бюджет"
                      value={newDeal.budget || ""}
                      onChange={(e) => setNewDeal({ ...newDeal, budget: Number(e.target.value) })}
                      className="flex-1"
                    />
                    <Select
                      value={newDeal.currency}
                      onValueChange={(v) => setNewDeal({ ...newDeal, currency: v })}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UAH">UAH ₴</SelectItem>
                        <SelectItem value="USD">USD $</SelectItem>
                        <SelectItem value="EUR">EUR €</SelectItem>
                        <SelectItem value="GBP">GBP £</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Select
                    value={newDeal.clientId ? String(newDeal.clientId) : ""}
                    onValueChange={(v) => setNewDeal({ ...newDeal, clientId: Number(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть клієнта" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name} ({c.company})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddDeal} disabled={createDeal.isPending}>
                    {createDeal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : tr.dealsPage.save}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {(["ALL", "NEW", "QUALIFICATION", "DELIVERY", "DONE", "LOST"] as const).map((status) => {
            const label = status === "ALL"
              ? (lang === "ua" ? "Всі" : "All")
              : (tr.dealStatus[status as keyof typeof tr.dealStatus] || status);
            const colors: Record<string, string> = {
              ALL: "bg-muted text-foreground border-2 border-border hover:bg-muted/80",
              NEW: "bg-primary/10 text-foreground border-2 border-primary hover:bg-primary/15 dark:bg-primary/20",
              QUALIFICATION: "bg-sky-50 text-sky-950 border-2 border-sky-600 dark:bg-sky-950 dark:text-sky-100 dark:border-sky-400 hover:bg-sky-100",
              DELIVERY: "bg-amber-50 text-amber-950 border-2 border-amber-600 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-400 hover:bg-amber-100",
              DONE: "bg-emerald-50 text-emerald-950 border-2 border-emerald-600 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-400 hover:bg-emerald-100",
              LOST: "bg-rose-50 text-rose-950 border-2 border-rose-600 dark:bg-rose-950 dark:text-rose-100 dark:border-rose-400 hover:bg-rose-100",
            };
            const activeColors: Record<string, string> = {
              ALL: "bg-zinc-800 text-white border-2 border-zinc-900 dark:bg-zinc-200 dark:text-zinc-900",
              NEW: "bg-primary text-primary-foreground border-2 border-primary",
              QUALIFICATION: "bg-sky-600 text-white border-2 border-sky-700",
              DELIVERY: "bg-amber-600 text-white border-2 border-amber-700",
              DONE: "bg-emerald-600 text-white border-2 border-emerald-700",
              LOST: "bg-rose-600 text-white border-2 border-rose-700",
            };
            const count = status === "ALL" ? deals.length : deals.filter(d => d.status === status).length;
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${isActive ? activeColors[status] : colors[status]
                  }`}
              >
                {label}
                <span className={`inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-black/8 dark:bg-white/10"
                  }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm min-h-0">
          <div className="overflow-auto h-full">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tr.dealsPage.colTitle}</TableHead>
                    <TableHead>{tr.dealsPage.colClient}</TableHead>
                    <TableHead>{tr.dealsPage.colStatus}</TableHead>
                    <TableHead className="text-right">{tr.dealsPage.colBudget}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeals.map((deal) => (
                    <TableRow
                      key={deal.id}
                      className={`cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 ${(selectedDeal as any)?.id === deal.id ? 'bg-accent' : ''}`}
                      onClick={() => setSelectedDeal(deal)}
                    >
                      <TableCell className="font-medium">{deal.title}</TableCell>
                      <TableCell>{deal.clientName}</TableCell>
                      <TableCell>
                        <Select
                          value={deal.status}
                          onValueChange={(v) => {
                            updateDealStatus.mutate({ id: deal.id, status: v });
                            if ((selectedDeal as any)?.id === deal.id) setSelectedDeal({ ...deal, status: v as any });
                          }}
                        >
                          <SelectTrigger className="h-8 w-[130px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DEAL_STATUS_KEYS.map((key) => (
                              <SelectItem key={key} value={key}>
                                {STATUS_MAP_I18N[key as keyof typeof STATUS_MAP_I18N] || key}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right font-semibold font-data" data-numeric="true">
                        {CURRENCY_SYMBOLS[deal.currency] || "$"}{deal.budget.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredDeals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-zinc-500">
                        {tr.dealsPage.notFound}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DealDetailsPanel({ deal, onClose }: { deal: Deal, onClose: () => void }) {
  const { data: events = [] } = useDealEvents(deal.id);
  const { data: attachments = [] } = useAttachments();
  const createNote = useCreateDealNote();
  const createTask = useCreateTask();
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();

  const [attachmentToDelete, setAttachmentToDelete] = useState<FileAttachment | null>(null);

  const { lang } = useLanguageStore();
  const tr = t(lang);
  const [activeView, setActiveView] = useState<"info" | "feed">("info");

  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState<"note" | "task">("note");
  const [taskDays, setTaskDays] = useState("1");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isSendingWithAttachment, setIsSendingWithAttachment] = useState(false);

  // Edit state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(deal.title);
  const [editBudget, setEditBudget] = useState(deal.budget);
  const [editCurrency, setEditCurrency] = useState(deal.currency || "USD");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (mode === "note") {
      setIsSendingWithAttachment(!!pendingFile);
      createNote.mutate(
        { dealId: deal.id, text: inputText },
        {
          onSuccess: (createdEvent) => {
            if (pendingFile && createdEvent?.id) {
              uploadAttachment.mutate(
                { file: pendingFile, dealEventId: createdEvent.id },
                {
                  onSettled: () => {
                    setPendingFile(null);
                    setIsSendingWithAttachment(false);
                  },
                }
              );
            } else {
              setIsSendingWithAttachment(false);
            }
          },
          onError: () => {
            setIsSendingWithAttachment(false);
          },
        }
      );
    } else {
      const nextDeadline = new Date();
      nextDeadline.setDate(nextDeadline.getDate() + parseInt(taskDays));
      createTask.mutate({
        title: inputText,
        description: "Швидке завдання зі стрічки угоди",
        tag: "PLANNED",
        deadline: nextDeadline.toISOString(),
        dealId: deal.id,
        clientId: deal.clientId,
      } as any);
    }
    setInputText("");
    setMode("note");
  };

  const handleSaveEdit = () => {
    updateDeal.mutate(
      { id: deal.id, title: editTitle, budget: editBudget, currency: editCurrency },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          // Оновлюємо локальний стан deal
          deal.title = editTitle;
          deal.budget = editBudget;
          deal.currency = editCurrency;
        },
      }
    );
  };

  const handleDelete = () => {
    if (!confirm("Ви впевнені, що хочете видалити цю угоду?")) return;
    deleteDeal.mutate(deal.id, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
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

      {/* Mobile view tabs switcher */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 md:hidden shrink-0 w-full bg-zinc-50 dark:bg-zinc-900/50">
        <button
          onClick={() => setActiveView("info")}
          className={cn("flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors", activeView === "info" ? "border-primary text-primary" : "border-transparent text-zinc-500")}
        >
          {lang === 'ua' ? 'Деталі' : 'Details'}
        </button>
        <button
          onClick={() => setActiveView("feed")}
          className={cn("flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors", activeView === "feed" ? "border-primary text-primary" : "border-transparent text-zinc-500")}
        >
          {lang === 'ua' ? 'Історія та нотатки' : 'History & Notes'}
        </button>
      </div>

      {/* Ліва колонка (1/3): Статична інформація */}
      <div className={cn("w-full md:w-1/3 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-6 overflow-y-auto bg-white dark:bg-zinc-950 shrink-0 h-full", activeView === "info" ? "flex" : "hidden md:flex")}>
        <div className="flex items-start justify-between">
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 px-2 -ml-2 text-zinc-500 hover:text-zinc-900">
            &larr; {tr.dealDetails.back}
          </Button>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon-sm" className="text-zinc-500 hover:text-primary" onClick={() => { setEditTitle(deal.title); setEditBudget(deal.budget); setEditCurrency(deal.currency || "USD"); setIsEditOpen(true); }}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-600" onClick={handleDelete} disabled={deleteDeal.isPending}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <DealStatusBadge
            status={deal.status}
            label={tr.dealStatus[deal.status as keyof typeof tr.dealStatus] || deal.status}
            className="mb-3"
          />
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1">{deal.title}</h2>
          <p className="text-sm text-zinc-500">{tr.dealDetails.createdAt}: {new Date(deal.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="space-y-4 mt-2">
          <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-900">
            <span className="text-sm text-zinc-500">{tr.dealDetails.budget}</span>
            <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-300 font-data" data-numeric="true">
              {CURRENCY_SYMBOLS[deal.currency] || "$"}{deal.budget.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-900">
            <span className="text-sm text-zinc-500">{tr.dealDetails.client}</span>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {deal.clientName?.charAt(0) || "C"}
              </div>
              <span className="text-sm font-medium">{deal.clientName}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-900">
            <span className="text-sm text-zinc-500">{tr.dealDetails.responsible}</span>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px]">ME</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{tr.dealDetails.you}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Права колонка (2/3): Історія та Чат */}
      <div className={cn("w-full md:w-2/3 flex flex-col h-full bg-zinc-50 dark:bg-zinc-900/20", activeView === "feed" ? "flex" : "hidden md:flex")}>

        {/* Хедер зони історії */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
            <History className="h-5 w-5 text-zinc-500" />
            {tr.dealDetails.historyTitle}
          </h3>
        </div>

        {/* Зона скролу подій */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {events.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-2">
              <MessageSquare className="h-8 w-8 opacity-20" />
              <p className="text-base">{tr.dealDetails.historyEmpty}</p>
            </div>
          ) : (
            events.map((event) => {
              const isNote = event.eventType === "NOTE";
              const timeString = new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dateString = new Date(event.createdAt).toLocaleDateString();

              if (!isNote) {
                // Системні події (компактні, по центру)
                let icon = <Clock className="h-4 w-4 mr-1.5 shrink-0" />;
                if (event.eventType === "TASK_COMPLETED") icon = <CheckCircle2 className="h-4 w-4 mr-1.5 shrink-0" />;
                if (event.eventType === "CREATED") icon = <Plus className="h-4 w-4 mr-1.5 shrink-0" />;

                const eventLabel = getEventTypeLabel(lang, event.eventType);
                const eventDescription = formatDealEventDescription(lang, event.eventType, event.description);

                return (
                  <div key={event.id} className="flex justify-center my-4 px-2">
                    <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 max-w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm leading-snug font-medium text-zinc-500 dark:text-zinc-400 shadow-sm">
                      <span className="inline-flex items-center shrink-0 text-zinc-700 dark:text-zinc-300">
                        {icon}
                        {eventLabel}
                      </span>
                      <span className="text-zinc-600 dark:text-zinc-300 text-center">{eventDescription}</span>
                      <span className="shrink-0 text-xs opacity-60">{timeString}</span>
                    </div>
                  </div>
                );
              }

              // Нотатки (Chat bubbles)
              const eventFiles = attachments.filter((a) => a.dealEventId === event.id);
              return (
                <div key={event.id} className="flex flex-col items-end mb-4">
                  <div className="max-w-[90%] sm:max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-5 py-3.5 shadow-sm">
                    <p className="text-base leading-relaxed whitespace-pre-wrap">{event.description}</p>
                    {eventFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {eventFiles.map((f) => (
                          <div
                            key={f.id}
                            className="flex items-center justify-between gap-3 rounded-lg bg-white/10 px-3 py-2.5 text-sm"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Paperclip className="h-4 w-4 opacity-90" />
                              <span className="truncate">{f.originalFilename}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="opacity-80">
                                {f.status === "INDEXED"
                                  ? tr.dealDetails.attachmentSaved
                                  : f.status === "FAILED"
                                    ? tr.dealDetails.attachmentFailed
                                    : tr.dealDetails.attachmentProcessing}
                              </span>
                              <button
                                type="button"
                                className="opacity-60 hover:opacity-100 transition-opacity text-white/90 hover:text-white"
                                onClick={() => setAttachmentToDelete(f)}
                                title={tr.dealDetails.deleteAttachment}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                className="opacity-60 hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  const pid = useProjectStore.getState().activeProjectId;
                                  const q = pid != null ? `?projectId=${pid}` : "";
                                  window.open(`/api/files/${f.id}/download${q}`, "_blank", "noopener,noreferrer");
                                }}
                                title={tr.dealDetails.downloadAttachment}
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 mr-1">
                    {tr.dealDetails.you} • {dateString} {timeString}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Форма вводу знизу */}
        <div className="mt-auto shrink-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-full p-1">
                <button
                  type="button"
                  onClick={() => setMode("note")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${mode === "note"
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    }`}
                >
                  Нотатка
                </button>
                <button
                  type="button"
                  onClick={() => setMode("task")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${mode === "task"
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    }`}
                >
                  Завдання
                </button>
              </div>

              {mode === "task" && (
                <Select value={taskDays} onValueChange={setTaskDays}>
                  <SelectTrigger className="h-10 w-[150px] text-sm border-zinc-200 dark:border-zinc-700 bg-transparent">
                    <SelectValue placeholder="Термін" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">На завтра</SelectItem>
                    <SelectItem value="3">Через 3 дні</SelectItem>
                    <SelectItem value="7">За тиждень</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex gap-3">
              <Input
                placeholder={mode === "note" ? "Додайте нотатку або лог розмови..." : "Опишіть завдання..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 h-12 text-base rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-indigo-500"
              />
              {mode === "note" && (
                <label className="h-11 px-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 inline-flex items-center justify-center text-zinc-600 hover:text-primary cursor-pointer">
                  <Paperclip className="h-4 w-4" />
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
              <Button
                type="submit"
                disabled={createNote.isPending || createTask.isPending || isSendingWithAttachment || !inputText.trim()}
                className={`h-12 px-6 text-base rounded-xl shrink-0 transition-all shadow-sm ${mode === "task"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : ""
                  }`}
              >
                {createNote.isPending || createTask.isPending || isSendingWithAttachment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {mode === "note" ? <Send className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    {mode === "note" ? "Надіслати" : "Створити"}
                  </>
                )}
              </Button>
            </div>
            {mode === "note" && pendingFile && (
              <div className="flex items-center justify-between rounded-lg border-2 border-primary/30 bg-accent dark:bg-accent/50 px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                <div className="flex items-center gap-2 truncate">
                  <Paperclip className="h-3.5 w-3.5 text-primary" />
                  <span className="truncate">{pendingFile.name}</span>
                </div>
                <button
                  type="button"
                  className="ml-3 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  onClick={() => setPendingFile(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </form>
        </div>

      </div>

      {/* Edit Deal Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Редагувати угоду</DialogTitle>
            <DialogDescription>Змініть деталі угоди та натисніть &quot;Зберегти&quot;.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Назва</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Назва угоди"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Бюджет</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={editBudget || ""}
                  onChange={(e) => setEditBudget(Number(e.target.value))}
                  className="flex-1"
                />
                <Select value={editCurrency} onValueChange={setEditCurrency}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UAH">UAH ₴</SelectItem>
                    <SelectItem value="USD">USD $</SelectItem>
                    <SelectItem value="EUR">EUR €</SelectItem>
                    <SelectItem value="GBP">GBP £</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Скасувати</Button>
            <Button onClick={handleSaveEdit} disabled={updateDeal.isPending || !editTitle.trim()}>
              {updateDeal.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Зберегти
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


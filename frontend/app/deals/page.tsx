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
import { Search, Plus, Trash2, Pencil, FolderOpen, MessageSquare, Send, User, Bot, History, Clock, CheckCircle2 } from "lucide-react";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useDeals, useCreateDeal, useUpdateDeal, useDeleteDeal, useUpdateDealStatus, Deal, useClients, useDealEvents, useCreateDealNote, useCreateTask } from "@/hooks/useSales";

const STATUS_MAP: Record<string, string> = {
  NEW: "Нові",
  QUALIFICATION: "Кваліфікація",
  DELIVERY: "Доставка",
  DONE: "Виконано",
  LOST: "Програно",
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  UAH: "₴",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export default function DealsPage() {
  const [searchTerm, setSearchTerm] = useState("");
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
    return d.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (selectedDeal) {
    return (
      <div className="h-[calc(100vh-4rem)] p-2 sm:p-6 w-full max-w-7xl mx-auto">
        <DealDetailsPanel deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Панель: Таблиця угод */}
      <div className="flex-1 flex flex-col space-y-4 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Угоди</h1>
              <Badge variant="secondary" className="text-sm rounded-full px-3 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                Всього: {deals.length}
              </Badge>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Керуйте угодами та продажами.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Пошук угод..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="mr-2 h-4 w-4" /> Додати
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Створити угоду</DialogTitle>
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
                    {createDeal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Створити"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex-1 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Назва</TableHead>
                  <TableHead>Контакт</TableHead>
                  <TableHead>Етап</TableHead>
                  <TableHead className="text-right">Бюджет</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeals.map((deal) => (
                  <TableRow 
                    key={deal.id} 
                    className={`cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 ${selectedDeal?.id === deal.id ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
                    onClick={() => setSelectedDeal(deal)}
                  >
                    <TableCell className="font-medium">{deal.title}</TableCell>
                    <TableCell>{deal.clientName}</TableCell>
                    <TableCell>
                      <Select 
                        value={deal.status} 
                        onValueChange={(v) => {
                          updateDealStatus.mutate({ id: deal.id, status: v });
                          if (selectedDeal?.id === deal.id) setSelectedDeal({...deal, status: v as any});
                        }}
                      >
                        <SelectTrigger className="h-8 w-[130px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_MAP).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {CURRENCY_SYMBOLS[deal.currency] || "$"}{deal.budget.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredDeals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-zinc-500">
                      Угод не знайдено
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}

function DealDetailsPanel({ deal, onClose }: { deal: Deal, onClose: () => void }) {
  const { data: events = [] } = useDealEvents(deal.id);
  const createNote = useCreateDealNote();
  const createTask = useCreateTask();
  
  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState<"note" | "task">("note");
  const [taskDays, setTaskDays] = useState("1");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (mode === "note") {
      createNote.mutate({ dealId: deal.id, text: inputText });
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

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      
      {/* Ліва колонка (1/3): Статична інформація */}
      <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-6 overflow-y-auto bg-white dark:bg-zinc-950 shrink-0">
        <div className="flex items-start justify-between">
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 px-2 -ml-2 text-zinc-500 hover:text-zinc-900">
            &larr; Назад
          </Button>
        </div>

        <div>
          <Badge variant="outline" className="mb-3 border-indigo-200 text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">
            {STATUS_MAP[deal.status] || deal.status}
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1">{deal.title}</h2>
          <p className="text-sm text-zinc-500">Створено: {new Date(deal.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="space-y-4 mt-2">
          <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-900">
            <span className="text-sm text-zinc-500">Бюджет</span>
            <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
              {CURRENCY_SYMBOLS[deal.currency] || "$"}{deal.budget.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-900">
            <span className="text-sm text-zinc-500">Клієнт</span>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {deal.clientName?.charAt(0) || "C"}
              </div>
              <span className="text-sm font-medium">{deal.clientName}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-900">
            <span className="text-sm text-zinc-500">Відповідальний</span>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px]">ME</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">Ви</span>
            </div>
          </div>
        </div>
      </div>

      {/* Права колонка (2/3): Історія та Чат */}
      <div className="w-full md:w-2/3 flex flex-col h-full bg-zinc-50 dark:bg-zinc-900/20">
        
        {/* Хедер зони історії */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
            <History className="h-4 w-4 text-zinc-500" />
            Історія подій та Нотатки
          </h3>
        </div>

        {/* Зона скролу подій */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {events.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-2">
              <MessageSquare className="h-8 w-8 opacity-20" />
              <p className="text-sm">Історія порожня. Додайте першу нотатку.</p>
            </div>
          ) : (
            events.map((event) => {
              const isNote = event.eventType === "NOTE";
              const timeString = new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dateString = new Date(event.createdAt).toLocaleDateString();

              if (!isNote) {
                // Системні події (компактні, по центру)
                let icon = <Clock className="h-3 w-3 mr-1" />;
                if (event.eventType === "TASK_COMPLETED") icon = <CheckCircle2 className="h-3 w-3 mr-1" />;
                if (event.eventType === "CREATED") icon = <Plus className="h-3 w-3 mr-1" />;

                return (
                  <div key={event.id} className="flex justify-center my-4">
                    <div className="inline-flex items-center px-3 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-[11px] font-medium text-zinc-500 dark:text-zinc-400 shadow-sm">
                      {icon}
                      <span className="mr-2 text-zinc-700 dark:text-zinc-300">{event.eventType}</span>
                      <span className="truncate max-w-[200px] sm:max-w-[300px]">{event.description}</span>
                      <span className="ml-2 opacity-50">{timeString}</span>
                    </div>
                  </div>
                );
              }

              // Нотатки (Chat bubbles)
              return (
                <div key={event.id} className="flex flex-col items-end mb-4">
                  <div className="max-w-[85%] sm:max-w-[75%] bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 mr-1">
                    Ви • {dateString} {timeString}
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
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    mode === "note" 
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  Нотатка
                </button>
                <button
                  type="button"
                  onClick={() => setMode("task")}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    mode === "task" 
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  Завдання
                </button>
              </div>

              {mode === "task" && (
                <Select value={taskDays} onValueChange={setTaskDays}>
                  <SelectTrigger className="h-8 w-[140px] text-xs border-zinc-200 dark:border-zinc-700 bg-transparent">
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
                className="flex-1 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-indigo-500"
              />
              <Button 
                type="submit" 
                disabled={createNote.isPending || createTask.isPending || !inputText.trim()}
                className={`h-11 px-6 rounded-xl shrink-0 transition-all shadow-sm ${
                  mode === "task" 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {createNote.isPending || createTask.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {mode === "note" ? <Send className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    {mode === "note" ? "Надіслати" : "Створити"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

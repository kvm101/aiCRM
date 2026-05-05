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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, MessageSquare, Trash2, UserPlus } from "lucide-react";

import { useClients, useCreateClient, useUpdateClient, useDeleteClient, Client } from "@/hooks/useSales";
import { Loader2 } from "lucide-react";

const STATUS_MAP = {
  NEW: "Нові",
  IN_WORK: "В роботі",
  CLIENT: "Клієнти",
  ARCHIVED: "Архівні",
};

export default function ContactsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("NEW");
  const { data: clients = [], isLoading } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: "",
    company: "",
    email: "",
    phone: "",
    status: "NEW",
    notes: [],
  });

  const handleAddClient = () => {
    createClient.mutate(newClient as any, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        setNewClient({ name: "", company: "", email: "", phone: "", status: "NEW", notes: [] });
      },
    });
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = c.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Клієнти</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Керуйте вашими лідами та активними клієнтами.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Пошук клієнтів..."
              className="pl-9"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <UserPlus className="mr-2 h-4 w-4" /> Додати
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Додати нового клієнта</DialogTitle>
                <DialogDescription>
                  Введіть дані клієнта. Натисніть зберегти, коли закінчите.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input
                  placeholder="Ім'я"
                  value={newClient.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClient({ ...newClient, name: e.target.value })}
                />
                <Input
                  placeholder="Компанія"
                  value={newClient.company}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClient({ ...newClient, company: e.target.value })}
                />
                <Input
                  placeholder="Email"
                  value={newClient.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClient({ ...newClient, email: e.target.value })}
                />
                <Input
                  placeholder="Телефон"
                  value={newClient.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClient({ ...newClient, phone: e.target.value })}
                />
                <Select
                  value={newClient.status}
                  onValueChange={(v: string) => setNewClient({ ...newClient, status: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_MAP).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button onClick={handleAddClient} disabled={createClient.isPending}>
                  {createClient.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Зберегти"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-zinc-100 dark:bg-zinc-900">
          {Object.entries(STATUS_MAP).map(([key, label]) => (
            <TabsTrigger key={key} value={key} className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-xl border-zinc-200 dark:border-zinc-800">
              <p className="text-zinc-500">Клієнтів не знайдено у цьому статусі.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredClients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}

function ClientCard({ client }: { client: Client }) {
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const [newNote, setNewNote] = useState("");

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    updateClient.mutate({
      id: client.id,
      notes: [...client.notes, newNote],
    });
    setNewNote("");
  };

  const handleStatusChange = (status: string) => {
    updateClient.mutate({ id: client.id, status: status as any });
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6 flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{client.name}</h3>
              <p className="text-zinc-500 font-medium">{client.company}</p>
            </div>
            <div className="flex gap-2">
              <Select value={client.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_MAP).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => {
                  if (confirm("Ви впевнені?")) deleteClient.mutate(client.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Email:</span> {client.email}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Тел:</span> {client.phone}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Plus className="h-3 w-3" /> Нотатки
            </h4>
            <div className="space-y-2 mb-4">
              {client.notes.length > 0 ? (
                client.notes.map((note, idx) => (
                  <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-sm italic">
                    {note}
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-400 italic">Нотаток немає.</p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Додати нотатку..."
                value={newNote}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewNote(e.target.value)}
                className="h-9 text-sm"
              />
              <Button size="sm" onClick={handleAddNote} disabled={updateClient.isPending}>
                Зберегти
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

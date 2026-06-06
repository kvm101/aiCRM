"use client";

import React, { useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Search, Plus, Trash2, Mail, Phone, Loader2 } from "lucide-react";
import { useClients, useCreateClient, useDeleteClient } from "@/hooks/useSales";
import { useLanguageStore } from "@/store/useLanguageStore";
import { t } from "@/lib/i18n";

export default function ClientsPage() {
  const { lang } = useLanguageStore();
  const tr = t(lang);

  const [searchTerm, setSearchTerm] = useState("");
  const { data: clients = [], isLoading } = useClients();
  const createClient = useCreateClient();
  const deleteClient = useDeleteClient();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "", company: "", email: "", phone: "", status: "NEW" as const, notes: [],
  });

  const handleAddClient = () => {
    if (!newClient.name) return;
    createClient.mutate(newClient, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        setNewClient({ name: "", company: "", email: "", phone: "", status: "NEW", notes: [] });
      },
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm(tr.clientsPage.deleteConfirm)) deleteClient.mutate(id);
  };

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-7rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {tr.clientsPage.title}
            </h1>
            <Badge variant="secondary" className="text-sm rounded-full px-3 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
              {tr.clientsPage.total}: {clients.length}
            </Badge>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{tr.clientsPage.subtitle}</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder={tr.clientsPage.searchPlaceholder}
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="mr-2 h-4 w-4" /> {tr.clientsPage.addButton}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{tr.clientsPage.newContact}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input placeholder={tr.clientsPage.namePlaceholder} value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} />
                <Input placeholder={tr.clientsPage.companyPlaceholder} value={newClient.company} onChange={(e) => setNewClient({ ...newClient, company: e.target.value })} />
                <Input type="email" placeholder="Email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} />
                <Input placeholder={tr.clientsPage.phonePlaceholder} value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} />
              </div>
              <DialogFooter>
                <Button onClick={handleAddClient} disabled={createClient.isPending || !newClient.name}>
                  {createClient.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : tr.clientsPage.save}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden min-h-0 shadow-sm">
        <div className="overflow-auto h-full">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-zinc-950 shadow-sm z-10">
                <TableRow>
                  <TableHead>{tr.clientsPage.colClient}</TableHead>
                  <TableHead>{tr.clientsPage.colContacts}</TableHead>
                  <TableHead>{tr.clientsPage.colCompany}</TableHead>
                  <TableHead>{tr.clientsPage.colStatus}</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        {client.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs text-zinc-500">
                        {client.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {client.email}</div>}
                        {client.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {client.phone}</div>}
                        {!client.email && !client.phone && <span>—</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{client.company || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal text-xs">
                        {tr.clientsPage.statusMap[client.status as keyof typeof tr.clientsPage.statusMap] || client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)} className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredClients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-zinc-500">
                      {tr.clientsPage.notFound}
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

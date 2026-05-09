"use client";

import { useState, useEffect, useRef } from "react";
import { useChatWS, useChats, useChatMessages, useDeleteChat, useMarkChatRead, useCreateTeamChat } from "@/hooks/useChatWS";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2, Trash2, BarChart2, ChevronDown, Sparkles, Plus } from "lucide-react";
import { useAIStore, SummaryPeriod, ChatContextMessage } from "@/store/useAIStore";
import { useAuthStore } from "@/store/useAuthStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

function ChatListItem({ chat, activeChatId, onClick }: { chat: any, activeChatId: number | null, onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-zinc-100 dark:border-zinc-800/50 ${
        activeChatId === chat.id ? "bg-indigo-50 dark:bg-indigo-900/20" : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
      }`}
    >
      <Avatar>
        <AvatarFallback className="bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {chat.clientName ? chat.clientName.substring(0, 2).toUpperCase() : "?"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 overflow-hidden">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-50 truncate">
            {chat.clientName || chat.externalChatId}
          </h3>
          <div className="flex items-center gap-2">
            {chat.unreadCount > 0 && (
              <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {chat.unreadCount}
              </span>
            )}
            <span className="text-[10px] text-zinc-400 font-bold">{chat.channelType}</span>
          </div>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-1">{chat.status}</p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { data: chats = [], isLoading: isLoadingChats } = useChats();
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"clients" | "team">("clients");
  const [isCreateChatOpen, setIsCreateChatOpen] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState("");
  const { requestSummary, analyzeChat } = useAIStore();
  const { currentUser } = useAuthStore();
  
  const clientChats = chats.filter((c) => c.channelType !== "INTERNAL");
  const teamChats = chats.filter((c) => c.channelType === "INTERNAL");

  // Set active chat when tab changes or chats load
  useEffect(() => {
    if (activeTab === "clients" && clientChats.length > 0) {
      if (!clientChats.find(c => c.id === activeChatId)) {
        setActiveChatId(clientChats[0].id);
      }
    } else if (activeTab === "team" && teamChats.length > 0) {
      if (!teamChats.find(c => c.id === activeChatId)) {
        setActiveChatId(teamChats[0].id);
      }
    } else {
      setActiveChatId(null);
    }
  }, [chats, activeTab]);

  const { data: serverMessages = [], isLoading: isLoadingMessages } = useChatMessages(activeChatId);
  const { liveMessages, sendMessage } = useChatWS();
  const { mutate: deleteChat } = useDeleteChat();
  const { mutate: markChatRead } = useMarkChatRead();
  const { mutate: createTeamChat, isPending: isCreatingChat } = useCreateTeamChat();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [inputText, setInputText] = useState("");

  const activeChat = chats.find((c) => c.id === activeChatId);

  // Combine server messages with any optimistic/live WS messages not yet in server list
  const allMessages = [...serverMessages];
  liveMessages.forEach(msg => {
    if (msg.chatId === activeChatId && !allMessages.find(m => m.id === msg.id)) {
      allMessages.push(msg);
    }
  });

  const lastClientMessage = [...allMessages].reverse().find(m => m.sender === "client");

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  // Mark chat as read when active
  useEffect(() => {
    if (activeChatId) {
      const chat = chats.find(c => c.id === activeChatId);
      if (chat && chat.unreadCount > 0) {
        markChatRead(activeChatId);
      }
    }
  }, [activeChatId, chats, markChatRead]);

  const handleSend = () => {
    if (!inputText.trim() || !activeChatId) return;
    sendMessage({ chatId: activeChatId, text: inputText });
    setInputText("");
  };

  const handleDeleteChat = () => {
    if (!activeChatId) return;
    if (window.confirm("Ви впевнені, що хочете видалити цей чат? Всі повідомлення будуть видалені назавжди.")) {
      deleteChat(activeChatId, {
        onSuccess: () => {
          setActiveChatId(null);
        }
      });
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
      {/* Sidebar: Active Chats */}
      <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-zinc-950/50">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "clients" | "team")} className="flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-4">
            <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50">Чати</h2>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="clients">Клієнти</TabsTrigger>
              <TabsTrigger value="team">Команда</TabsTrigger>
            </TabsList>
            {activeTab === "team" && (
              <Button onClick={() => setIsCreateChatOpen(true)} className="w-full gap-2" variant="outline" size="sm">
                <Plus className="h-4 w-4" />
                Створити чат
              </Button>
            )}
          </div>
          
          <TabsContent value="clients" className="flex-1 m-0 data-[state=inactive]:hidden overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 h-full">
              {isLoadingChats ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
              ) : clientChats.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-sm">
                  Немає активних чатів з клієнтами.
                </div>
              ) : clientChats.map((chat) => (
                <ChatListItem key={chat.id} chat={chat} activeChatId={activeChatId} onClick={() => setActiveChatId(chat.id)} />
              ))}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="team" className="flex-1 m-0 data-[state=inactive]:hidden overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 h-full">
              {isLoadingChats ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
              ) : teamChats.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-sm">
                  Немає командних чатів.
                </div>
              ) : teamChats.map((chat) => (
                <ChatListItem key={chat.id} chat={chat} activeChatId={activeChatId} onClick={() => setActiveChatId(chat.id)} />
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                {activeChat?.clientName ? activeChat.clientName.substring(0, 2).toUpperCase() : "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">{activeChat?.clientName || "Unknown Client"}</h2>
              <p className="text-xs text-zinc-500">via {activeChat?.channelType || "..."}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Кнопка сумаризації */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-full text-xs"
                  disabled={!activeChatId}
                >
                  <BarChart2 className="h-3.5 w-3.5" />
                  Сумаризація
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs text-zinc-500">Проаналізувати за</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(["day", "week", "month"] as SummaryPeriod[]).map((period) => (
                  <DropdownMenuItem
                    key={period}
                    onClick={() => requestSummary(period, currentUser.id)}
                    className="cursor-pointer"
                  >
                    {period === "day" && "📅 За день"}
                    {period === "week" && "📆 За тиждень"}
                    {period === "month" && "🗓️ За місяць"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Кнопка AI-аналізу поточного чату */}
            <Button
              variant="outline"
              size="sm"
              disabled={!activeChatId}
              onClick={() => {
                if (!activeChat) return;
                const ctx: ChatContextMessage[] = allMessages.map((m) => ({
                  sender: m.sender,
                  text: m.text ?? "",
                  timestamp: m.timestamp,
                }));
                analyzeChat({
                  sessionId: activeChat.id,
                  clientName: activeChat.clientName || "",
                  channelType: activeChat.channelType,
                  externalChatId: activeChat.externalChatId,
                  userId: currentUser.id,
                  recentMessages: ctx,
                });
              }}
              className="gap-1.5 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/50 rounded-full text-xs"
              title="Відкрити AI з контекстом цього чату"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Ask AI
            </Button>

            <Button
              onClick={handleDeleteChat}
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
              disabled={!activeChatId}
              title="Видалити чат"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 p-4 bg-zinc-50/50 dark:bg-zinc-950/20 overflow-y-auto min-h-0">
          <div className="flex flex-col gap-4 max-w-3xl mx-auto pb-4">
            {isLoadingMessages ? (
               <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
            ) : allMessages.length === 0 ? (
               <div className="text-center p-10 text-zinc-500 text-sm">Немає повідомлень. Почніть спілкування!</div>
            ) : allMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[80%] ${
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
                }`}
              >
                <Avatar className="h-8 w-8 mt-auto flex-shrink-0">
                  <AvatarFallback className={msg.sender === "user" ? "bg-indigo-500 text-white" : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800"}>
                    {msg.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`p-3 rounded-2xl text-sm shadow-sm ${
                    msg.sender === "user"
                      ? "bg-indigo-500 text-white rounded-br-sm"
                      : "bg-white border border-zinc-200 text-zinc-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                  <div className={`text-[10px] mt-1 text-right opacity-70`}>
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
          <form
            className="flex gap-2 max-w-3xl mx-auto"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <Input
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 rounded-full px-4"
            />
            <Button type="submit" size="icon" className="rounded-full shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
      
      <Dialog open={isCreateChatOpen} onOpenChange={setIsCreateChatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Створити командний чат</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Назва чату (наприклад: Маркетинг, Розробка)"
              value={newChatTitle}
              onChange={(e) => setNewChatTitle(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateChatOpen(false)}>Скасувати</Button>
            <Button 
              onClick={() => {
                if (newChatTitle.trim()) {
                  createTeamChat(newChatTitle.trim(), {
                    onSuccess: (data: any) => {
                      setNewChatTitle("");
                      setIsCreateChatOpen(false);
                      setActiveChatId(data.id);
                    }
                  });
                }
              }} 
              disabled={isCreatingChat || !newChatTitle.trim()}
            >
              {isCreatingChat ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Створити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

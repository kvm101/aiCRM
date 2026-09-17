"use client";

import { useState, useEffect, useRef } from "react";
import { useChatWS, useChats, useChatMessages, useDeleteChat, useMarkChatRead, useRenameChat } from "@/hooks/useChatWS";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2, Trash2, BarChart2, ChevronDown, Sparkles, Pencil, Check as CheckIcon, ArrowLeft, MessageSquare } from "lucide-react";
import { useAIStore, SummaryPeriod, ChatContextMessage } from "@/store/useAIStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Removed Tabs and Dialog imports

function ChatListItem({ chat, activeChatId, onClick, lang }: { chat: any, activeChatId: number | null, onClick: () => void, lang: string }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-zinc-100 dark:border-zinc-800/50 ${
        activeChatId === chat.id ? "bg-accent" : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
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
              <span
                className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full min-h-5 min-w-5 inline-flex items-center justify-center"
                aria-label={`${chat.unreadCount} ${lang === 'ua' ? 'непрочитаних' : 'unread'}`}
              >
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
  const { requestSummary, analyzeChat } = useAIStore();
  const { currentUser } = useAuthStore();
  const { lang } = useLanguageStore();
  const tr = t(lang);
  
  const clientChats = chats.filter((c) => c.channelType !== "INTERNAL");

  // Set active chat when chats load
  useEffect(() => {
    if (clientChats.length > 0) {
      if (!clientChats.find(c => c.id === activeChatId)) {
        setActiveChatId(clientChats[0].id);
      }
    } else {
      setActiveChatId(null);
    }
  }, [chats]);

  const { data: serverMessages = [], isLoading: isLoadingMessages } = useChatMessages(activeChatId);
  const { liveMessages, sendMessage } = useChatWS();
  const { mutate: deleteChat } = useDeleteChat();
  const { mutate: markChatRead } = useMarkChatRead();
  const { mutate: renameChat } = useRenameChat();

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
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

  // Auto-scroll to bottom when messages change (scroll only inner container, not outer main)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
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
    if (window.confirm(lang === 'ua' ? 'Ви впевнені, що хочете видалити цей чат? Всі повідомлення будуть видалені назавжди.' : 'Are you sure you want to delete this chat? All messages will be permanently deleted.')) {
      deleteChat(activeChatId, {
        onSuccess: () => {
          setActiveChatId(null);
        }
      });
    }
  };

  const handleStartRename = () => {
    if (!activeChat) return;
    setRenameValue(activeChat.clientName || "");
    setIsRenaming(true);
    setTimeout(() => renameInputRef.current?.focus(), 50);
  };

  const handleSaveRename = () => {
    if (!activeChatId || !renameValue.trim()) {
      setIsRenaming(false);
      return;
    }
    renameChat({ chatId: activeChatId, clientName: renameValue.trim() });
    setIsRenaming(false);
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] max-w-6xl w-full mx-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
      {/* Sidebar: Active Chats */}
      <div className={cn("w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-zinc-950/50 shrink-0", activeChatId ? "hidden md:flex" : "flex")}>
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50">{tr.chatPage.title}</h2>
        </div>
        <ScrollArea className="flex-1 h-full">
          {isLoadingChats ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : clientChats.length === 0 ? (
            <div className="p-4 text-center text-zinc-500 text-sm">
              {tr.chatPage.noChats}
            </div>
          ) : clientChats.map((chat) => (
            <ChatListItem key={chat.id} chat={chat} activeChatId={activeChatId} lang={lang} onClick={() => setActiveChatId(chat.id)} />
          ))}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      {!activeChatId ? (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center text-zinc-400 bg-white dark:bg-zinc-950">
          <MessageSquare className="h-16 w-16 mb-4 opacity-10" />
          <p>{tr.chatPage.selectChat}</p>
        </div>
      ) : (
        <div className={cn("flex-1 flex flex-col relative bg-white dark:bg-zinc-950", !activeChatId ? "hidden md:flex" : "flex")}>
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-950">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveChatId(null)}
                className="inline-flex min-h-10 min-w-10 items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md md:hidden text-zinc-600 hover:text-foreground mr-1"
                title={lang === 'ua' ? 'Назад до списку' : 'Back to chats list'}
                aria-label={lang === 'ua' ? 'Назад до списку чатів' : 'Back to chat list'}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {activeChat?.clientName ? activeChat.clientName.substring(0, 2).toUpperCase() : "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              {isRenaming ? (
                <div className="flex items-center gap-1.5">
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(); if (e.key === 'Escape') setIsRenaming(false); }}
                    onBlur={handleSaveRename}
                    className="font-semibold text-zinc-900 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-0.5 text-sm outline-none ring-2 ring-primary w-48"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 group cursor-pointer" onClick={handleStartRename}>
                  <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">{activeChat?.clientName || "Unknown Client"}</h2>
                  <Pencil className="h-3.5 w-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
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
                  className="gap-1.5 rounded-full text-xs"
                  disabled={!activeChatId}
                >
                  <BarChart2 className="h-3.5 w-3.5" />
                  {lang === 'ua' ? 'Сумаризація' : 'Summarize'}
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs text-zinc-500">{lang === 'ua' ? 'Проаналізувати за' : 'Analyze by'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(["day", "week", "month"] as SummaryPeriod[]).map((period) => (
                  <DropdownMenuItem
                    key={period}
                    onClick={() => requestSummary(period, currentUser?.id || "")}
                    className="cursor-pointer"
                  >
                    {period === "day" && (lang === 'ua' ? '📅 За день' : '📅 By day')}
                    {period === "week" && (lang === 'ua' ? '📆 За тиждень' : '📆 By week')}
                    {period === "month" && (lang === 'ua' ? '🗓️ За місяць' : '🗓️ By month')}
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
                  sender: m.sender || "client",
                  text: m.text ?? "",
                  timestamp: m.timestamp,
                }));
                analyzeChat({
                  sessionId: activeChat.id,
                  clientName: activeChat.clientName || "",
                  channelType: activeChat.channelType,
                  externalChatId: activeChat.externalChatId,
                  userId: currentUser?.id || "",
                  recentMessages: ctx,
                });
              }}
              className="gap-1.5 rounded-full text-xs"
              title="Відкрити AI з контекстом цього чату"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {tr.header.askAI}
            </Button>

            <Button
              onClick={handleDeleteChat}
              variant="ghost"
              size="icon-sm"
              className="text-zinc-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
              disabled={!activeChatId}
              title={lang === 'ua' ? 'Видалити чат' : 'Delete chat'}
              aria-label={lang === 'ua' ? 'Видалити чат' : 'Delete chat'}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div ref={messagesContainerRef} className="flex-1 p-4 bg-zinc-50/50 dark:bg-zinc-950/20 overflow-y-auto min-h-0">
          <div className="flex flex-col gap-4 max-w-3xl mx-auto pb-4">
            {isLoadingMessages ? (
               <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
            ) : allMessages.length === 0 ? (
               <div className="text-center p-10 text-zinc-500 text-sm">{lang === 'ua' ? 'Немає повідомлень. Почніть спілкування!' : 'No messages yet. Start the conversation!'}</div>
            ) : allMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[80%] ${
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
                }`}
              >
                <Avatar className="h-8 w-8 mt-auto flex-shrink-0">
                  <AvatarFallback className={msg.sender === "user" ? "bg-primary text-primary-foreground" : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"}>
                    {msg.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`p-3 rounded-2xl text-sm shadow-sm ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-white border-2 border-zinc-200 text-zinc-900 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 rounded-bl-sm"
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
              placeholder={tr.chatPage.inputPlaceholder}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 rounded-full px-4 min-h-11"
            />
            <Button type="submit" size="icon" className="rounded-full shrink-0" aria-label={lang === 'ua' ? 'Надіслати' : 'Send'}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
      )}

    </div>
  );
}

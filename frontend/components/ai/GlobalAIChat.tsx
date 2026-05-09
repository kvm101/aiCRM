"use client";

import { useState, useRef, useEffect } from "react";
import { useAIStore } from "@/store/useAIStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Square, Bot, User, Loader2, Sparkles, X, Trash2, AlertTriangle } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import axios from "axios";

export function GlobalAIChat() {
  const { 
    isOpen, setIsOpen, messages, addMessage, isGenerating, setGenerating, 
    modelProvider, setModelProvider, loadHistory, clearMessages, 
    shouldClear, totalMessages, isHistoryLoaded 
  } = useAIStore();
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleAbort = () => {
    abortControllerRef.current?.abort();
  };

  // Завантажуємо історію з БД при першому відкритті
  useEffect(() => {
    if (isOpen && !isHistoryLoaded) {
      loadHistory();
    }
  }, [isOpen, isHistoryLoaded, loadHistory]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;

    const userMessage = inputText;
    setInputText("");

    // Знімаємо знімок поточної історії ДО додавання нового повідомлення
    const historySnapshot = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    addMessage({ role: "user", content: userMessage });
    setGenerating(true);

    // Створюємо новий AbortController для цього запиту
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await apiClient.post(
        "/ai/chat",
        { message: userMessage, history: historySnapshot, modelProvider },
        { withCredentials: true, signal: controller.signal }
      );
      addMessage({ role: "ai", content: response.data.reply });
      
      // Оновлюємо лічильник з відповіді бекенду
      const store = useAIStore.getState();
      const total = response.data.totalMessages ?? store.messages.length;
      useAIStore.setState({ 
        totalMessages: total, 
        shouldClear: response.data.shouldClear ?? total >= 20 
      });
    } catch (error) {
      if (axios.isCancel(error) || (error as Error)?.name === "CanceledError") {
        addMessage({ role: "ai", content: "⏹ Запит скасовано." });
      } else {
        console.error("AI Chat Error:", error);
        addMessage({ role: "ai", content: "Вибачте, сталася помилка при з'єднанні з сервером." });
      }
    } finally {
      abortControllerRef.current = null;
      setGenerating(false);
    }
  };

  const handleClearHistory = async () => {
    await clearMessages();
  };

  return (
    <div
      className={`
        flex flex-col h-full border-l border-zinc-200 dark:border-zinc-800
        bg-zinc-50 dark:bg-zinc-950 overflow-hidden shrink-0
        transition-all duration-300 ease-in-out
        ${isOpen ? "w-[380px]" : "w-0"}
      `}
    >
      {/* Заголовок */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">AI Assistant</p>
            <div className="mt-0.5">
              <Select value={modelProvider} onValueChange={setModelProvider}>
                <SelectTrigger className="h-6 w-[130px] text-[10px] border-none bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900 px-1 py-0 shadow-none focus:ring-0 text-zinc-500">
                  <SelectValue placeholder="Виберіть модель" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto" className="text-xs">Auto (Gemini → GitHub → Mistral → Groq)</SelectItem>
                  <SelectItem value="gemini" className="text-xs">Google Gemini</SelectItem>
                  <SelectItem value="github" className="text-xs">GitHub Models (GPT-4o-mini)</SelectItem>
                  <SelectItem value="mistral" className="text-xs">Mistral AI</SelectItem>
                  <SelectItem value="groq" className="text-xs">Groq Llama-3.3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearHistory}
              className="h-7 w-7 text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
              title="Очистити історію"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Банер "Рекомендовано очистити" */}
      {shouldClear && (
        <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 flex items-center gap-2 shrink-0">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300 flex-1">
            {totalMessages}+ повідомлень. Рекомендуємо очистити історію для кращої роботи AI.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            className="h-6 text-[10px] px-2 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/40 shrink-0"
          >
            Очистити
          </Button>
        </div>
      )}

      {/* Повідомлення */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0">
        {!isHistoryLoaded ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400 mb-3" />
            <p className="text-sm text-zinc-500">Завантаження історії...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
            <Bot className="h-12 w-12 mb-4 text-zinc-400" />
            <p className="text-sm text-zinc-500">Чим я можу допомогти вам сьогодні?</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[90%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
            >
              <Avatar className="h-7 w-7 mt-auto flex-shrink-0">
                <AvatarFallback
                  className={
                    msg.role === "user"
                      ? "bg-indigo-500 text-white"
                      : "bg-gradient-to-br from-indigo-500 to-purple-500 text-white"
                  }
                >
                  {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                </AvatarFallback>
              </Avatar>
              <div
                className={`p-3 rounded-2xl text-sm shadow-sm ${
                  msg.role === "user"
                    ? "bg-indigo-500 text-white rounded-br-sm"
                    : "bg-white border border-zinc-200 text-zinc-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <div className="text-[10px] mt-1 text-right opacity-60">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))
        )}
        {isGenerating && (
          <div className="flex gap-3 max-w-[90%]">
            <Avatar className="h-7 w-7 mt-auto flex-shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </AvatarFallback>
            </Avatar>
            <div className="p-3 rounded-2xl text-sm shadow-sm bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-bl-sm">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле введення */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
        <form className="flex gap-2" onSubmit={handleSend}>
          <Input
            placeholder="Ask AI anything..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isGenerating}
            className="flex-1 rounded-full px-4 text-sm"
          />
          {isGenerating ? (
            <Button
              type="button"
              size="icon"
              onClick={handleAbort}
              className="rounded-full shrink-0 bg-red-500 hover:bg-red-600 transition-colors"
              title="Скасувати генерацію"
            >
              <Square className="h-4 w-4 fill-white text-white" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!inputText.trim()}
              className="rounded-full shrink-0 bg-indigo-600 hover:bg-indigo-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}

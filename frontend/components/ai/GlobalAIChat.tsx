"use client";

import { useState, useRef, useEffect } from "react";
import { useAIStore } from "@/store/useAIStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Sparkles, X } from "lucide-react";
import { apiClient } from "@/services/apiClient";

export function GlobalAIChat() {
  const { isOpen, setIsOpen, messages, addMessage, isGenerating, setGenerating } = useAIStore();
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    
    addMessage({ role: 'user', content: userMessage });
    setGenerating(true);

    try {
      const response = await apiClient.post('/ai/chat', { message: userMessage }, { withCredentials: true });
      addMessage({ role: 'ai', content: response.data.reply });
      setGenerating(false);
    } catch (error) {
      console.error("AI Chat Error:", error);
      addMessage({ role: 'ai', content: "Вибачте, сталася помилка при з'єднанні з сервером." });
      setGenerating(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 p-0 sm:max-w-md">
        <SheetHeader className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-5 w-5" /> AI Assistant
            </SheetTitle>
          </div>
          <SheetDescription className="text-xs">
            Powered by Google AI Studio & MCP
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
              <Bot className="h-12 w-12 mb-4 text-zinc-400" />
              <p className="text-sm text-zinc-500">Чим я можу допомогти вам сьогодні?</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                }`}
              >
                <Avatar className="h-8 w-8 mt-auto flex-shrink-0">
                  <AvatarFallback className={msg.role === "user" ? "bg-indigo-500 text-white" : "bg-gradient-to-br from-indigo-500 to-purple-500 text-white"}>
                    {msg.role === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
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
                  <div className="text-[10px] mt-1 text-right opacity-70">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
          {isGenerating && (
            <div className="flex gap-3 max-w-[85%]">
              <Avatar className="h-8 w-8 mt-auto flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                  <Sparkles className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="p-3 rounded-2xl text-sm shadow-sm bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-bl-sm">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
          <form className="flex gap-2" onSubmit={handleSend}>
            <Input
              placeholder="Ask AI anything..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isGenerating}
              className="flex-1 rounded-full px-4"
            />
            <Button type="submit" size="icon" disabled={isGenerating || !inputText.trim()} className="rounded-full shrink-0 bg-indigo-600 hover:bg-indigo-700">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

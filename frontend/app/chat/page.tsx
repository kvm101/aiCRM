"use client";

import { useState, useEffect } from "react";
import { useChatWS, ChatMessage } from "@/hooks/useChatWS";
import { useAISuggestions } from "@/hooks/useAISuggestions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Send, Bot, Sparkles, User, Copy, Check, Loader2, StopCircle } from "lucide-react";

// Mock Active Chats list
const mockChats = [
  { id: "chat1", clientName: "Alice Smith", lastMessage: "Can we schedule a call?", unread: 2 },
  { id: "chat2", clientName: "Bob Johnson", lastMessage: "Thanks for the proposal.", unread: 0 },
  { id: "chat3", clientName: "Telegram User 123", lastMessage: "What are your pricing plans?", unread: 1 },
];

export default function ChatPage() {
  const { messages, sendMessage } = useChatWS();
  const { suggestion, isGenerating, generateSuggestion, stopGeneration } = useAISuggestions();
  
  const [activeChatId, setActiveChatId] = useState<string>("chat1");
  const [inputText, setInputText] = useState("");
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeChat = mockChats.find((c) => c.id === activeChatId);

  // Filter messages for current chat.
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([
    { id: "m1", chatId: "chat1", sender: "client", text: "Hello, I am interested in your services.", timestamp: new Date(Date.now() - 100000).toISOString() },
    { id: "m2", chatId: "chat1", sender: "user", text: "Hi Alice! How can I help you today?", timestamp: new Date(Date.now() - 80000).toISOString() },
    { id: "m3", chatId: "chat1", sender: "client", text: "Can we schedule a call?", timestamp: new Date(Date.now() - 60000).toISOString() },
  ]);

  useEffect(() => {
    if (messages.length > 0) {
      setLocalMessages((prev) => {
        const newMsgs = messages.filter(m => !prev.some(p => p.id === m.id));
        return [...prev, ...newMsgs];
      });
    }
  }, [messages]);

  const currentChatMessages = localMessages.filter((m) => m.chatId === activeChatId);
  const lastClientMessage = [...currentChatMessages].reverse().find(m => m.sender === "client");

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(activeChatId, inputText);
    
    setLocalMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        chatId: activeChatId,
        sender: "user",
        text: inputText,
        timestamp: new Date().toISOString()
      }
    ]);
    
    setInputText("");
  };

  const handleGenerateAI = () => {
    setIsAiSidebarOpen(true);
    if (lastClientMessage) {
      generateSuggestion(lastClientMessage.text);
    }
  };

  const handleCopySuggestion = () => {
    navigator.clipboard.writeText(suggestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setInputText(suggestion); // optionally populate input box
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
      {/* Sidebar: Active Chats */}
      <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-zinc-950/50">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50">Active Chats</h2>
        </div>
        <ScrollArea className="flex-1">
          {mockChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-zinc-100 dark:border-zinc-800/50 ${
                activeChatId === chat.id ? "bg-indigo-50 dark:bg-indigo-900/20" : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
              }`}
            >
              <Avatar>
                <AvatarFallback className="bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {chat.clientName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-50 truncate">{chat.clientName}</h3>
                  {chat.unread > 0 && (
                    <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {chat.unread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-1">{chat.lastMessage}</p>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                {activeChat?.clientName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">{activeChat?.clientName}</h2>
              <p className="text-xs text-zinc-500">via Telegram</p>
            </div>
          </div>
          
          <Button 
            onClick={handleGenerateAI}
            variant="outline" 
            size="sm" 
            className="gap-2 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/50"
            disabled={!lastClientMessage || isGenerating}
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            AI Smart Reply
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4 bg-zinc-50/50 dark:bg-zinc-950/20">
          <div className="flex flex-col gap-4 max-w-3xl mx-auto">
            {currentChatMessages.map((msg) => (
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
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
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

      {/* AI Suggestions Sidebar (Sheet) */}
      <Sheet open={isAiSidebarOpen} onOpenChange={setIsAiSidebarOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">
          <SheetHeader className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <SheetTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-5 w-5" /> AI Assistant
            </SheetTitle>
            <SheetDescription>
              Smart replies generated based on the client's last message.
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto py-6">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Context</h4>
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-600 dark:text-zinc-300 italic">
                "{lastClientMessage?.text}"
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Generated Suggestion</h4>
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-800/50 min-h-[150px] relative">
                {suggestion ? (
                  <p className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                    {suggestion}
                  </p>
                ) : isGenerating ? (
                  <div className="flex items-center justify-center h-full text-indigo-400">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">No suggestion generated yet.</p>
                )}
                
                {isGenerating && (
                  <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-500 animate-pulse align-middle" />
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between">
            {isGenerating ? (
              <Button variant="outline" onClick={stopGeneration} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                <StopCircle className="h-4 w-4 mr-2" /> Stop
              </Button>
            ) : (
              <Button variant="outline" onClick={() => lastClientMessage && generateSuggestion(lastClientMessage.text)}>
                Regenerate
              </Button>
            )}
            
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleCopySuggestion}
              disabled={!suggestion || isGenerating}
            >
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              Use Reply
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

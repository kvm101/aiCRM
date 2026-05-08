"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, Loader2, Calendar } from "lucide-react";
import { apiClient } from "@/services/apiClient";

export default function MailingPage() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [when, setWhen] = useState(new Date().toISOString().slice(0, 16));
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const recipients = to.split(",").map(s => s.trim()).filter(s => s);
    
    try {
      await apiClient.post("/mail/mail", {
        to: recipients,
        subject,
        text,
        when: new Date(when).toISOString().split('.')[0], // Removes .000Z to match Java LocalDateTime
      }, { withCredentials: true });
      
      alert("Листи успішно надіслано!");
      setTo("");
      setSubject("");
      setText("");
    } catch (error) {
      console.error(error);
      alert("Помилка при відправленні листів.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Розсилка</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Надсилайте повідомлення вашим клієнтам.</p>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-indigo-500" />
            Нова розсилка
          </CardTitle>
          <CardDescription>
            Вкажіть отримувачів через кому та напишіть текст повідомлення.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Отримувачі (через кому)</label>
              <Input 
                placeholder="client1@example.com, client2@example.com" 
                value={to}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTo(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Тема</label>
              <Input 
                placeholder="Введіть тему листа" 
                value={subject}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Текст повідомлення</label>
              <Textarea 
                placeholder="Напишіть ваше повідомлення тут..." 
                className="min-h-[200px]"
                value={text}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Час відправлення (необов’язково)
              </label>
              <Input 
                type="datetime-local" 
                value={when}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWhen(e.target.value)}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 h-11"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Send className="h-5 w-5 mr-2" />
              )}
              Надіслати зараз
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

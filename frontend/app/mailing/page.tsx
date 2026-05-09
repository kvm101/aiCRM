"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, Loader2, Calendar, Inbox, Paperclip, Search, Clock, Plus } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFolderEmails } from "@/hooks/useMail";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function MailingPage() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [when, setWhen] = useState(new Date().toISOString().slice(0, 16));
  const [isLoading, setIsLoading] = useState(false);

  const { data: sentEmails = [], refetch: refetchSent } = useFolderEmails("SENT");
  const { data: inboxEmails = [] } = useFolderEmails("INBOX");

  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

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
      refetchSent();
      setActiveTab("sent");
    } catch (error) {
      console.error(error);
      alert("Помилка при відправленні листів.");
    } finally {
      setIsLoading(false);
    }
  };

  const EmailList = ({ emails, type }: { emails: any[], type: 'inbox' | 'sent' }) => {
    if (emails.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
          <Mail className="h-12 w-12 mb-4 opacity-20" />
          <p>Немає листів у цій папці.</p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-[600px] border rounded-md">
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {emails.map(email => (
            <div 
              key={email.id} 
              className={`p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer ${selectedEmail?.id === email.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
              onClick={() => setSelectedEmail(email)}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate w-2/3">
                  {type === 'inbox' ? email.sender : email.recipient}
                </span>
                <span className="text-xs text-zinc-500 whitespace-nowrap">
                  {new Date(email.timestamp).toLocaleDateString()}
                </span>
              </div>
              <div className="font-medium text-sm text-zinc-800 dark:text-zinc-200 truncate">
                {email.subject}
              </div>
              <div className="text-sm text-zinc-500 truncate mt-1">
                {email.body}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-8 flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 flex flex-col min-h-0 space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Пошта</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Керуйте вашою електронною поштою.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 pt-4 rounded-t-xl shrink-0">
            <TabsList className="w-full justify-start h-10 bg-transparent p-0 gap-6">
              <TabsTrigger value="inbox" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-2 pb-3 pt-2 text-sm">
                <Inbox className="h-4 w-4 mr-2" /> Вхідні
              </TabsTrigger>
              <TabsTrigger value="sent" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-2 pb-3 pt-2 text-sm">
                <Send className="h-4 w-4 mr-2" /> Надіслані
              </TabsTrigger>
              <TabsTrigger value="compose" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-2 pb-3 pt-2 text-sm">
                <Plus className="h-4 w-4 mr-2" /> Написати
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="inbox" className="flex-1 flex min-h-0 m-0">
            <div className="w-1/3 min-w-[300px] border-r border-zinc-200 dark:border-zinc-800">
              <EmailList emails={inboxEmails} type="inbox" />
            </div>
            <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-zinc-950">
              {selectedEmail ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">{selectedEmail.subject}</h2>
                    <div className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                      <div className="flex justify-between items-center">
                        <div>
                          Від: <span className="font-medium text-zinc-900 dark:text-zinc-100">{selectedEmail.sender}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1.5"/> {new Date(selectedEmail.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        Кому: <span className="font-medium text-zinc-900 dark:text-zinc-100">{selectedEmail.recipient}</span>
                      </div>
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap text-zinc-800 dark:text-zinc-300">
                    {selectedEmail.body}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                  <Mail className="h-16 w-16 mb-4 opacity-10" />
                  <p>Виберіть лист для перегляду</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sent" className="flex-1 flex min-h-0 m-0">
            <div className="w-1/3 min-w-[300px] border-r border-zinc-200 dark:border-zinc-800">
              <EmailList emails={sentEmails} type="sent" />
            </div>
            <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-zinc-950">
              {selectedEmail ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">{selectedEmail.subject}</h2>
                    <div className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                      <div className="flex justify-between items-center">
                        <div>
                          Від: <span className="font-medium text-zinc-900 dark:text-zinc-100">{selectedEmail.sender}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1.5"/> {new Date(selectedEmail.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        Кому: <span className="font-medium text-zinc-900 dark:text-zinc-100">{selectedEmail.recipient}</span>
                      </div>
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap text-zinc-800 dark:text-zinc-300">
                    {selectedEmail.body}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                  <Mail className="h-16 w-16 mb-4 opacity-10" />
                  <p>Виберіть лист для перегляду</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="compose" className="m-0 p-6 flex items-center justify-center">
            <Card className="w-full max-w-2xl border-zinc-200 dark:border-zinc-800 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-indigo-500" />
                  Новий лист
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
                    className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 mt-4"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <Send className="h-5 w-5 mr-2" />
                    )}
                    Надіслати
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

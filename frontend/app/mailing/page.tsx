"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, Loader2, Calendar, Inbox, Paperclip, Search, Clock, Plus, Check } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFolderEmails, useMarkEmailAsRead } from "@/hooks/useMail";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/store/useAuthStore";

export default function MailingPage() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [sendMode, setSendMode] = useState<"now" | "later">("now");
  const [delayMinutes, setDelayMinutes] = useState<number | null>(null);
  const [customWhen, setCustomWhen] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: sentEmails = [], refetch: refetchSent } = useFolderEmails("SENT");
  const { data: inboxEmails = [] } = useFolderEmails("INBOX");
  const { mutate: markAsRead } = useMarkEmailAsRead();
  const [timeFilter, setTimeFilter] = useState<"day" | "3days" | "week" | "all">("all");
  const { currentUser } = useAuthStore();

  const filterDate = new Date();
  if (timeFilter === "day") {
    filterDate.setDate(filterDate.getDate() - 1);
  } else if (timeFilter === "3days") {
    filterDate.setDate(filterDate.getDate() - 3);
  } else if (timeFilter === "week") {
    filterDate.setDate(filterDate.getDate() - 7);
  } else {
    filterDate.setFullYear(2000);
  }

  const filteredInboxEmails = inboxEmails.filter((email: any) => new Date(email.timestamp) >= filterDate);
  const unreadEmailsCount = filteredInboxEmails.filter((email: any) => !(email.isRead ?? email.read)).length;

  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  const computeSendTime = (): string => {
    let date: Date;
    if (sendMode === "now") {
      date = new Date();
    } else if (delayMinutes !== null) {
      date = new Date(Date.now() + delayMinutes * 60 * 1000);
    } else if (customWhen) {
      date = new Date(customWhen);
    } else {
      date = new Date();
    }
    return date.toISOString().split('.')[0];
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const recipients = to.split(",").map(s => s.trim()).filter(s => s);

    try {
      await apiClient.post("/mail/mail", {
        to: recipients,
        subject,
        text,
        when: computeSendTime(),
      }, { withCredentials: true });

      alert(sendMode === "now" ? "Листи надіслано!" : "Листи заплановано!");
      setTo("");
      setSubject("");
      setText("");
      setSendMode("now");
      setDelayMinutes(null);
      setCustomWhen("");
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
      <ScrollArea className="flex-1 min-h-0 border-t rounded-b-md">
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {emails.map(email => {
            const isUnread = !(email.isRead ?? email.read);
            return (
              <div
                key={email.id}
                className={`p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer ${selectedEmail?.id === email.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''} ${!isUnread ? 'opacity-70 bg-zinc-50/50 dark:bg-zinc-950/50' : ''}`}
                onClick={() => {
                  setSelectedEmail(email);
                  if (isUnread) {
                    markAsRead(email.id);
                  }
                }}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2 w-2/3">
                    {isUnread && <div className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />}
                    <span className={`font-semibold truncate ${isUnread ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-500 dark:text-zinc-400 font-normal'}`}>
                      {type === 'inbox' ? email.sender : email.recipient}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500 whitespace-nowrap">
                    {new Date(email.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className={`text-sm truncate mt-1 ${isUnread ? 'text-zinc-800 dark:text-zinc-200 font-medium' : 'text-zinc-500'}`}>
                  {email.subject}
                </div>
                <div className={`text-xs truncate mt-1 ${isUnread ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-400'}`}>
                  {email.body}
                </div>
              </div>
            );
          })}
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
          <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 pt-4 rounded-t-xl shrink-0 flex items-center justify-between">
            <TabsList className="justify-start h-10 bg-transparent p-0 gap-6">
              <TabsTrigger value="inbox" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-2 pb-3 pt-2 text-sm relative">
                <Inbox className="h-4 w-4 mr-2" /> Вхідні
              </TabsTrigger>
              <TabsTrigger value="sent" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-2 pb-3 pt-2 text-sm">
                <Send className="h-4 w-4 mr-2" /> Надіслані
              </TabsTrigger>
              <TabsTrigger value="compose" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-2 pb-3 pt-2 text-sm">
                <Plus className="h-4 w-4 mr-2" /> Написати
              </TabsTrigger>
            </TabsList>
            <div className="ml-auto pb-3">
              {currentUser?.email && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300 text-sm font-medium border border-zinc-200 dark:border-zinc-700">
                  <Mail className="w-4 h-4 text-zinc-500" />
                  {currentUser.email}
                </div>
              )}
            </div>
          </div>

          <TabsContent value="inbox" className="flex-1 flex min-h-0 m-0 overflow-hidden">
            <div className="w-1/3 min-w-[300px] border-r border-zinc-200 dark:border-zinc-800 flex flex-col min-h-0">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/30 flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center">
                    Вхідні
                    <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                      {unreadEmailsCount} нових
                    </span>
                  </span>
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value as any)}
                    className="text-xs border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 px-2 py-1 outline-none text-zinc-600 dark:text-zinc-400"
                  >
                    <option value="all">За весь час</option>
                    <option value="day">За день</option>
                    <option value="3days">За 3 дні</option>
                    <option value="week">За тиждень</option>
                  </select>
                </div>
              </div>
              <EmailList emails={filteredInboxEmails} type="inbox" />
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
                          <Clock className="h-3.5 w-3.5 mr-1.5" /> {new Date(selectedEmail.timestamp).toLocaleString()}
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

          <TabsContent value="sent" className="flex-1 flex min-h-0 m-0 overflow-hidden">
            <div className="w-1/3 min-w-[300px] border-r border-zinc-200 dark:border-zinc-800 flex flex-col min-h-0">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/30 shrink-0 border-b border-zinc-200 dark:border-zinc-800">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Надіслані</span>
              </div>
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
                          <Clock className="h-3.5 w-3.5 mr-1.5" /> {new Date(selectedEmail.timestamp).toLocaleString()}
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

          <TabsContent value="compose" className="flex-1 m-0 p-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto space-y-5">

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
                    className="min-h-[120px]"
                    value={text}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
                    required
                  />
                </div>

                {/* Режим відправки */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Відправлення</label>
                  <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 w-fit">
                    <button
                      type="button"
                      onClick={() => { setSendMode("now"); setDelayMinutes(null); setCustomWhen(""); }}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${sendMode === "now"
                          ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                          : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        }`}
                    >
                      <Send className="h-3.5 w-3.5 inline mr-1.5" />
                      Зараз
                    </button>
                    <button
                      type="button"
                      onClick={() => setSendMode("later")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${sendMode === "later"
                          ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                          : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        }`}
                    >
                      <Clock className="h-3.5 w-3.5 inline mr-1.5" />
                      Запланувати
                    </button>
                  </div>

                  {sendMode === "later" && (
                    <div className="space-y-3 pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: "Через 30 хв", mins: 30 },
                          { label: "Через 1 год", mins: 60 },
                          { label: "Через 3 год", mins: 180 },
                          { label: "Завтра о 9:00", mins: -1 },
                        ].map((opt) => (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => {
                              if (opt.mins === -1) {
                                const tomorrow = new Date();
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                tomorrow.setHours(9, 0, 0, 0);
                                setCustomWhen(tomorrow.toISOString().slice(0, 16));
                                setDelayMinutes(null);
                              } else {
                                setDelayMinutes(opt.mins);
                                setCustomWhen("");
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${(opt.mins === -1 ? customWhen && !delayMinutes : delayMinutes === opt.mins)
                                ? "bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-300"
                                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                              }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <span>або точний час:</span>
                        <Input
                          type="datetime-local"
                          value={customWhen}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setCustomWhen(e.target.value); setDelayMinutes(null); }}
                          className="w-auto h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className={`w-full h-11 mt-4 transition-colors ${sendMode === "now"
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-amber-600 hover:bg-amber-700"
                    }`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : sendMode === "now" ? (
                    <Send className="h-5 w-5 mr-2" />
                  ) : (
                    <Calendar className="h-5 w-5 mr-2" />
                  )}
                  {sendMode === "now" ? "Надіслати зараз" : "Запланувати"}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, KanbanSquare,
  MessageSquare, FileBarChart, Mail, Briefcase,
} from "lucide-react";
import { useChats } from "@/hooks/useChatWS";
import { useLanguageStore } from "@/store/useLanguageStore";
import { t } from "@/lib/i18n";

export function Sidebar() {
  const pathname = usePathname();
  const { data: chats = [] } = useChats();
  const { lang } = useLanguageStore();
  const tr = t(lang);

  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const navigation = [
    { name: tr.nav.home,    href: "/",        icon: LayoutDashboard },
    { name: tr.nav.clients, href: "/clients", icon: Users },
    { name: tr.nav.deals,   href: "/deals",   icon: Briefcase },
    { name: tr.nav.kanban,  href: "/kanban",  icon: KanbanSquare },
    { name: tr.nav.chats,   href: "/chat",    icon: MessageSquare },
    { name: tr.nav.mailing, href: "/mailing", icon: Mail },
  ];

  return (
    <div className="flex h-full w-64 flex-col border-r bg-zinc-950 text-zinc-50">
      <div className="flex h-16 items-center px-6 border-b border-zinc-800">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            AI CRM
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            const isChat = item.href === "/chat";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                )}
              >
                <div className="flex items-center">
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      isActive ? "text-white" : "text-zinc-500 group-hover:text-white"
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </div>
                {isChat && totalUnread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500 px-1.5 text-[10px] font-bold text-white">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

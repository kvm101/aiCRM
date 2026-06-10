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
    <div className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
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
                  "group flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
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
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
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

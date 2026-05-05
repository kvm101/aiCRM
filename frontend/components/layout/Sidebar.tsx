"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  MessageSquare,
  FileBarChart,
  Settings,
  Mail,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Kanban", href: "/kanban", icon: KanbanSquare },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Mailing", href: "/mailing", icon: Mail },
  { name: "Reports", href: "/reports", icon: FileBarChart },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-zinc-950 text-zinc-50">
      <div className="flex h-16 items-center px-6 border-b border-zinc-800">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            CRM
          </div>
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            AI CRM
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-white" : "text-zinc-500 group-hover:text-white"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-zinc-800 p-4">
        <Link
          href="/settings"
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-white transition-colors"
        >
          <Settings className="mr-3 h-5 w-5 flex-shrink-0 text-zinc-500 group-hover:text-white" />
          Settings
        </Link>
      </div>
    </div>
  );
}

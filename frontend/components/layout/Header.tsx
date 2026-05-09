"use client";

import { Bell, Search, Sparkles, Check } from "lucide-react";
import { useAuthStore, Role } from "@/store/useAuthStore";
import { useAIStore } from "@/store/useAIStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUnreadNotifications, useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/useNotifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function Header() {
  const { currentUser, logout, fetchCurrentUser, isLoading } = useAuthStore();
  const { toggleOpen } = useAIStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    if (!isLoading && !currentUser && pathname !== "/login") {
      router.push("/login");
    }
  }, [isLoading, currentUser, pathname, router]);

  const { data: unreadNotifications = [] } = useUnreadNotifications();
  const { data: notifications = [] } = useNotifications();
  const markAsRead = useMarkNotificationRead();
  const markAllAsRead = useMarkAllNotificationsRead();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search contacts, deals, messages..."
            className="h-9 w-full rounded-md border border-zinc-200 bg-zinc-50 pl-9 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button 
          onClick={toggleOpen}
          variant="outline" 
          size="sm" 
          className="gap-2 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-full"
        >
          <Sparkles className="h-4 w-4" />
          Ask AI
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
              <Bell className="h-5 w-5" />
              {unreadNotifications.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadNotifications.length > 9 ? "9+" : unreadNotifications.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-semibold text-sm">Сповіщення</h3>
              {unreadNotifications.length > 0 && (
                <button 
                  onClick={() => markAllAsRead.mutate()}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Прочитано
                </button>
              )}
            </div>
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-zinc-500">
                  <Bell className="h-6 w-6 opacity-20 mb-2" />
                  <p className="text-sm">Немає нових сповіщень</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={cn(
                        "p-4 flex flex-col gap-1 transition-colors cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900",
                        !notif.read ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""
                      )}
                      onClick={() => {
                        if (!notif.read) markAsRead.mutate(notif.id);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <span className={cn("text-sm font-medium", !notif.read ? "text-indigo-900 dark:text-indigo-100" : "text-zinc-900 dark:text-zinc-100")}>
                          {notif.title}
                        </span>
                        {!notif.read && <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 mt-1" />}
                      </div>
                      <p className="text-xs text-zinc-500 line-clamp-2">{notif.message}</p>
                      <span className="text-[10px] text-zinc-400 mt-1">
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                  {currentUser ? getInitials(currentUser.name) : "?"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            {currentUser && (
              <>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                    <p className="text-xs leading-none text-zinc-500 dark:text-zinc-400">
                      {currentUser.role}
                    </p>
                    {currentUser.email && (
                      <p className="text-xs text-zinc-400 truncate">{currentUser.email}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer">
              Вийти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

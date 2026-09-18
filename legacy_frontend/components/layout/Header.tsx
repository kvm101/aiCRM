"use client";

import { Bell, Search, Sparkles, Check, Menu } from "lucide-react";
import { ConsistentHelpButton } from "@/components/layout/ConsistentHelpButton";
import { useSidebarStore } from "@/store/useSidebarStore";
import { useAuthStore, Role } from "@/store/useAuthStore";
import { useProjectStore } from "@/store/useProjectStore";
import { useAIStore } from "@/store/useAIStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { t } from "@/lib/i18n";
import { FolderGit2, Building2, Plus, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUnreadNotifications, useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/useNotifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

// Окремий компонент для вибору проєкту
function ProjectSwitcher() {
  const { organization, projects, activeProjectId, setActiveProjectId, fetchOrganizationAndProjects, createOrganization, createProject } = useProjectStore();
  const { currentUser } = useAuthStore();
  
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [isCreatingProj, setIsCreatingProj] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (currentUser?.id) {
      fetchOrganizationAndProjects();
    }
  }, [currentUser?.id, fetchOrganizationAndProjects]);

  if (!currentUser) return null;

  const activeProject = projects.find(p => p.id === activeProjectId);

  const handleCreateOrg = async () => {
    if (newName.trim()) {
      await createOrganization(newName);
      setNewName("");
      setIsCreatingOrg(false);
    }
  };

  const handleCreateProj = async () => {
    if (newName.trim()) {
      await createProject(newName);
      setNewName("");
      setIsCreatingProj(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-900">
          <div className="flex items-center justify-center h-8 w-8 rounded bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4 stroke-[2px]" />
          </div>
          <div className="flex flex-col items-start text-sm">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
              {organization ? organization.name : "Немає організації"}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-tight">
              {activeProject ? activeProject.name : "Виберіть проєкт"}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {organization ? (
          <>
            <DropdownMenuLabel className="text-xs text-zinc-500">Проєкти</DropdownMenuLabel>
            {projects.map((proj) => (
              <DropdownMenuItem 
                key={proj.id} 
                onClick={() => setActiveProjectId(proj.id)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FolderGit2 className="h-4 w-4 text-zinc-400" />
                  <span className={activeProjectId === proj.id ? "font-medium" : ""}>{proj.name}</span>
                </div>
                {activeProjectId === proj.id && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            
            {isCreatingProj ? (
              <div className="p-2 flex gap-2">
                <input 
                  autoFocus
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Назва проєкту"
                  className="h-8 w-full rounded border border-zinc-200 px-2 text-sm outline-none"
                  onKeyDown={e => e.key === 'Enter' && handleCreateProj()}
                />
                <Button size="sm" onClick={handleCreateProj} className="h-8">OK</Button>
              </div>
            ) : (
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); setIsCreatingProj(true); }} className="cursor-pointer text-primary">
                <Plus className="h-4 w-4 mr-2" /> Створити проєкт
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-zinc-600">
              <Settings className="h-4 w-4 mr-2" /> Налаштування організації
            </DropdownMenuItem>
          </>
        ) : (
          <>
            {isCreatingOrg ? (
              <div className="p-2 flex gap-2">
                <input 
                  autoFocus
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Назва організації"
                  className="h-8 w-full rounded border border-zinc-200 px-2 text-sm outline-none"
                  onKeyDown={e => e.key === 'Enter' && handleCreateOrg()}
                />
                <Button size="sm" onClick={handleCreateOrg} className="h-8">OK</Button>
              </div>
            ) : (
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); setIsCreatingOrg(true); }} className="cursor-pointer text-primary">
                <Plus className="h-4 w-4 mr-2" /> Створити організацію
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const { currentUser, logout, fetchCurrentUser, isLoading } = useAuthStore();
  const toggleSidebar = useSidebarStore((s) => s.toggle);
  const { toggleOpen } = useAIStore();
  const { lang, toggle } = useLanguageStore();
  const tr = t(lang);
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
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
      <div className="flex flex-1 items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={toggleSidebar}
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-muted-foreground hover:text-foreground md:hidden hover:bg-accent transition-colors"
          title="Toggle Menu"
          aria-label="Toggle Menu"
        >
          <Menu className="h-5 w-5 stroke-[2px]" />
        </button>
        <ProjectSwitcher />
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <ConsistentHelpButton />

        <Button 
          onClick={toggleOpen}
          variant="default" 
          size="sm" 
          className="gap-2 rounded-full text-primary-foreground"
        >
          <Sparkles className="h-4 w-4 stroke-[2px]" />
          {tr.header.askAI}
        </Button>

        {/* Language toggle */}
        <button
          type="button"
          onClick={toggle}
          className="inline-flex min-h-10 items-center gap-1 rounded-full border-2 border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors select-none"
          title={lang === 'ua' ? 'Switch to English' : 'Перемкнути на українську'}
          aria-label={lang === 'ua' ? 'Switch to English' : 'Перемкнути на українську'}
        >
          <span className={lang === 'ua' ? 'text-primary font-bold' : 'text-muted-foreground'}>
            UA
          </span>
          <span className="text-muted-foreground/50">/</span>
          <span className={lang === 'en' ? 'text-primary font-bold' : 'text-muted-foreground'}>
            EN
          </span>
        </button>

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
              <h3 className="font-semibold text-sm">{tr.header.notifications}</h3>
              {unreadNotifications.length > 0 && (
                <button 
                  onClick={() => markAllAsRead.mutate()}
                  className="text-xs text-primary hover:text-primary/80 font-medium flex items-center min-h-8"
                >
                  <Check className="h-3 w-3 mr-1" />
                  {tr.header.markRead}
                </button>
              )}
            </div>
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-zinc-500">
                  <Bell className="h-6 w-6 opacity-20 mb-2" />
                  <p className="text-sm">{tr.header.noNotifications}</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={cn(
                        "p-4 flex flex-col gap-1 transition-colors cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900",
                        !notif.read ? "bg-accent" : ""
                      )}
                      onClick={() => {
                        if (!notif.read) markAsRead.mutate(notif.id);
                      }}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={cn("text-sm font-medium", !notif.read ? "text-foreground font-semibold" : "text-zinc-900 dark:text-zinc-100")}>
                          {notif.title}
                        </span>
                        {!notif.read && (
                          <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 shrink-0">
                            {lang === 'ua' ? 'Нове' : 'New'}
                          </Badge>
                        )}
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
                <AvatarFallback className="bg-primary text-primary-foreground">
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
              {tr.header.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

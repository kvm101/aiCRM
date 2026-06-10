import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  Search,
  Truck,
  CheckCircle2,
  XCircle,
  UserPlus,
  Briefcase,
  Archive,
  ListTodo,
  Loader2,
  CircleDot,
  Clock,
  AlertTriangle,
} from "lucide-react";

/** WCAG-friendly status chips: icon + label, not color alone. */
export type DealStatusKey = "NEW" | "QUALIFICATION" | "DELIVERY" | "DONE" | "LOST";
export type ClientStatusKey = "NEW" | "IN_WORK" | "CLIENT" | "ARCHIVED";
export type TaskStatusKey = "PLANNED" | "IN_WORK" | "DONE";

type StatusVisual = {
  icon: LucideIcon;
  /** Filled chip — always white text on saturated bg */
  chip: string;
  /** Outline chip — text + border, for tables */
  outline: string;
};

export const DEAL_STATUS_VISUAL: Record<DealStatusKey, StatusVisual> = {
  NEW: {
    icon: Sparkles,
    chip: "bg-indigo-600 text-white border border-indigo-700",
    outline: "bg-indigo-50 text-indigo-950 border-2 border-indigo-600 dark:bg-indigo-950 dark:text-indigo-100 dark:border-indigo-400",
  },
  QUALIFICATION: {
    icon: Search,
    chip: "bg-sky-600 text-white border border-sky-700",
    outline: "bg-sky-50 text-sky-950 border-2 border-sky-600 dark:bg-sky-950 dark:text-sky-100 dark:border-sky-400",
  },
  DELIVERY: {
    icon: Truck,
    chip: "bg-amber-600 text-white border border-amber-700",
    outline: "bg-amber-50 text-amber-950 border-2 border-amber-600 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-400",
  },
  DONE: {
    icon: CheckCircle2,
    chip: "bg-emerald-600 text-white border border-emerald-700",
    outline: "bg-emerald-50 text-emerald-950 border-2 border-emerald-600 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-400",
  },
  LOST: {
    icon: XCircle,
    chip: "bg-rose-600 text-white border border-rose-700",
    outline: "bg-rose-50 text-rose-950 border-2 border-rose-600 dark:bg-rose-950 dark:text-rose-100 dark:border-rose-400",
  },
};

export const CLIENT_STATUS_VISUAL: Record<ClientStatusKey, StatusVisual> = {
  NEW: {
    icon: UserPlus,
    chip: "bg-indigo-600 text-white border border-indigo-700",
    outline: "bg-indigo-50 text-indigo-950 border-2 border-indigo-600 dark:bg-indigo-950 dark:text-indigo-100 dark:border-indigo-400",
  },
  IN_WORK: {
    icon: Loader2,
    chip: "bg-sky-600 text-white border border-sky-700",
    outline: "bg-sky-50 text-sky-950 border-2 border-sky-600 dark:bg-sky-950 dark:text-sky-100 dark:border-sky-400",
  },
  CLIENT: {
    icon: Briefcase,
    chip: "bg-emerald-600 text-white border border-emerald-700",
    outline: "bg-emerald-50 text-emerald-950 border-2 border-emerald-600 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-400",
  },
  ARCHIVED: {
    icon: Archive,
    chip: "bg-zinc-600 text-white border border-zinc-700",
    outline: "bg-zinc-100 text-zinc-900 border-2 border-zinc-500 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-400",
  },
};

export const TASK_STATUS_VISUAL: Record<TaskStatusKey, StatusVisual> = {
  PLANNED: {
    icon: ListTodo,
    chip: "bg-indigo-600 text-white border border-indigo-700",
    outline: "bg-indigo-50 text-indigo-950 border-2 border-indigo-600 dark:bg-indigo-950 dark:text-indigo-100 dark:border-indigo-400",
  },
  IN_WORK: {
    icon: CircleDot,
    chip: "bg-amber-600 text-white border border-amber-700",
    outline: "bg-amber-50 text-amber-950 border-2 border-amber-600 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-400",
  },
  DONE: {
    icon: CheckCircle2,
    chip: "bg-emerald-600 text-white border border-emerald-700",
    outline: "bg-emerald-50 text-emerald-950 border-2 border-emerald-600 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-400",
  },
};

export type ReportStatusKey = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export const REPORT_STATUS_VISUAL: Record<ReportStatusKey, StatusVisual> = {
  PENDING: {
    icon: Clock,
    chip: "bg-zinc-600 text-white border border-zinc-700",
    outline: "bg-zinc-100 text-zinc-900 border-2 border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-400",
  },
  PROCESSING: {
    icon: Loader2,
    chip: "bg-amber-600 text-white border border-amber-700",
    outline: "bg-amber-50 text-amber-950 border-2 border-amber-600 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-400",
  },
  COMPLETED: {
    icon: CheckCircle2,
    chip: "bg-emerald-600 text-white border border-emerald-700",
    outline: "bg-emerald-50 text-emerald-950 border-2 border-emerald-600 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-400",
  },
  FAILED: {
    icon: AlertTriangle,
    chip: "bg-rose-600 text-white border border-rose-700",
    outline: "bg-rose-50 text-rose-950 border-2 border-rose-600 dark:bg-rose-950 dark:text-rose-100 dark:border-rose-400",
  },
};

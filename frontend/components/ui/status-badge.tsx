import { cn } from "@/lib/utils";
import {
  DEAL_STATUS_VISUAL,
  CLIENT_STATUS_VISUAL,
  TASK_STATUS_VISUAL,
  type DealStatusKey,
  type ClientStatusKey,
  type TaskStatusKey,
  REPORT_STATUS_VISUAL,
  type ReportStatusKey,
} from "@/lib/status-config";

type StatusBadgeProps = {
  label: string;
  variant?: "chip" | "outline";
  className?: string;
};

function StatusBadgeBase({
  visual,
  label,
  variant = "outline",
  className,
}: StatusBadgeProps & { visual: (typeof DEAL_STATUS_VISUAL)[DealStatusKey] }) {
  const Icon = visual.icon;
  return (
    <span
      role="status"
      className={cn(
        "inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-none",
        variant === "chip" ? visual.chip : visual.outline,
        className
      )}
    >
      <Icon className="size-3.5 shrink-0 stroke-[2.25px]" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function DealStatusBadge({
  status,
  label,
  variant = "outline",
  className,
}: {
  status: string;
  label: string;
  variant?: "chip" | "outline";
  className?: string;
}) {
  const key = status as DealStatusKey;
  const visual = DEAL_STATUS_VISUAL[key] ?? DEAL_STATUS_VISUAL.NEW;
  return <StatusBadgeBase visual={visual} label={label} variant={variant} className={className} />;
}

export function ClientStatusBadge({
  status,
  label,
  variant = "outline",
  className,
}: {
  status: string;
  label: string;
  variant?: "chip" | "outline";
  className?: string;
}) {
  const key = status as ClientStatusKey;
  const visual = CLIENT_STATUS_VISUAL[key] ?? CLIENT_STATUS_VISUAL.NEW;
  return <StatusBadgeBase visual={visual} label={label} variant={variant} className={className} />;
}

export function TaskStatusBadge({
  status,
  label,
  variant = "outline",
  className,
}: {
  status: string;
  label: string;
  variant?: "chip" | "outline";
  className?: string;
}) {
  const key = status as TaskStatusKey;
  const visual = TASK_STATUS_VISUAL[key] ?? TASK_STATUS_VISUAL.PLANNED;
  return <StatusBadgeBase visual={visual} label={label} variant={variant} className={className} />;
}

export function ReportStatusBadge({
  status,
  label,
  spinning,
  className,
}: {
  status: string;
  label: string;
  spinning?: boolean;
  className?: string;
}) {
  const key = status as ReportStatusKey;
  const visual = REPORT_STATUS_VISUAL[key] ?? REPORT_STATUS_VISUAL.PENDING;
  const Icon = visual.icon;
  return (
    <span
      role="status"
      className={cn(
        "inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-none",
        visual.outline,
        className
      )}
    >
      <Icon className={cn("size-3.5 shrink-0 stroke-[2.25px]", spinning && "animate-spin")} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

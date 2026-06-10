"use client";

import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguageStore } from "@/store/useLanguageStore";
import { cn } from "@/lib/utils";

const HELP_HREF = "https://github.com/vasyl-karpliak/aiCRM";

type ConsistentHelpButtonProps = {
  className?: string;
  compact?: boolean;
};

/** WCAG 3.2.6 — help entry point in the same place on every screen. */
export function ConsistentHelpButton({ className, compact }: ConsistentHelpButtonProps) {
  const { lang } = useLanguageStore();
  const label = lang === "ua" ? "Довідка та підтримка" : "Help & support";

  return (
    <Button
      asChild
      variant="outline"
      size={compact ? "icon-sm" : "sm"}
      className={cn(
        "shrink-0 border-2 border-border text-foreground hover:bg-accent hover:text-accent-foreground",
        className
      )}
    >
      <Link
        href={HELP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        title={label}
      >
        <CircleHelp className="size-4 stroke-[2px]" aria-hidden="true" />
        {!compact && <span className="hidden sm:inline">{lang === "ua" ? "Довідка" : "Help"}</span>}
      </Link>
    </Button>
  );
}

"use client";

import { useState } from "react";
import { useAIStore } from "@/store/useAIStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Play, X, ChevronDown, ChevronUp, Terminal, Cpu } from "lucide-react";

export function PendingToolModal() {
  const { lang } = useLanguageStore();
  const tr = t(lang);

  const { pendingToolCall, approvePendingToolCall, rejectPendingToolCall } = useAIStore();
  const [showDetails, setShowDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!pendingToolCall) return null;

  // Attempt to parse arguments if they are a string
  let parsedArgs = pendingToolCall.arguments;
  if (typeof parsedArgs === "string") {
    try {
      parsedArgs = JSON.parse(parsedArgs);
    } catch {
      // Use as is
    }
  }

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await approvePendingToolCall();
    } finally {
      setIsProcessing(false);
      setShowDetails(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await rejectPendingToolCall();
    } finally {
      setIsProcessing(false);
      setShowDetails(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md transition-all duration-300">
      <div 
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl transition-all duration-300 scale-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 shrink-0">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0">
            <Cpu className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
              {tr.pendingTool.modalTitle}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {tr.pendingTool.modalDesc}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Tool Badge */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
              {tr.pendingTool.toolBadge}
            </span>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/40 dark:border-zinc-700/40 text-sm font-mono text-indigo-600 dark:text-indigo-400 font-semibold shadow-inner">
              <Terminal className="h-4 w-4 shrink-0 text-zinc-400" />
              {pendingToolCall.toolName}
            </div>
          </div>

          {/* Details Toggle */}
          <div className="space-y-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  {tr.pendingTool.hideDetails}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  {tr.pendingTool.viewDetails}
                </>
              )}
            </button>

            {showDetails && (
              <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-300 overflow-x-auto shadow-inner max-h-48 overflow-y-auto">
                <span className="text-[10px] text-zinc-500 block mb-2">// {tr.pendingTool.arguments}</span>
                <pre>{JSON.stringify(parsedArgs, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-end gap-3 shrink-0">
          <Button
            variant="outline"
            disabled={isProcessing}
            onClick={handleReject}
            className="px-4 py-2 text-zinc-700 hover:text-red-600 dark:text-zinc-300 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center gap-1.5 transition-all duration-200 active:scale-95 text-xs font-semibold"
          >
            <X className="h-4 w-4" />
            {tr.pendingTool.rejectBtn}
          </Button>

          <Button
            disabled={isProcessing}
            onClick={handleApprove}
            className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all duration-200 active:scale-95 text-xs font-bold border-none"
          >
            <Play className="h-4 w-4 fill-white" />
            {tr.pendingTool.runBtn}
          </Button>
        </div>
      </div>
    </div>
  );
}

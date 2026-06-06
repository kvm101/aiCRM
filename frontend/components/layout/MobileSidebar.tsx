"use client";

import { useSidebarStore } from "@/store/useSidebarStore";
import { Sidebar } from "./Sidebar";
import { X } from "lucide-react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function MobileSidebar() {
  const { isOpen, close } = useSidebarStore();
  const pathname = usePathname();

  // Close sidebar when navigating to a new page
  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={close}
          className="fixed inset-0 z-40 bg-zinc-900/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 text-zinc-50 md:hidden flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={close}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <Sidebar />
      </div>
    </>
  );
}

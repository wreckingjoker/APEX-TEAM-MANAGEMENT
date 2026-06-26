"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import Image from "next/image";
import { Sidebar } from "./Sidebar";
import type { UserRole } from "@/types";

interface DashboardShellProps {
  role: UserRole;
  fullName: string;
  children: React.ReactNode;
}

export function DashboardShell({ role, fullName, children }: DashboardShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar whenever route changes (after mobile nav tap)
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      {/* Mobile backdrop overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — fixed overlay on mobile, part of flex row on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-60 transition-transform duration-200 ease-in-out md:relative md:z-auto md:flex md:shrink-0 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <Sidebar role={role} fullName={fullName} />
      </div>

      {/* Right side: mobile top bar + main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar (hidden on md+) */}
        <header className="md:hidden flex items-center gap-3 px-4 h-14 bg-[#1A1A3E] border-b border-white/10 shrink-0">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open navigation menu"
            className="p-1 -ml-1 rounded-lg text-white/70 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Image
              src="/images/apex-logo.jpeg"
              alt="Apex Digital"
              width={28}
              height={28}
              className="rounded-md shrink-0"
            />
            <div className="leading-tight">
              <p className="text-white font-bold text-sm">Apex Digital</p>
              <p className="text-[#00C8FF] text-[10px]">Team Hub</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}

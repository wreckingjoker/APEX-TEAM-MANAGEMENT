"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Columns3,
  ListTodo,
  Users,
  UserCircle,
  Settings,
  LogOut,
  Briefcase,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { avatarColor } from "@/lib/avatar-color";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: "/kanban", label: "Kanban Board", icon: <Columns3 className="w-4 h-4" /> },
  { href: "/tasks", label: "Tasks", icon: <ListTodo className="w-4 h-4" /> },
  { href: "/clients", label: "Clients", icon: <Briefcase className="w-4 h-4" /> },
  { href: "/members", label: "Members", icon: <Users className="w-4 h-4" />, adminOnly: true },
  { href: "/profile", label: "Profile", icon: <UserCircle className="w-4 h-4" /> },
  { href: "/settings", label: "Settings", icon: <Settings className="w-4 h-4" />, adminOnly: true },
];

interface SidebarProps {
  role: UserRole;
  fullName: string;
}

export function Sidebar({ role, fullName }: SidebarProps) {
  const pathname = usePathname();

  async function handleLogout() {
    await signOut({ callbackUrl: "/login" });
  }

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || role === "admin"
  );

  return (
    <aside className="w-60 shrink-0 flex flex-col h-full bg-[#1A1A3E] border-r border-white/10">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <Image
          src="/images/apex-logo.jpeg"
          alt="Apex Digital"
          width={36}
          height={36}
          className="rounded-lg"
        />
        <div>
          <p className="text-white font-bold text-sm leading-tight">Apex Digital</p>
          <p className="text-[#00C8FF] text-xs">Team Hub</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-3 py-4 flex-1" aria-label="Main navigation">
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/6"
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className={active ? "text-[#00C8FF]" : ""}>{item.icon}</span>
              {item.label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00C8FF]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: avatarColor(fullName) }}
          >
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{fullName}</p>
            <p className="text-slate-400 text-xs capitalize">{role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-sm font-medium transition-all"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrainCircuit, Database, History, LayoutDashboard, LogOut, Menu, Network, Radar, Shield, Sparkles, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/auth-context";
import { cn } from "@/lib/utils";




const nav = [
  ["command",  "Command",        LayoutDashboard],
  ["threats",  "Threats",        Radar],
  ["ai",       "AI Analysis",    BrainCircuit],
  ["infra",    "Infrastructure", Network],
  ["sources",  "Sources",        Database],
  ["history",  "History",        History],
  ["reviews",  "Reviews",        Star],      // ← add this line
] as const;

export function DashboardShell({ children, active, setActive }: { children: React.ReactNode; active: string; setActive: (value: string) => void }) {
  const [open, setOpen] = useState(true);
  const auth = useAuth();
  const router = useRouter();

  const logout = () => {
    auth.logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-950/20">
      <aside className={cn("fixed inset-y-0 left-0 z-30 flex flex-col border-r border-cyan-300/10 bg-slate-950/80 backdrop-blur-xl transition-all", open ? "w-72" : "w-20")}>
        <div className="flex h-16 items-center justify-between border-b border-cyan-300/10 px-4">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-cyan-300/30 bg-cyan-300/10">
              <Shield className="h-5 w-5 text-cyan-200" />
            </span>
            {open && <span className="font-semibold text-cyan-50">Aegis OSINT</span>}
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="Toggle sidebar">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
        <nav className="flex-1 space-y-2 p-3">
          {nav.map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={cn(
                "flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold transition",
                active === key ? "bg-cyan-300/15 text-cyan-100 shadow-glow" : "text-slate-400 hover:bg-cyan-300/10 hover:text-cyan-100"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {open && <span>{label}</span>}
            </button>
          ))}
        </nav>
        <div className="border-t border-cyan-300/10 p-4">
          {open && (
            <div className="mb-3 rounded-md border border-cyan-300/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                <Sparkles className="h-4 w-4" />
                {auth.user?.role || "analyst"}
              </div>
              <p className="mt-2 truncate text-sm text-slate-300">{auth.user?.email}</p>
            </div>
          )}
          <Button variant="outline" className="w-full" onClick={logout}>
            <LogOut className="h-4 w-4" />
            {open && "Logout"}
          </Button>
        </div>
      </aside>
      <main className={cn("transition-all", open ? "pl-72" : "pl-20")}>
        <div className="mx-auto max-w-[1500px] px-5 py-5 sm:px-8">{children}</div>
      </main>
    </div>
  );
}

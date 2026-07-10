"use client";

import { Bell, Search, Sun, Moon, Command, Plus, Menu, CalendarDays } from "lucide-react";
import { useUI } from "@/stores/ui";
import { useDashboard } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const TITLES: Record<string, { title: string; sub: string }> = {
  dashboard: { title: "Dashboard", sub: "Your sprint at a glance" },
  board: { title: "Board", sub: "Drag tasks across statuses" },
  tasks: { title: "Tasks", sub: "Every task across the sprint" },
  team: { title: "Team", sub: "People, workload & performance" },
  sprints: { title: "Sprints", sub: "Plan, track & retrospect" },
  analytics: { title: "Analytics", sub: "Velocity, risk & trends" },
  calendar: { title: "Calendar", sub: "Deadlines, releases & leaves" },
  history: { title: "History", sub: "Every sprint, preserved forever" },
};

export function Topbar() {
  const { view, setCommandOpen, setNotifOpen, toggleTheme, theme, setQuickAddTaskOpen, toggleSidebar } = useUI();
  const { data } = useDashboard();
  const t = TITLES[view] ?? TITLES.dashboard;
  const notifCount = data?.notifications?.length ?? 0;
  // Client-only date to avoid hydration mismatch; set once on first mount.
  const [now, setNow] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  if (!mounted) {
    setMounted(true);
    setNow(new Date());
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <button
        onClick={toggleSidebar}
        className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold leading-tight sm:text-lg">{t.title}</h1>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">{t.sub}</p>
      </div>

      {/* Search trigger */}
      <button
        onClick={() => setCommandOpen(true)}
        className="group hidden items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-sm text-muted-foreground transition hover:border-border/80 hover:bg-accent sm:flex"
      >
        <Search className="h-4 w-4" />
        <span className="pr-8">Search or jump to…</span>
        <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
      </button>

      <button
        onClick={() => setCommandOpen(true)}
        className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent sm:hidden"
      >
        <Search className="h-5 w-5" />
      </button>

      {/* Date chip */}
      <div className="hidden items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground lg:flex">
        <CalendarDays className="h-4 w-4 text-sprint-primary" />
        {now ? format(now, "EEE, MMM d") : "—"}
      </div>

      <Button
        size="sm"
        onClick={() => setQuickAddTaskOpen(true)}
        className="hidden gap-1.5 bg-sprint-primary text-sprint-primary-foreground hover:bg-sprint-primary/90 md:inline-flex"
      >
        <Plus className="h-4 w-4" /> New Task
      </Button>

      {/* Notifications */}
      <button
        onClick={() => setNotifOpen(true)}
        className="relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent"
      >
        <Bell className="h-5 w-5" />
        <AnimatePresence>
          {notifCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
            >
              {notifCount > 9 ? "9+" : notifCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Theme */}
      <button
        onClick={toggleTheme}
        className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent"
        aria-label="Toggle theme"
      >
        <AnimatePresence mode="wait" initial={false}>
          {theme === "dark" ? (
            <motion.span key="moon" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Moon className="h-5 w-5" />
            </motion.span>
          ) : (
            <motion.span key="sun" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Sun className="h-5 w-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Profile */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card/60 py-1 pl-1 pr-3">
        <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-purple-500 text-[11px] font-semibold text-white">
          ME
        </div>
        <div className="hidden leading-tight sm:block">
          <div className="text-xs font-semibold">You</div>
          <div className="text-[10px] text-muted-foreground">Manager</div>
        </div>
      </div>
    </header>
  );
}

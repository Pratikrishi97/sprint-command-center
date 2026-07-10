"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  KanbanSquare,
  ListChecks,
  Users,
  Flag,
  BarChart3,
  Calendar,
  History,
  ChevronLeft,
  Rocket,
  Plus,
  UserPlus,
  CalendarCheck,
} from "lucide-react";
import { useUI, type ViewKey } from "@/stores/ui";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/lib/queries";
import { Button } from "@/components/ui/button";

const NAV: { key: ViewKey; label: string; icon: typeof LayoutDashboard; hint: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, hint: "D" },
  { key: "board", label: "Board", icon: KanbanSquare, hint: "B" },
  { key: "tasks", label: "Tasks", icon: ListChecks, hint: "T" },
  { key: "team", label: "Team", icon: Users, hint: "E" },
  { key: "sprints", label: "Sprints", icon: Flag, hint: "S" },
  { key: "analytics", label: "Analytics", icon: BarChart3, hint: "A" },
  { key: "calendar", label: "Calendar", icon: Calendar, hint: "C" },
  { key: "history", label: "History", icon: History, hint: "H" },
];

export function Sidebar() {
  const { view, setView, sidebarCollapsed, toggleSidebar, setQuickAddTaskOpen, setQuickAddEmployeeOpen, setDailyUpdateOpen } = useUI();
  const { data } = useDashboard();
  const sprint = data?.sprint;
  const info = data?.sprintInfo;

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 76 : 248 }}
      transition={{ type: "spring", stiffness: 380, damping: 38 }}
      className="sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex"
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 px-4">
        <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-sprint-primary shadow-lg shadow-emerald-500/20">
          <Rocket className="h-5 w-5 text-black" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-sidebar-foreground">Sprint Command</div>
            <div className="truncate text-[11px] text-muted-foreground">Center</div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
        </button>
      </div>

      {/* Sprint status chip */}
      {!sidebarCollapsed && sprint && (
        <div className="mx-3 mb-2 rounded-xl border border-sidebar-border bg-card/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Active Sprint</span>
            {info && (
              <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                Week {info.currentWeek}
              </span>
            )}
          </div>
          <div className="mt-1 text-sm font-semibold text-sidebar-foreground">{sprint.name}</div>
          {info && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Day {Math.min(info.elapsedDays + 1, info.totalDays)} of {info.totalDays}</span>
                <span>{info.progressPct}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${info.progressPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div className="px-3 pb-1">
        <Button
          size="sm"
          className="w-full justify-start gap-2 bg-sprint-primary text-sprint-primary-foreground hover:bg-sprint-primary/90"
          onClick={() => setQuickAddTaskOpen(true)}
        >
          <Plus className="h-4 w-4" /> {!sidebarCollapsed && "New Task"}
        </Button>
      </div>
      <div className="flex gap-1.5 px-3 pb-2">
        <button
          onClick={() => setQuickAddEmployeeOpen(true)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-sidebar-border bg-card/40 py-1.5 text-[11px] font-medium text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <UserPlus className="h-3.5 w-3.5" /> {!sidebarCollapsed && "Member"}
        </button>
        <button
          onClick={() => setDailyUpdateOpen(true)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-sidebar-border bg-card/40 py-1.5 text-[11px] font-medium text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <CalendarCheck className="h-3.5 w-3.5" /> {!sidebarCollapsed && "Standup"}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2 scrollbar-thin">
        {NAV.map((item) => {
          const active = view === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition",
                active
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-sprint-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className={cn("h-4 w-4 shrink-0", active && "text-sprint-primary")} />
              {!sidebarCollapsed && <span className="flex-1 text-left">{item.label}</span>}
              {!sidebarCollapsed && (
                <kbd className="hidden rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground group-hover:inline-block">
                  {item.hint}
                </kbd>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!sidebarCollapsed && (
        <div className="border-t border-sidebar-border p-3">
          <div className="rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-3">
            <div className="text-[11px] font-medium text-emerald-300">⚡ Command Palette</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              Press <kbd className="rounded bg-muted px-1 py-0.5 text-[10px]">⌘K</kbd> anywhere
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
}

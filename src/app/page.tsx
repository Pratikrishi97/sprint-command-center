"use client";

import { useEffect } from "react";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/sprint/sidebar";
import { Topbar } from "@/components/sprint/topbar";
import { CommandPalette } from "@/components/sprint/command-palette";
import { NotificationsPanel } from "@/components/sprint/notifications";
import { TaskDrawer } from "@/components/sprint/task-drawer";
import { QuickAddTask } from "@/components/sprint/quick-add-task";
import { QuickAddEmployee } from "@/components/sprint/quick-add-employee";
import { DailyUpdateDialog } from "@/components/sprint/daily-update-dialog";
import { useUI, type ViewKey } from "@/stores/ui";
import { DashboardView } from "@/components/sprint/views/dashboard-view";
import { BoardView } from "@/components/sprint/views/board-view";
import { TasksView } from "@/components/sprint/views/tasks-view";
import { TeamView } from "@/components/sprint/views/team-view";
import { SprintsView } from "@/components/sprint/views/sprints-view";
import { AnalyticsView } from "@/components/sprint/views/analytics-view";
import { CalendarView, HistoryView } from "@/components/sprint/views/calendar-history-views";
import { MobileNav } from "@/components/sprint/mobile-nav";
import { DbStatusBanner } from "@/components/sprint/db-status-banner";
import { motion, AnimatePresence } from "framer-motion";

function ViewSwitch() {
  const view = useUI((s) => s.view);
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18 }}
        className="flex-1"
      >
        {view === "dashboard" && <DashboardView />}
        {view === "board" && <BoardView />}
        {view === "tasks" && <TasksView />}
        {view === "team" && <TeamView />}
        {view === "sprints" && <SprintsView />}
        {view === "analytics" && <AnalyticsView />}
        {view === "calendar" && <CalendarView />}
        {view === "history" && <HistoryView />}
      </motion.div>
    </AnimatePresence>
  );
}

function KeyboardShortcuts() {
  const { setCommandOpen, setView, setQuickAddTaskOpen, toggleTheme } = useUI();
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(true);
        return;
      }
      if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setQuickAddTaskOpen(true);
        return;
      }
      // single-letter nav (no modifier, not in input)
      const tag = (e.target as HTMLElement)?.tagName;
      const inField = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if (inField || e.metaKey || e.ctrlKey || e.altKey) return;
      const map: Record<string, ViewKey> = {
        d: "dashboard", b: "board", t: "tasks", e: "team", s: "sprints", a: "analytics", c: "calendar", h: "history",
      };
      const v = map[e.key.toLowerCase()];
      if (v) {
        e.preventDefault();
        setView(v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setCommandOpen, setView, setQuickAddTaskOpen, toggleTheme]);
  return null;
}

export default function Home() {
  return (
    <Providers>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <DbStatusBanner />
          <main className="flex flex-1 flex-col bg-grid pb-20 md:pb-0">
            <ViewSwitch />
          </main>
        </div>
      </div>

      {/* Overlays */}
      <MobileNav />
      <CommandPalette />
      <NotificationsPanel />
      <TaskDrawer />
      <QuickAddTask />
      <QuickAddEmployee />
      <DailyUpdateDialog />
      <KeyboardShortcuts />
    </Providers>
  );
}

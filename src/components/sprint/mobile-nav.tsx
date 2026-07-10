"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  KanbanSquare,
  ListChecks,
  Users,
  BarChart3,
  Flag,
  Calendar,
  History,
} from "lucide-react";
import { useUI, type ViewKey } from "@/stores/ui";
import { cn } from "@/lib/utils";

const NAV: { key: ViewKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Home", icon: LayoutDashboard },
  { key: "board", label: "Board", icon: KanbanSquare },
  { key: "tasks", label: "Tasks", icon: ListChecks },
  { key: "team", label: "Team", icon: Users },
  { key: "analytics", label: "Stats", icon: BarChart3 },
];

const MORE: { key: ViewKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "sprints", label: "Sprints", icon: Flag },
  { key: "calendar", label: "Calendar", icon: Calendar },
  { key: "history", label: "History", icon: History },
];

export function MobileNav() {
  const { view, setView } = useUI();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl md:hidden">
      <div className="flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {NAV.map((item) => {
          const active = view === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition",
                active ? "text-sprint-primary" : "text-muted-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="mobile-active"
                  className="absolute -top-px h-0.5 w-8 rounded-full bg-sprint-primary"
                />
              )}
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
        {MORE.map((item) => {
          const active = view === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition",
                active ? "text-sprint-primary" : "text-muted-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="mobile-active"
                  className="absolute -top-px h-0.5 w-8 rounded-full bg-sprint-primary"
                />
              )}
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

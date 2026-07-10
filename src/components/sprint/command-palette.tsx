"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useUI, type ViewKey } from "@/stores/ui";
import {
  LayoutDashboard,
  KanbanSquare,
  ListChecks,
  Users,
  Flag,
  BarChart3,
  Calendar,
  History,
  User,
  CheckSquare,
  Rocket,
  UserPlus,
  CalendarCheck,
  Sun,
  Moon,
  Search as SearchIcon,
} from "lucide-react";
import { useDashboard, useSearch } from "@/lib/queries";
import { useState } from "react";
import { StatusBadge } from "./shared";
import { motion } from "framer-motion";

const NAV_ITEMS: { key: ViewKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "board", label: "Board", icon: KanbanSquare },
  { key: "tasks", label: "Tasks", icon: ListChecks },
  { key: "team", label: "Team", icon: Users },
  { key: "sprints", label: "Sprints", icon: Flag },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "calendar", label: "Calendar", icon: Calendar },
  { key: "history", label: "History", icon: History },
];

export function CommandPalette() {
  const {
    commandOpen,
    setCommandOpen,
    setView,
    setSelectedEmployeeId,
    setSelectedTaskId,
    setQuickAddTaskOpen,
    setQuickAddEmployeeOpen,
    setDailyUpdateOpen,
    toggleTheme,
    theme,
  } = useUI();
  const { data } = useDashboard();
  const [q, setQ] = useState("");
  const search = useSearch(q.length > 1 ? q : "");

  // Clear query when the palette closes (render-time state adjustment).
  const [prevOpen, setPrevOpen] = useState(commandOpen);
  if (commandOpen !== prevOpen) {
    setPrevOpen(commandOpen);
    if (!commandOpen) setQ("");
  }

  const go = (fn: () => void) => {
    fn();
    setCommandOpen(false);
  };

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput
        placeholder="Search tasks, people, sprints or jump to a view…"
        value={q}
        onValueChange={setQ}
      />
      <CommandList className="max-h-[460px]">
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick actions */}
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => go(() => setQuickAddTaskOpen(true))}>
            <CheckSquare className="mr-2 h-4 w-4 text-sprint-primary" />
            <span>Create new task</span>
          </CommandItem>
          <CommandItem onSelect={() => go(() => setQuickAddEmployeeOpen(true))}>
            <UserPlus className="mr-2 h-4 w-4 text-sprint-primary" />
            <span>Add team member</span>
          </CommandItem>
          <CommandItem onSelect={() => go(() => setDailyUpdateOpen(true))}>
            <CalendarCheck className="mr-2 h-4 w-4 text-sprint-primary" />
            <span>Log daily standup</span>
          </CommandItem>
          <CommandItem onSelect={() => go(toggleTheme)}>
            {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            <span>Switch to {theme === "dark" ? "light" : "dark"} mode</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigate">
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.key}
              value={`go ${item.label}`}
              onSelect={() => go(() => setView(item.key))}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>Go to {item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Search results */}
        {q.length > 1 && search.data && (
          <>
            {search.data.employees.length > 0 && (
              <CommandGroup heading="People">
                {search.data.employees.map((e) => (
                  <CommandItem
                    key={e.id}
                    value={`person ${e.name} ${e.email} ${e.role}`}
                    onSelect={() => go(() => setSelectedEmployeeId(e.id))}
                  >
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-1 items-center justify-between">
                      <span>{e.name}</span>
                      <span className="text-xs text-muted-foreground">{e.role} · {e.team}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {search.data.tasks.length > 0 && (
              <CommandGroup heading="Tasks">
                {search.data.tasks.map((t) => (
                  <CommandItem
                    key={t.id}
                    value={`task ${t.title} ${t.project} ${t.epic}`}
                    onSelect={() => go(() => { setSelectedTaskId(t.id); setView("tasks"); })}
                  >
                    <CheckSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-1 items-center justify-between gap-2">
                      <span className="truncate">{t.title}</span>
                      <StatusBadge status={t.status} />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {search.data.sprints.length > 0 && (
              <CommandGroup heading="Sprints">
                {search.data.sprints.map((s) => (
                  <CommandItem
                    key={s.id}
                    value={`sprint ${s.name}`}
                    onSelect={() => go(() => { useUI.getState().setSelectedSprintId(s.id); })}
                  >
                    <Rocket className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{s.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}

        {/* Defaults when no query */}
        {q.length <= 1 && data && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent tasks">
              {data.sprintTasks.slice(0, 6).map((t) => (
                <CommandItem
                  key={t.id}
                  value={`task ${t.title}`}
                  onSelect={() => go(() => { setSelectedTaskId(t.id); setView("tasks"); })}
                >
                  <CheckSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{t.title}</span>
                  <StatusBadge status={t.status} className="ml-auto" />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Team members">
              {data.employees.slice(0, 6).map((e) => (
                <CommandItem
                  key={e.id}
                  value={`person ${e.name}`}
                  onSelect={() => go(() => setSelectedEmployeeId(e.id))}
                >
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{e.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{e.role}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

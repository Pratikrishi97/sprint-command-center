"use client";

import { create } from "zustand";

export type ViewKey =
  | "dashboard"
  | "board"
  | "tasks"
  | "team"
  | "sprints"
  | "analytics"
  | "calendar"
  | "history";

interface Filters {
  employeeId: string | null;
  project: string | null;
  priority: string[];
  status: string[];
  team: string | null;
  risk: string | null;
  search: string;
}

interface UIState {
  view: ViewKey;
  setView: (v: ViewKey) => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;

  commandOpen: boolean;
  setCommandOpen: (v: boolean) => void;

  notifOpen: boolean;
  setNotifOpen: (v: boolean) => void;

  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;

  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;
  toggleTheme: () => void;

  selectedSprintId: string | null;
  setSelectedSprintId: (id: string | null) => void;

  selectedEmployeeId: string | null;
  setSelectedEmployeeId: (id: string | null) => void;

  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;

  quickAddTaskOpen: boolean;
  setQuickAddTaskOpen: (v: boolean) => void;

  quickAddEmployeeOpen: boolean;
  setQuickAddEmployeeOpen: (v: boolean) => void;

  dailyUpdateOpen: boolean;
  setDailyUpdateOpen: (v: boolean) => void;

  filters: Filters;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;

  savedView: string | null;
  setSavedView: (v: string | null) => void;
}

const defaultFilters: Filters = {
  employeeId: null,
  project: null,
  priority: [],
  status: [],
  team: null,
  risk: null,
  search: "",
};

function applyTheme(t: "dark" | "light") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", t === "dark");
  document.documentElement.classList.toggle("light", t === "light");
  try {
    localStorage.setItem("scc-theme", t);
  } catch {
    /* ignore */
  }
}

export const useUI = create<UIState>((set) => ({
  view: "dashboard",
  setView: (v) => set({ view: v }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  commandOpen: false,
  setCommandOpen: (v) => set({ commandOpen: v }),

  notifOpen: false,
  setNotifOpen: (v) => set({ notifOpen: v }),

  searchOpen: false,
  setSearchOpen: (v) => set({ searchOpen: v }),

  theme: "dark",
  setTheme: (t) => {
    applyTheme(t);
    set({ theme: t });
  },
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === "dark" ? "light" : "dark";
      applyTheme(next);
      return { theme: next };
    }),

  selectedSprintId: null,
  setSelectedSprintId: (id) => set({ selectedSprintId: id, view: "sprints" }),

  selectedEmployeeId: null,
  setSelectedEmployeeId: (id) => set({ selectedEmployeeId: id, view: "team" }),

  selectedTaskId: null,
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),

  quickAddTaskOpen: false,
  setQuickAddTaskOpen: (v) => set({ quickAddTaskOpen: v }),

  quickAddEmployeeOpen: false,
  setQuickAddEmployeeOpen: (v) => set({ quickAddEmployeeOpen: v }),

  dailyUpdateOpen: false,
  setDailyUpdateOpen: (v) => set({ dailyUpdateOpen: v }),

  filters: defaultFilters,
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: defaultFilters }),

  savedView: null,
  setSavedView: (v) => set({ savedView: v }),
}));

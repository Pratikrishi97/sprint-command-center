"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type Column,
  type SortingState,
} from "@tanstack/react-table";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  FilterX,
  ListFilter,
  ListChecks,
  CircleDashed,
  ChevronDown,
  User as UserIcon,
  FolderKanban,
  Users,
  AlertTriangle,
} from "lucide-react";
import { useDashboard, useUpdateTask } from "@/lib/queries";
import { useUI } from "@/stores/ui";
import { STATUSES, PRIORITIES, RISKS, PROJECTS, TEAMS } from "@/lib/const";
import { STATUS_META, PRIORITY_META, type TaskRaw, type EmployeeRaw } from "@/lib/types";
import { fmtDateShort, daysUntil } from "@/lib/sprint";
import {
  EmployeeAvatar,
  StatusBadge,
  PriorityBadge,
  RiskBadge,
} from "@/components/sprint/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type TaskRow = TaskRaw & { owner: EmployeeRaw | null };

const PAGE_SIZES = [10, 25, 50];

function isOverdue(t: TaskRow): boolean {
  if (t.status === "completed" || t.status === "released" || t.status === "cancelled") return false;
  return daysUntil(t.endDate) < 0;
}

function priorityRank(p: string): number {
  return ({ critical: 0, high: 1, medium: 2, low: 3 } as Record<string, number>)[p] ?? 4;
}

function toggleInArray(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function SortHeader({
  column,
  children,
  className,
}: {
  column: Column<TaskRow, unknown>;
  children: React.ReactNode;
  className?: string;
}) {
  const sorted = column.getIsSorted();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        column.toggleSorting(sorted === "asc");
      }}
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground",
        className
      )}
    >
      {children}
      {sorted === "asc" ? (
        <ArrowUp className="h-3 w-3 text-sprint-primary" />
      ) : sorted === "desc" ? (
        <ArrowDown className="h-3 w-3 text-sprint-primary" />
      ) : (
        <ChevronsUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <CircleDashed className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm font-medium text-foreground">
        {hasFilters ? "No tasks match your filters" : "No tasks in this sprint"}
      </p>
      <p className="max-w-sm text-[12px] text-muted-foreground/70">
        {hasFilters
          ? "Try adjusting your search or clearing filters to see more tasks."
          : "Add a task to get started."}
      </p>
    </div>
  );
}

export function TasksView() {
  const { data } = useDashboard();
  const update = useUpdateTask();
  const filters = useUI((s) => s.filters);
  const setFilter = useUI((s) => s.setFilter);
  const resetFilters = useUI((s) => s.resetFilters);
  const setSelectedTaskId = useUI((s) => s.setSelectedTaskId);
  const setQuickAddTaskOpen = useUI((s) => s.setQuickAddTaskOpen);

  const [sorting, setSorting] = React.useState<SortingState>([{ id: "endDate", desc: false }]);

  const allTasks: TaskRow[] = data?.sprintTasks ?? [];
  const sprint = data?.sprint;
  const employees = data?.employees ?? [];

  const filtered = React.useMemo(() => {
    return allTasks.filter((t) => {
      if (filters.employeeId && t.ownerId !== filters.employeeId) return false;
      if (filters.project && t.project !== filters.project) return false;
      if (filters.priority.length && !filters.priority.includes(t.priority)) return false;
      if (filters.status.length && !filters.status.includes(t.status)) return false;
      if (filters.team && t.owner?.team !== filters.team) return false;
      if (filters.risk && t.riskLevel !== filters.risk) return false;
      if (filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        const hay =
          `${t.title} ${t.epic || ""} ${t.project || ""} ${t.tags?.join(" ") || ""} ${t.remarks || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allTasks, filters]);

  const columns = React.useMemo<ColumnDef<TaskRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => <SortHeader column={column}>Task</SortHeader>,
        cell: ({ row }) => {
          const t = row.original;
          const pm = PRIORITY_META[t.priority];
          return (
            <div className="flex items-start gap-2.5">
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", pm.dot)} />
              <div className="min-w-0">
                <p className="line-clamp-2 break-words text-[13px] font-medium leading-snug text-foreground">
                  {t.title}
                </p>
                {(t.epic || t.project || t.story) && (
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground/70">
                    {[t.epic, t.project, t.story].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>
          );
        },
        enableSorting: true,
      },
      {
        id: "owner",
        accessorFn: (t) => t.owner?.name ?? "~",
        header: ({ column }) => <SortHeader column={column}>Owner</SortHeader>,
        cell: ({ row }) => {
          const t = row.original;
          if (!t.owner) {
            return (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground/70">
                <span className="h-7 w-7 rounded-full border border-dashed border-border/80" />
                Unassigned
              </span>
            );
          }
          return (
            <div className="flex items-center gap-2">
              <EmployeeAvatar employee={t.owner} size="sm" ring={false} />
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-foreground">{t.owner.name}</p>
                <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground/70">
                  {t.owner.team}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => <SortHeader column={column}>Status</SortHeader>,
        cell: ({ row }) => {
          const t = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 rounded-md outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <StatusBadge status={t.status} />
                  <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Change status
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {STATUSES.map((s) => {
                  const isActive = t.status === s.value;
                  return (
                    <DropdownMenuItem
                      key={s.value}
                      onSelect={() => {
                        const body: Partial<TaskRaw> = { status: s.value };
                        if (s.value === "completed" || s.value === "released") body.progress = 100;
                        update.mutate({ id: t.id, body });
                      }}
                      className={cn(isActive && "bg-accent/60")}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full bg-current",
                          STATUS_META[s.value].text
                        )}
                      />
                      {s.label}
                      {isActive && (
                        <span className="ml-auto text-[10px] font-semibold text-sprint-primary">
                          current
                        </span>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
      {
        accessorKey: "priority",
        header: ({ column }) => <SortHeader column={column}>Priority</SortHeader>,
        sortingFn: (rowA, rowB) =>
          priorityRank(rowA.original.priority) - priorityRank(rowB.original.priority),
        cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
      },
      {
        accessorKey: "riskLevel",
        header: ({ column }) => <SortHeader column={column}>Risk</SortHeader>,
        cell: ({ row }) => <RiskBadge risk={row.original.riskLevel} />,
      },
      {
        accessorKey: "project",
        header: ({ column }) => <SortHeader column={column}>Project</SortHeader>,
        cell: ({ row }) => (
          <span className="text-[12px] font-medium text-foreground/90">
            {row.original.project}
          </span>
        ),
      },
      {
        accessorKey: "estimate",
        header: ({ column }) => (
          <SortHeader column={column} className="tabular-nums">
            Pts
          </SortHeader>
        ),
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-md bg-muted/60 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
            {row.original.estimate}
          </span>
        ),
      },
      {
        accessorKey: "progress",
        header: ({ column }) => <SortHeader column={column}>Progress</SortHeader>,
        cell: ({ row }) => {
          const t = row.original;
          return (
            <div className="flex items-center gap-2">
              <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-muted/60 sm:block">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    t.progress >= 100
                      ? "bg-emerald-500"
                      : t.progress >= 60
                        ? "bg-sky-500"
                        : t.progress >= 30
                          ? "bg-amber-500"
                          : "bg-red-500"
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, t.progress))}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                {t.progress}%
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "endDate",
        header: ({ column }) => <SortHeader column={column}>Due</SortHeader>,
        cell: ({ row }) => {
          const t = row.original;
          const overdue = isOverdue(t);
          const days = daysUntil(t.endDate);
          return (
            <div className="flex flex-col">
              <span
                className={cn(
                  "text-[12px] font-medium",
                  overdue ? "text-red-400" : "text-foreground/90"
                )}
              >
                {fmtDateShort(t.endDate)}
              </span>
              {overdue ? (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-red-400">
                  {Math.abs(days)}d overdue
                </span>
              ) : days >= 0 && days <= 3 ? (
                <span className="text-[10px] uppercase tracking-wide text-amber-300">
                  in {days}d
                </span>
              ) : (
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground/60">
                  in {days}d
                </span>
              )}
            </div>
          );
        },
      },
    ],
    [update]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25, pageIndex: 0 } },
  });

  // Reset to first page whenever filters change so the user doesn't see an empty page.
  React.useEffect(() => {
    table.setPageIndex(0);
  }, [filters, table]);

  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = filtered.length;
  const startIdx = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endIdx = Math.min((pageIndex + 1) * pageSize, totalRows);
  const pageCount = Math.max(1, table.getPageCount());

  const activeCount =
    (filters.search.trim() ? 1 : 0) +
    (filters.employeeId ? 1 : 0) +
    (filters.project ? 1 : 0) +
    (filters.team ? 1 : 0) +
    (filters.risk ? 1 : 0) +
    filters.priority.length +
    filters.status.length;

  const hasFilters = activeCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex h-full flex-col gap-4"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card/40 px-3">
            <ListChecks className="h-4 w-4 text-sprint-primary" />
            <span className="truncate text-[13px] font-semibold text-foreground">
              {sprint ? `Sprint ${sprint.number} — ${sprint.name}` : "Sprint Tasks"}
            </span>
          </div>
          <span className="hidden text-[11px] font-medium tabular-nums text-muted-foreground lg:inline">
            {hasFilters ? `${totalRows}/${allTasks.length} tasks` : `${allTasks.length} tasks`}
          </span>
        </div>
        <Button
          size="sm"
          onClick={() => setQuickAddTaskOpen(true)}
          className="bg-sprint-primary text-sprint-primary-foreground hover:bg-sprint-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add task
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/40 p-2.5">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            placeholder="Search title, epic, project, tags…"
            className="h-9 border-border/60 bg-background/40 pl-8"
          />
        </div>

        {/* Status multi-select */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 border-border/60 bg-background/40"
            >
              <ListFilter className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[12px]">Status</span>
              {filters.status.length > 0 && (
                <Badge className="h-4 min-w-4 px-1 text-[10px] font-semibold bg-sprint-primary text-sprint-primary-foreground">
                  {filters.status.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Filter by status
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {STATUSES.map((s) => (
              <DropdownMenuCheckboxItem
                key={s.value}
                checked={filters.status.includes(s.value)}
                onCheckedChange={() =>
                  setFilter("status", toggleInArray(filters.status, s.value))
                }
                onSelect={(e) => e.preventDefault()}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full bg-current",
                    STATUS_META[s.value].text
                  )}
                />
                <span className="ml-1">{s.label}</span>
              </DropdownMenuCheckboxItem>
            ))}
            {filters.status.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setFilter("status", [])}
                  className="text-[12px] text-muted-foreground"
                >
                  <FilterX className="h-3.5 w-3.5" />
                  Clear status
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Priority multi-select */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 border-border/60 bg-background/40"
            >
              <ListFilter className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[12px]">Priority</span>
              {filters.priority.length > 0 && (
                <Badge className="h-4 min-w-4 px-1 text-[10px] font-semibold bg-sprint-primary text-sprint-primary-foreground">
                  {filters.priority.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Filter by priority
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {PRIORITIES.map((p) => (
              <DropdownMenuCheckboxItem
                key={p.value}
                checked={filters.priority.includes(p.value)}
                onCheckedChange={() =>
                  setFilter("priority", toggleInArray(filters.priority, p.value))
                }
                onSelect={(e) => e.preventDefault()}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_META[p.value].dot)} />
                <span className="ml-1">{p.label}</span>
              </DropdownMenuCheckboxItem>
            ))}
            {filters.priority.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setFilter("priority", [])}
                  className="text-[12px] text-muted-foreground"
                >
                  <FilterX className="h-3.5 w-3.5" />
                  Clear priority
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Owner select */}
        <Select
          value={filters.employeeId ?? "__all__"}
          onValueChange={(v) => setFilter("employeeId", v === "__all__" ? null : v)}
        >
          <SelectTrigger size="sm" className="h-9 w-[150px] gap-1.5 border-border/60 bg-background/40">
            <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="Owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All owners</SelectItem>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Project select */}
        <Select
          value={filters.project ?? "__all__"}
          onValueChange={(v) => setFilter("project", v === "__all__" ? null : v)}
        >
          <SelectTrigger size="sm" className="h-9 w-[140px] gap-1.5 border-border/60 bg-background/40">
            <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All projects</SelectItem>
            {PROJECTS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Team select */}
        <Select
          value={filters.team ?? "__all__"}
          onValueChange={(v) => setFilter("team", v === "__all__" ? null : v)}
        >
          <SelectTrigger size="sm" className="h-9 w-[130px] gap-1.5 border-border/60 bg-background/40">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="Team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All teams</SelectItem>
            {TEAMS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Risk select */}
        <Select
          value={filters.risk ?? "__all__"}
          onValueChange={(v) => setFilter("risk", v === "__all__" ? null : v)}
        >
          <SelectTrigger size="sm" className="h-9 w-[130px] gap-1.5 border-border/60 bg-background/40">
            <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="Risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All risks</SelectItem>
            {RISKS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <FilterX className="h-3.5 w-3.5" />
            Reset
            <Badge className="h-4 min-w-4 px-1 text-[10px] font-semibold bg-sprint-primary text-sprint-primary-foreground">
              {activeCount}
            </Badge>
          </Button>
        )}
      </div>

      {/* Table card */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card/40">
        <div className="min-h-0 min-w-0 flex-1 overflow-auto scrollbar-thin">
          <Table className="w-full border-collapse">
            <TableHeader className="sticky top-0 z-10">
              {table.getHeaderGroups().map((hg) => (
                <TableRow
                  key={hg.id}
                  className="border-border/60 bg-card/95 backdrop-blur hover:bg-transparent"
                >
                  {hg.headers.map((h) => (
                    <TableHead key={h.id} className="h-11 px-3 text-left align-middle">
                      {h.isPlaceholder
                        ? null
                        : flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columns.length} className="p-0">
                    <EmptyState hasFilters={hasFilters} />
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row, idx) => (
                  <TableRow
                    key={row.id}
                    onClick={() => setSelectedTaskId(row.original.id)}
                    className={cn(
                      "cursor-pointer border-border/50 transition-colors",
                      idx % 2 === 1 ? "bg-muted/20" : "bg-transparent",
                      "hover:bg-sprint-primary/10"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-3 py-2.5 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card/60 px-3 py-2.5">
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span>Rows</span>
            <Select value={String(pageSize)} onValueChange={(v) => table.setPageSize(Number(v))}>
              <SelectTrigger size="sm" className="h-7 w-[72px] gap-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="ml-2">
              Showing{" "}
              <span className="font-semibold tabular-nums text-foreground">{startIdx}</span>
              {"–"}
              <span className="font-semibold tabular-nums text-foreground">{endIdx}</span> of{" "}
              <span className="font-semibold tabular-nums text-foreground">{totalRows}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </Button>
            <span className="px-1.5 text-[12px] tabular-nums text-muted-foreground">
              Page {pageIndex + 1} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default TasksView;

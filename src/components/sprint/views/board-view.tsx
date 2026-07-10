"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
  defaultDropAnimation,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Plus, LayoutGrid, GripVertical, CircleDashed } from "lucide-react";
import { useDashboard, useUpdateTask } from "@/lib/queries";
import { useUI } from "@/stores/ui";
import { BOARD_COLUMNS } from "@/lib/const";
import { STATUS_META, type TaskStatus, type TaskRaw, type EmployeeRaw } from "@/lib/types";
import { EmployeeAvatar, PriorityBadge, RiskBadge } from "@/components/sprint/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BoardTask = TaskRaw & { owner: EmployeeRaw | null };

const RISK_BORDER: Record<string, string> = {
  high: "border-l-2 border-l-orange-500/70",
  critical: "border-l-2 border-l-red-500/70",
};

function progressColor(p: number) {
  if (p >= 100) return "bg-emerald-500";
  if (p >= 60) return "bg-sky-500";
  if (p >= 30) return "bg-amber-500";
  return "bg-red-500";
}

function EmptyColumn() {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 px-3 py-10 text-center">
      <CircleDashed className="h-5 w-5 text-muted-foreground/40" />
      <p className="text-[11px] text-muted-foreground/60">Drop tasks here</p>
    </div>
  );
}

function BoardCard({ task }: { task: BoardTask }) {
  const showRisk = task.riskLevel === "high" || task.riskLevel === "critical";
  const riskBorder = RISK_BORDER[task.riskLevel];
  const owner = task.owner;

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-card/40 p-3 shadow-sm transition-all",
        "hover:border-sprint-primary/40 hover:bg-card/60 hover:shadow-md",
        riskBorder
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 break-words text-[13px] font-medium leading-snug text-foreground">
            {task.title}
          </p>
          {(task.epic || task.project) && (
            <p className="mt-0.5 truncate text-[10px] uppercase tracking-wide text-muted-foreground/70">
              {task.epic ? task.epic : task.project}
            </p>
          )}
        </div>
        {showRisk && <RiskBadge risk={task.riskLevel} />}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <PriorityBadge priority={task.priority} />
          <span className="inline-flex items-center gap-0.5 rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
            {task.estimate}pt
          </span>
        </div>
        {owner ? (
          <EmployeeAvatar employee={owner} size="xs" ring={false} />
        ) : (
          <span
            className="h-6 w-6 rounded-full border border-dashed border-border/80"
            title="Unassigned"
          />
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted/60">
          <div
            className={cn("h-full rounded-full transition-all", progressColor(task.progress))}
            style={{ width: `${Math.min(100, Math.max(0, task.progress))}%` }}
          />
        </div>
        <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
          {task.progress}%
        </span>
      </div>
    </div>
  );
}

function SortableBoardCard({
  task,
  onOpen,
}: {
  task: BoardTask;
  onOpen: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task.id)}
      className="touch-none cursor-grab active:cursor-grabbing"
    >
      <div className="relative">
        <GripVertical className="absolute -left-0.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/40" />
        <BoardCard task={task} />
      </div>
    </div>
  );
}

function BoardColumn({
  status,
  tasks,
  onOpen,
}: {
  status: TaskStatus;
  tasks: BoardTask[];
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = STATUS_META[status];
  const totalEstimate = tasks.reduce((s, t) => s + (t.estimate || 0), 0);

  return (
    <div className="flex w-full flex-col gap-2.5 sm:h-[calc(100vh-220px)] sm:w-80 sm:shrink-0">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 rounded-lg border border-border bg-card/80 px-3 py-2 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full bg-current", meta.text)} />
          <span className="truncate text-[13px] font-semibold text-foreground">
            {meta.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {totalEstimate > 0 && (
            <span className="hidden text-[10px] font-medium tabular-nums text-muted-foreground/70 sm:inline">
              {totalEstimate}pt
            </span>
          )}
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted/80 px-1.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
            {tasks.length}
          </span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[120px] flex-col gap-2 rounded-lg border p-2 transition-colors sm:flex-1 sm:overflow-y-auto scrollbar-thin",
          isOver
            ? "border-sprint-primary/50 bg-sprint-primary/5"
            : "border-border/60 bg-card/20"
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <EmptyColumn />
          ) : (
            tasks.map((t) => (
              <SortableBoardCard key={t.id} task={t} onOpen={onOpen} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export function BoardView() {
  const { data } = useDashboard();
  const update = useUpdateTask();
  const filters = useUI((s) => s.filters);
  const setQuickAddTaskOpen = useUI((s) => s.setQuickAddTaskOpen);
  const setSelectedTaskId = useUI((s) => s.setSelectedTaskId);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const allTasks: BoardTask[] = data?.sprintTasks ?? [];
  const sprint = data?.sprint;

  const filtered = React.useMemo(() => {
    return allTasks.filter((t) => {
      if (filters.employeeId && t.ownerId !== filters.employeeId) return false;
      if (filters.project && t.project !== filters.project) return false;
      if (filters.priority.length && !filters.priority.includes(t.priority)) return false;
      if (filters.status.length && !filters.status.includes(t.status)) return false;
      if (filters.team && t.owner?.team !== filters.team) return false;
      if (filters.risk && t.riskLevel !== filters.risk) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hay = `${t.title} ${t.epic || ""} ${t.project || ""} ${t.tags?.join(" ") || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allTasks, filters]);

  const grouped = React.useMemo(() => {
    const map = {} as Record<TaskStatus, BoardTask[]>;
    for (const col of BOARD_COLUMNS) map[col] = [];
    for (const t of filtered) {
      if (map[t.status]) map[t.status].push(t);
    }
    return map;
  }, [filtered]);

  const taskById = React.useMemo(() => {
    const m: Record<string, BoardTask> = {};
    for (const t of allTasks) m[t.id] = t;
    return m;
  }, [allTasks]);

  const openTask = React.useCallback(
    (id: string) => {
      setSelectedTaskId(id);
    },
    [setSelectedTaskId]
  );

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    const task = taskById[activeIdStr];
    if (!task) return;

    // Determine target status: either a column droppable (status string)
    // or a card whose status we can look up.
    let targetStatus: TaskStatus | null = null;
    if ((BOARD_COLUMNS as string[]).includes(overIdStr)) {
      targetStatus = overIdStr as TaskStatus;
    } else {
      const overTask = taskById[overIdStr];
      if (overTask) targetStatus = overTask.status;
    }
    if (!targetStatus) return;
    if (targetStatus === task.status) return;

    const body: Partial<TaskRaw> = { status: targetStatus };
    if (targetStatus === "completed" || targetStatus === "released") {
      body.progress = 100;
    }
    update.mutate({ id: task.id, body });
  };

  const activeTask = activeId ? taskById[activeId] : null;

  const totalShown = filtered.length;
  const totalAll = allTasks.length;
  const hasFilters =
    !!filters.employeeId ||
    !!filters.project ||
    !!filters.team ||
    !!filters.risk ||
    filters.priority.length > 0 ||
    filters.status.length > 0 ||
    !!filters.search;

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
            <LayoutGrid className="h-4 w-4 text-sprint-primary" />
            <span className="truncate text-[13px] font-semibold text-foreground">
              {sprint ? `Sprint ${sprint.number} — ${sprint.name}` : "Sprint Board"}
            </span>
          </div>
          <div className="hidden items-center gap-3 text-[11px] text-muted-foreground lg:flex">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-sprint-primary" />
              Drag cards between columns to update status
            </span>
            <span className="text-muted-foreground/50">·</span>
            <span>Click a card for details</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
            {hasFilters ? `${totalShown}/${totalAll} tasks` : `${totalAll} tasks`}
          </span>
          <Button
            size="sm"
            onClick={() => setQuickAddTaskOpen(true)}
            className="bg-sprint-primary text-sprint-primary-foreground hover:bg-sprint-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add task
          </Button>
        </div>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex flex-col gap-3 pb-2 sm:overflow-x-auto scrollbar-thin">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            {BOARD_COLUMNS.map((status) => (
              <BoardColumn
                key={status}
                status={status}
                tasks={grouped[status] ?? []}
                onOpen={openTask}
              />
            ))}
          </div>
        </div>
        <DragOverlay dropAnimation={defaultDropAnimation}>
          {activeTask ? (
            <div className="w-72 rotate-2 cursor-grabbing opacity-95 shadow-2xl shadow-sprint-primary/10">
              <BoardCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </motion.div>
  );
}

export default BoardView;

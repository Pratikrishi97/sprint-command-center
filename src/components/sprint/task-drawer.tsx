"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useUI } from "@/stores/ui";
import { useDashboard, useUpdateTask, useDeleteTask } from "@/lib/queries";
import { STATUSES, PRIORITIES, RISKS, SEVERITIES, PROJECTS, CATEGORIES } from "@/lib/const";
import { EmployeeAvatar, StatusBadge, PriorityBadge, RiskBadge, ProgressRing } from "./shared";
import type { TaskStatus, Priority, RiskLevel, Severity } from "@/lib/types";
import { format, differenceInCalendarDays } from "date-fns";
import {
  Trash2,
  GitBranch,
  ExternalLink,
  Figma,
  FileText,
  Calendar,
  Clock,
  AlertCircle,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const LINK_ICONS: Record<string, typeof GitBranch> = {
  github: GitBranch,
  jira: ExternalLink,
  figma: Figma,
  prd: FileText,
  doc: FileText,
  other: Link2,
};

export function TaskDrawer() {
  const { selectedTaskId, setSelectedTaskId } = useUI();
  const { data } = useDashboard();
  const update = useUpdateTask();
  const del = useDeleteTask();

  const task = data?.sprintTasks.find((t) => t.id === selectedTaskId) ?? null;

  const open = !!selectedTaskId && !!task;

  const patch = (body: Record<string, unknown>) => {
    if (!task) return;
    update.mutate({ id: task.id, body });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && setSelectedTaskId(null)}>
      <SheetContent className="w-full gap-0 overflow-hidden border-border bg-background p-0 sm:max-w-lg">
        {task && (
          <>
            <SheetHeader className="border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                <RiskBadge risk={task.riskLevel} />
              </div>
              <SheetTitle className="text-lg leading-tight">{task.title}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 text-xs">
                <span>{task.project}</span>
                {task.epic && (<><span>·</span><span>{task.epic}</span></>)}
                {task.story && (<><span>·</span><span className="font-mono">{task.story}</span></>)}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-5 overflow-y-auto scrollbar-thin p-5">
              {/* Owner + dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Owner</Label>
                  <Select value={task.ownerId ?? "__none__"} onValueChange={(v) => patch({ ownerId: v === "__none__" ? null : v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Unassigned</SelectItem>
                      {data?.employees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">End date</Label>
                  <Input type="date" value={task.endDate} onChange={(e) => patch({ endDate: e.target.value })} className="h-9" />
                </div>
              </div>

              {/* Progress */}
              <div className="rounded-xl border border-border bg-card/40 p-4">
                <div className="flex items-center gap-4">
                  <ProgressRing value={task.progress} size={56} stroke={5} />
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <Label className="text-xs">Progress</Label>
                      <span className="text-xs font-semibold">{task.progress}%</span>
                    </div>
                    <Slider
                      value={[task.progress]}
                      min={0}
                      max={100}
                      step={5}
                      onValueChange={(v) => patch({ progress: v[0] })}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{task.estimate} pts estimate</span>
                  {task.endDate && (
                    <span className={differenceInCalendarDays(new Date(task.endDate), new Date()) < 0 ? "text-red-400" : ""}>
                      <Clock className="mr-1 inline h-3 w-3" />
                      {differenceInCalendarDays(new Date(task.endDate), new Date()) === 0
                        ? "Due today"
                        : differenceInCalendarDays(new Date(task.endDate), new Date()) > 0
                        ? `${differenceInCalendarDays(new Date(task.endDate), new Date())} days left`
                        : `${Math.abs(differenceInCalendarDays(new Date(task.endDate), new Date()))} days overdue`}
                    </span>
                  )}
                </div>
              </div>

              {/* Status / priority / risk / severity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={task.status} onValueChange={(v) => patch({ status: v as TaskStatus, progress: v === "completed" || v === "released" ? 100 : task.progress })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Priority</Label>
                  <Select value={task.priority} onValueChange={(v) => patch({ priority: v as Priority })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Risk</Label>
                  <Select value={task.riskLevel} onValueChange={(v) => patch({ riskLevel: v as RiskLevel })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RISKS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Severity</Label>
                  <Select value={task.severity} onValueChange={(v) => patch({ severity: v as Severity })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SEVERITIES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Project</Label>
                  <Select value={task.project} onValueChange={(v) => patch({ project: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROJECTS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <Select value={task.category} onValueChange={(v) => patch({ category: v })}>
                    <SelectTrigger className="h-9 capitalize"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Epic</Label>
                  <Input value={task.epic} onChange={(e) => patch({ epic: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Estimate (pts)</Label>
                  <Input type="number" value={task.estimate} onChange={(e) => patch({ estimate: Number(e.target.value) })} className="h-9" />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea rows={3} value={task.description} onChange={(e) => patch({ description: e.target.value })} />
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Remarks</Label>
                <Textarea rows={2} value={task.remarks} onChange={(e) => patch({ remarks: e.target.value })} placeholder="Notes, context, flags…" />
              </div>

              {/* Tags */}
              {task.tags.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Tags</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {task.tags.map((tag) => (
                      <span key={tag} className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">#{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dependencies */}
              {task.dependencies.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Dependencies</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {task.dependencies.map((d) => (
                      <span key={d} className="rounded-md border border-border px-2 py-0.5 text-[11px] font-mono">{d}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              {task.links.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Links</Label>
                  <div className="space-y-1.5">
                    {task.links.map((l, i) => {
                      const Icon = LINK_ICONS[l.type] ?? Link2;
                      return (
                        <a
                          key={i}
                          href={l.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-2 text-sm transition hover:border-sprint-primary/40 hover:bg-accent"
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1 truncate">{l.label}</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dates grid */}
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card/40 p-3 text-xs">
                <div><span className="text-muted-foreground">Start:</span> {task.startDate ? format(new Date(task.startDate), "MMM d") : "—"}</div>
                <div><span className="text-muted-foreground">End:</span> {task.endDate ? format(new Date(task.endDate), "MMM d") : "—"}</div>
                <div><span className="text-muted-foreground">Expected:</span> {task.expectedCompletion ? format(new Date(task.expectedCompletion), "MMM d") : "—"}</div>
                <div><span className="text-muted-foreground">Actual:</span> {task.actualCompletion ? format(new Date(task.actualCompletion), "MMM d") : "—"}</div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:bg-red-500/10 hover:text-red-400"
                onClick={() => {
                  del.mutate(task.id, { onSuccess: () => { setSelectedTaskId(null); } });
                }}
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Delete
              </Button>
              <div className="text-[11px] text-muted-foreground">
                {task.owner && (
                  <span className="flex items-center gap-1.5">
                    Owned by <EmployeeAvatar employee={task.owner} size="xs" ring={false} /> {task.owner.name}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

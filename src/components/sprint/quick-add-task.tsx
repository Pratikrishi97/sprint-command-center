"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUI } from "@/stores/ui";
import { useCreateTask, useDashboard } from "@/lib/queries";
import { PRIORITIES, STATUSES } from "@/lib/const";
import type { Priority, TaskStatus } from "@/lib/types";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const PROJECTS = ["Atlas API", "Orbit Web", "Insights", "Billing", "Mobile", "Infra"];
const CATEGORIES = ["feature", "bug", "chore", "research", "infra", "design"];

export function QuickAddTask() {
  const { quickAddTaskOpen, setQuickAddTaskOpen } = useUI();
  const { data } = useDashboard();
  const create = useCreateTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState<string>("__none__");
  const [priority, setPriority] = useState<Priority>("medium");
  const [status, setStatus] = useState<TaskStatus>("not_started");
  const [project, setProject] = useState(PROJECTS[0]);
  const [category, setCategory] = useState("feature");
  const [estimate, setEstimate] = useState("3");
  const [epic, setEpic] = useState("");

  // Reset form when the dialog opens (render-time state adjustment).
  const [prevOpen, setPrevOpen] = useState(quickAddTaskOpen);
  if (quickAddTaskOpen !== prevOpen) {
    setPrevOpen(quickAddTaskOpen);
    if (quickAddTaskOpen) {
      setTitle("");
      setDescription("");
      setOwnerId("__none__");
      setPriority("medium");
      setStatus("not_started");
      setProject(PROJECTS[0]);
      setCategory("feature");
      setEstimate("3");
      setEpic("");
    }
  }

  const submit = () => {
    if (!title.trim()) return;
    create.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        ownerId: ownerId === "__none__" ? null : ownerId,
        priority,
        status,
        project,
        category,
        epic: epic.trim(),
        estimate: Number(estimate) || 0,
        sprintId: data?.sprint.id,
        progress: status === "completed" ? 100 : 0,
      },
      { onSuccess: () => setQuickAddTaskOpen(false) }
    );
  };

  return (
    <Dialog open={quickAddTaskOpen} onOpenChange={setQuickAddTaskOpen}>
      <DialogContent className="max-w-lg gap-0 border-border bg-popover p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle>Create task</DialogTitle>
          <DialogDescription>Add a new task to the current sprint</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto scrollbar-thin p-5">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              autoFocus
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              placeholder="Add context, acceptance criteria, links…"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Owner</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Unassigned</SelectItem>
                  {data?.employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select value={project} onValueChange={setProject}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECTS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Estimate (pts)</Label>
              <Input type="number" min={0} value={estimate} onChange={(e) => setEstimate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="epic">Epic</Label>
            <Input id="epic" placeholder="e.g. Auth Rewrite" value={epic} onChange={(e) => setEpic(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="border-t border-border px-5 py-3">
          <div className="mr-auto hidden text-[11px] text-muted-foreground sm:block">
            <kbd className="rounded bg-muted px-1 py-0.5">⌘</kbd> + <kbd className="rounded bg-muted px-1 py-0.5">↵</kbd> to create
          </div>
          <Button variant="ghost" onClick={() => setQuickAddTaskOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!title.trim() || create.isPending} className="bg-sprint-primary text-sprint-primary-foreground hover:bg-sprint-primary/90">
            {create.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Create task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

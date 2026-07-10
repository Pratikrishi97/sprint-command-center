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
import { useCreateDailyUpdate, useDashboard } from "@/lib/queries";
import { CONFIDENCES, MOODS } from "@/lib/const";
import type { Confidence, Mood } from "@/lib/types";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export function DailyUpdateDialog() {
  const { dailyUpdateOpen, setDailyUpdateOpen } = useUI();
  const { data } = useDashboard();
  const create = useCreateDailyUpdate();

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [employeeId, setEmployeeId] = useState<string>("__none__");
  const [taskId, setTaskId] = useState<string>("__none__");
  const [todayProgress, setTodayProgress] = useState("");
  const [tomorrowPlan, setTomorrowPlan] = useState("");
  const [blockers, setBlockers] = useState("");
  const [percentage, setPercentage] = useState("0");
  const [hours, setHours] = useState("8");
  const [confidence, setConfidence] = useState<Confidence>("medium");
  const [mood, setMood] = useState<Mood>("good");

  const [prevOpen, setPrevOpen] = useState(dailyUpdateOpen);
  if (dailyUpdateOpen !== prevOpen) {
    setPrevOpen(dailyUpdateOpen);
    if (dailyUpdateOpen) {
      setEmployeeId("__none__");
      setTaskId("__none__");
      setTodayProgress("");
      setTomorrowPlan("");
      setBlockers("");
      setPercentage("0");
      setHours("8");
      setConfidence("medium");
      setMood("good");
    }
  }

  const tasksForEmployee = data?.sprintTasks.filter((t) => t.ownerId === employeeId) ?? [];

  const submit = () => {
    create.mutate(
      {
        employeeId: employeeId === "__none__" ? "" : employeeId,
        taskId: taskId === "__none__" ? null : taskId,
        sprintId: data?.sprint.id,
        date: todayStr,
        todayProgress: todayProgress.trim(),
        tomorrowPlan: tomorrowPlan.trim(),
        blockers: blockers.trim(),
        percentage: Number(percentage) || 0,
        hoursWorked: Number(hours) || 0,
        confidence,
        mood,
        accomplishments: todayProgress.trim(),
      },
      { onSuccess: () => setDailyUpdateOpen(false) }
    );
  };

  return (
    <Dialog open={dailyUpdateOpen} onOpenChange={setDailyUpdateOpen}>
      <DialogContent className="max-h-[90vh] max-w-lg gap-0 overflow-hidden border-border bg-popover p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle>Daily standup</DialogTitle>
          <DialogDescription>
            Log progress for {format(new Date(), "EEEE, MMM d")}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto scrollbar-thin p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Team member</Label>
              <Select value={employeeId} onValueChange={(v) => { setEmployeeId(v); setTaskId("__none__"); }}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {data?.employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Task</Label>
              <Select value={taskId} onValueChange={setTaskId} disabled={employeeId === "__none__"}>
                <SelectTrigger><SelectValue placeholder="Select task" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No specific task</SelectItem>
                  {tasksForEmployee.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="truncate">{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>What did you do today?</Label>
            <Textarea rows={2} placeholder="Shipped the token rotation endpoint…" value={todayProgress} onChange={(e) => setTodayProgress(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>What's the plan for tomorrow?</Label>
            <Textarea rows={2} placeholder="Pair on the Redis cutover…" value={tomorrowPlan} onChange={(e) => setTomorrowPlan(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Any blockers?</Label>
            <Textarea rows={2} placeholder="Waiting on DevOps to provision…" value={blockers} onChange={(e) => setBlockers(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>% complete</Label>
              <Input type="number" min={0} max={100} value={percentage} onChange={(e) => setPercentage(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Hours worked</Label>
              <Input type="number" min={0} max={16} step={0.5} value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Confidence</Label>
              <Select value={confidence} onValueChange={(v) => setConfidence(v as Confidence)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONFIDENCES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Mood</Label>
              <div className="flex gap-1.5">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMood(m.value)}
                    className={cn(
                      "flex h-9 flex-1 items-center justify-center rounded-lg border text-lg transition",
                      mood === m.value ? "border-sprint-primary bg-sprint-primary/10" : "border-border hover:bg-accent"
                    )}
                    title={m.label}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="border-t border-border px-5 py-3">
          <Button variant="ghost" onClick={() => setDailyUpdateOpen(false)}>Cancel</Button>
          <Button
            onClick={submit}
            disabled={employeeId === "__none__" || create.isPending}
            className="bg-sprint-primary text-sprint-primary-foreground hover:bg-sprint-primary/90"
          >
            {create.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save standup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUI } from "@/stores/ui";
import { useCreateEmployee, useDashboard } from "@/lib/queries";
import { TEAMS, EMPLOYEE_COLOR_OPTIONS } from "@/lib/const";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { employeeColor } from "@/lib/types";

const ROLES = [
  "Engineering Manager",
  "Staff Engineer",
  "Senior Engineer",
  "Engineer",
  "Tech Lead",
  "Product Designer",
  "QA Engineer",
  "Data Analyst",
  "Product Manager",
];

export function QuickAddEmployee() {
  const { quickAddEmployeeOpen, setQuickAddEmployeeOpen } = useUI();
  const { data } = useDashboard();
  const create = useCreateEmployee();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(ROLES[3]);
  const [team, setTeam] = useState(TEAMS[0]);
  const [color, setColor] = useState("emerald");
  const [capacity, setCapacity] = useState("40");
  const [managerId, setManagerId] = useState<string>("__none__");

  const [prevOpen, setPrevOpen] = useState(quickAddEmployeeOpen);
  if (quickAddEmployeeOpen !== prevOpen) {
    setPrevOpen(quickAddEmployeeOpen);
    if (quickAddEmployeeOpen) {
      setName("");
      setEmail("");
      setRole(ROLES[3]);
      setTeam(TEAMS[0]);
      setColor("emerald");
      setCapacity("40");
      setManagerId("__none__");
    }
  }

  const submit = () => {
    if (!name.trim()) return;
    create.mutate(
      {
        name: name.trim(),
        email: email.trim() || `${name.trim().toLowerCase().replace(/\s/g, ".")}@orbit.dev`,
        role,
        team,
        color,
        capacity: Number(capacity) || 40,
        managerId: managerId === "__none__" ? null : managerId,
        status: "active",
        joinedAt: new Date().toISOString().slice(0, 10),
        skills: [],
        workingDays: [1, 2, 3, 4, 5],
        leaves: [],
        projects: [team],
        availability: 100,
        timezone: "Asia/Calcutta",
      },
      { onSuccess: () => setQuickAddEmployeeOpen(false) }
    );
  };

  return (
    <Dialog open={quickAddEmployeeOpen} onOpenChange={setQuickAddEmployeeOpen}>
      <DialogContent className="max-w-md gap-0 border-border bg-popover p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle>Add team member</DialogTitle>
          <DialogDescription>Create a new employee profile</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br text-sm font-semibold text-white",
                employeeColor(color).gradient
              )}
            >
              {name ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "?"}
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" autoFocus placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="jane@orbit.dev" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Team</Label>
              <Select value={team} onValueChange={setTeam}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEAMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Capacity (h/wk)</Label>
              <Input type="number" min={0} max={60} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Manager</Label>
              <Select value={managerId} onValueChange={setManagerId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No manager</SelectItem>
                  {data?.employees
                    .filter((e) => e.role.includes("Manager") || e.role.includes("Lead"))
                    .map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {EMPLOYEE_COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-8 w-8 rounded-full bg-gradient-to-br ring-2 ring-offset-2 ring-offset-background transition",
                    employeeColor(c).gradient,
                    color === c ? "ring-white scale-110" : "ring-transparent"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="border-t border-border px-5 py-3">
          <Button variant="ghost" onClick={() => setQuickAddEmployeeOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!name.trim() || create.isPending} className="bg-sprint-primary text-sprint-primary-foreground hover:bg-sprint-primary/90">
            {create.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Add member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

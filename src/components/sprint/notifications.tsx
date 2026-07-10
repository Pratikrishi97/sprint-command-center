"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useDashboard as useDash } from "@/lib/queries";
import { useUI as useUIStore } from "@/stores/ui";
import { Bell, AlertTriangle, Clock, Ban, CalendarClock, UserX, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const ICONS: Record<string, typeof Bell> = {
  overdue: Clock,
  blocked: Ban,
  delayed: AlertTriangle,
  sprint: CalendarClock,
  unassigned: UserX,
};

const SEV: Record<string, string> = {
  high: "border-l-red-500 bg-red-500/5",
  medium: "border-l-amber-500 bg-amber-500/5",
  low: "border-l-sky-500 bg-sky-500/5",
};

const SEV_TEXT: Record<string, string> = {
  high: "text-red-400",
  medium: "text-amber-400",
  low: "text-sky-400",
};

export function NotificationsPanel() {
  const { notifOpen, setNotifOpen } = useUIStore();
  const { data } = useDash();
  const notifs = data?.notifications ?? [];

  return (
    <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
      <SheetContent className="w-full border-l border-border bg-background p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-sprint-primary" />
            Notifications
          </SheetTitle>
          <SheetDescription>
            {notifs.length} item{notifs.length === 1 ? "" : "s"} need your attention
          </SheetDescription>
        </SheetHeader>
        <div className="max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin">
          {notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <div className="text-sm font-medium">All clear</div>
              <div className="text-xs text-muted-foreground">No overdue, blocked or delayed tasks</div>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              <AnimatePresence>
                {notifs.map((n) => {
                  const Icon = ICONS[n.type] ?? Bell;
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border border-border border-l-4 p-3",
                        SEV[n.severity]
                      )}
                    >
                      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", SEV_TEXT[n.severity])} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium leading-tight">{n.title}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{n.detail}</div>
                      </div>
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase", SEV_TEXT[n.severity], "bg-transparent")}>
                        {n.severity}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

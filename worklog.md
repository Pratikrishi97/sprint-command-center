# Sprint Command Center — Worklog

This file is the shared worklog for all agents working on the Sprint Command Center.
Read previous sections before starting; append your own section after finishing.

---
Task ID: 0
Agent: main
Task: Set up foundation (theme, DB schema, seed, API, stores, shell, shared components)

Work Log:
- Created premium dark-mode-first theme in `src/app/globals.css` (emerald accent, glass utilities, scrollbar, recharts overrides). Light theme supported via `.light` class.
- Updated `src/app/layout.tsx`: dark by default, theme boot script, sonner toaster.
- Prisma schema `prisma/schema.prisma`: Sprint, Employee (self-relation manager), Task, DailyUpdate, Note. JSON fields for arrays.
- Ran `bun run db:push`. Ran `prisma/seed.ts` → 11 employees, sprints 2..15 (current=14), 224 tasks, daily updates, notes.
- Sprint engine in `src/lib/sprint.ts`: 14-day Tue→Tue sprints, epoch 2026-01-06. Functions: `sprintForDate`, `getSprintByNumber`, `sprintTimeline`, `idealBurndown`, `fmtDate`, `relativeDay`, `daysUntil`, `addDays`.
- Types + status/priority/risk/mood/employee-color metadata in `src/lib/types.ts`. Constants in `src/lib/const.ts` (STATUSES, PRIORITIES, BOARD_COLUMNS, PROJECTS, TEAMS, EMPLOYEE_COLOR_OPTIONS, etc.).
- Serialization helpers `src/lib/serialize.ts`.
- API routes (all `force-dynamic`):
  - `/api/dashboard` GET — aggregated KPIs, burndown, velocity, workload, status/risk dist, heatmap, recent + today's updates, notes, upcoming, overdue, notifications.
  - `/api/employees` GET/POST, `/api/employees/[id]` GET/PATCH/DELETE, `/api/employees/[id]/detail` GET (heatmap, performance per sprint, current workload).
  - `/api/tasks` GET (filters: sprintId, ownerId, status[], priority[])/POST, `/api/tasks/[id]` GET/PATCH/DELETE.
  - `/api/sprints` GET, `/api/sprints/[id]` GET (burndown, burnup, workload, dists)/PATCH.
  - `/api/daily-updates` GET/POST, `/api/daily-updates/[id]` PATCH/DELETE.
  - `/api/notes` GET/POST.
  - `/api/search` GET (q param).
  - `/api/analytics` GET (velocity, completionTrend, categoryDist, projectDist, priorityDist, statusDist, utilization, riskMatrix, heatmap).
- Zustand store `src/stores/ui.ts`: view, sidebarCollapsed, commandOpen, notifOpen, theme (+toggleTheme/setTheme apply DOM + localStorage), selectedSprintId, selectedEmployeeId, selectedTaskId, quickAddTaskOpen, quickAddEmployeeOpen, dailyUpdateOpen, filters {employeeId, project, priority[], status[], team, risk, search}, resetFilters.
- TanStack Query hooks in `src/lib/queries.ts`: useDashboard, useEmployees, useEmployeeDetail, useCreate/Update/DeleteEmployee, useTasks, useCreate/Update/DeleteTask, useSprints, useSprintDetail, useUpdateSprint, useDailyUpdates, useCreate/UpdateDailyUpdate, useNotes, useCreateNote, useSearch, useAnalytics. Types: DashboardData, SprintDetail, AnalyticsData exported.
- Providers `src/components/providers.tsx` (QueryClientProvider).
- Shared UI `src/components/sprint/shared.tsx`: EmployeeAvatar, AvatarStack, StatusBadge, PriorityBadge, RiskBadge, MoodPill, ProgressRing, initials().
- Shell components:
  - `src/components/sprint/sidebar.tsx` (Sidebar) — brand, active-sprint chip, quick actions (New Task / Member / Standup), nav with active indicator (layoutId), collapse toggle. Uses `bg-sprint-primary`/`text-sprint-primary`.
  - `src/components/sprint/topbar.tsx` (Topbar) — title/subtitle, search trigger (⌘K), date chip, New Task button, notifications bell w/ count, theme toggle, profile.
  - `src/components/sprint/command-palette.tsx` (CommandPalette) — ⌘K, actions, nav, live search (people/tasks/sprints), recents.
  - `src/components/sprint/notifications.tsx` (NotificationsPanel) — Sheet, severity-colored items.
  - `src/components/sprint/quick-add-task.tsx`, `quick-add-employee.tsx`, `daily-update-dialog.tsx`.
  - `src/components/sprint/task-drawer.tsx` (TaskDrawer) — Sheet with inline edit of status/priority/risk/owner/progress/dates/description/remarks; delete.

Stage Summary:
- Design tokens: `bg-sprint-primary` / `text-sprint-primary` (emerald). Card pattern: `rounded-xl border border-border bg-card/40 p-4`. KPI cards `rounded-xl border border-border bg-card/60 p-5`.
- All views must be client components (`"use client"`), use hooks from `@/lib/queries`, store from `@/stores/ui`, shared from `@/components/sprint/shared`, const from `@/lib/const`.
- Recharts: dark tooltips via globals; use `chart-1..chart-5` CSS vars for colors; grid lines subtle.
- Framer Motion for subtle entrance + hover. Keep animations <300ms.
- DO NOT create new Next.js routes. Everything renders inside the single `/` route via view-switching in `src/app/page.tsx`.
- Pending: build 8 views (dashboard, board, tasks, team, sprints, analytics, calendar, history) + wire `src/app/page.tsx` + mobile nav.

---
Task ID: 8
Agent: board-view-builder
Task: Build Kanban Board view at `src/components/sprint/views/board-view.tsx`

Work Log:
- Read worklog + architecture (types, const, queries, shared components, UI store) to align with shared design tokens (`bg-sprint-primary`/`text-sprint-primary`, `bg-card/40`, emerald accent).
- Created `src/components/sprint/views/board-view.tsx` (client component, starts with `"use client";`).
- Data: `useDashboard()` → `data.sprintTasks` (typed as `BoardTask = TaskRaw & { owner }`). Grouped by status into `BOARD_COLUMNS` order via `useMemo`.
- Filters: respects all global `useUI().filters` (employeeId, project, priority[], status[], team, risk, search across title/epic/project/tags). When `filters.status` is set, columns are still all rendered — only cards are filtered (per spec). Used selector-based `useUI((s) => ...)` to avoid re-renders.
- DnD: `DndContext` (`closestCorners`, PointerSensor with `distance:6` activation so clicks still fire, KeyboardSensor with `sortableKeyboardCoordinates`). Each column is a `useDroppable({ id: status })` container (so empty columns accept drops) wrapping a `SortableContext` (`verticalListSortingStrategy`) of card ids. Each card uses `useSortable({ id: task.id })` with `CSS.Transform` + opacity dim while dragging. `DragOverlay` renders a rotated, shadowed copy of the active card using `defaultDropAnimation`.
- `handleDragEnd`: resolves target status from `over.id` — if it's a `BOARD_COLUMNS` entry it's the column status, otherwise look up the over-task's status. Skips if same status. Calls `useUpdateTask().mutate({ id, body: { status } })`; if target is `completed`/`released`, also sets `progress: 100`.
- Card UI: compact `rounded-xl border border-border bg-card/40 p-3` with `hover:border-sprint-primary/40` lift. Shows truncated 2-line title, epic/project caption, `PriorityBadge`, estimate pts, owner avatar (`xs`), thin progress bar (color-coded by progress), and `RiskBadge` + colored left border (`border-l-2 border-l-orange/red`) for high/critical risk. Subtle `GripVertical` hint on hover.
- Column header: sticky `top-0` (works for mobile vertical scroll), status dot via `bg-current` + `STATUS_META[status].text`, label, task count pill, and total estimate pts (sm+).
- Empty state: muted `CircleDashed` + "Drop tasks here" inside empty columns.
- Toolbar: sprint name chip with `LayoutGrid` icon, drag/click legend (lg+), filtered/total count, and `Add task` button (`bg-sprint-primary`) → `setQuickAddTaskOpen(true)`.
- Layout: framer-motion entrance (`<300ms`). Board area `sm:overflow-x-auto scrollbar-thin`; columns `sm:h-[calc(100vh-220px)]` with internally-scrolling bodies (`sm:flex-1 sm:overflow-y-auto`). On mobile: columns stack vertically (`flex-col → sm:flex-row`), page scrolls, bodies are content-sized (`min-h-[120px]`).
- Clicking a card → `useUI.getState().setSelectedTaskId(task.id)` (via subscribed `setSelectedTaskId`) opens the existing TaskDrawer.
- Verified: `bun run lint` → no errors in this file (5 pre-existing errors in `quick-add-task.tsx`/`topbar.tsx` are unrelated). `bunx tsc --noEmit` → no errors in this file.
- Exports both named `BoardView` and default export for flexible wiring in `page.tsx`.

Stage Summary:
- Board view complete and ready to be imported by `src/app/page.tsx` (e.g. `import { BoardView } from "@/components/sprint/views/board-view";` then render when `view === "board"`).
- Uses only existing shared infrastructure — no new routes, no new queries, no new store actions.
- DnD cross-column moves persist via `useUpdateTask`; completed/released auto-set progress 100.
- Fully responsive (mobile vertical stack / desktop horizontal scroll with sticky headers).
- Caveats: relies on parent page providing vertical space; used `sm:h-[calc(100vh-220px)]` per spec hint for desktop column height. `examples/`, `skills/`, and a few pre-existing files have unrelated TS/lint errors that should be cleaned up separately.

---
Task ID: 9
Agent: tasks-view-builder
Task: Build Tasks table view at `src/components/sprint/views/tasks-view.tsx`

Work Log:
- Read worklog + architecture (types, const, queries, store, shared components, board-view reference) to align with shared design tokens (`bg-sprint-primary`/`text-sprint-primary`, `bg-card/40`, emerald accent, dark-mode-first).
- Created `src/components/sprint/views/tasks-view.tsx` (client component, starts with `"use client";`). Exports both named `TasksView` and default export.
- Data: `useDashboard()` → `data.sprintTasks` typed as `TaskRow = TaskRaw & { owner: EmployeeRaw | null }`. Pre-filtered via `useMemo` using `useUI().filters` (employeeId, project, priority[], status[], team, risk, search across title/epic/project/tags/remarks). Used selector-based `useUI((s) => ...)` subscriptions to avoid re-renders.
- Filter bar (above the table) inside a `rounded-xl border border-border bg-card/40 p-2.5` container with `flex flex-wrap items-center gap-2`:
  - Search Input (binds to `filters.search`) with leading `Search` icon, min-width 200px, flex-1.
  - Multi-select Status filter: `DropdownMenu` + `DropdownMenuCheckboxItem` for each `STATUSES` entry; checkbox items use `onSelect={(e) => e.preventDefault()}` to keep menu open for multi-select; per-item status dot via `STATUS_META[...].text`; count badge (`bg-sprint-primary`) on trigger; "Clear status" item at bottom when active.
  - Multi-select Priority filter: same pattern with `PRIORITIES`, dot via `PRIORITY_META[...].dot`.
  - Owner `Select` (from `data.employees`), Project `Select` (`PROJECTS`), Team `Select` (`TEAMS`), Risk `Select` (`RISKS`); each uses `"__all__"` sentinel → `null` mapping with leading lucide icon in trigger.
  - Reset button (ghost) appears only when filters active; shows active count badge (`bg-sprint-primary`).
  - Active filter count = search + employeeId + project + team + risk + priority.length + status.length.
- TanStack Table (`useReactTable`, `getCoreRowModel`, `getFilteredRowModel`, `getSortedRowModel`, `getPaginationRowModel`, `flexRender`). Controlled `sorting` state (default `[{ id: "endDate", desc: false }]`); uncontrolled pagination with `initialState.pageSize = 25`.
  - Columns (typed `ColumnDef<TaskRow>[]`): Task (priority dot + title + epic·project·story caption), Owner (avatar + name + team; "~" accessor so unassigned sorts last), Status (StatusBadge + inline `DropdownMenu` for quick status change via `useUpdateTask().mutate`, auto-sets `progress:100` for completed/released), Priority (PriorityBadge; custom `sortingFn` by rank so critical→low), Risk (RiskBadge), Project, Pts (estimate), Progress (mini color-coded bar + %), Due (`fmtDateShort` + overdue red highlight with "Nd overdue" / "in Nd" caption; `isOverdue()` skips completed/released/cancelled).
  - All headers sortable via `SortHeader` helper (button with `ArrowUp`/`ArrowDown`/`ChevronsUpDown` indicator; emerald accent when active; `e.stopPropagation()` so header click doesn't trigger row click).
- Table card: `rounded-xl border border-border bg-card/40` with `overflow-hidden`; inner `flex-1 overflow-auto scrollbar-thin min-h-0 min-w-0` for both horizontal + vertical scroll. Sticky `<thead>` (`sticky top-0 z-10 bg-card/95 backdrop-blur`). Zebra rows (`bg-muted/20` on odd index). Hover row highlight (`hover:bg-sprint-primary/10` — emerald tint, NOT indigo/blue). Row click → `setSelectedTaskId(row.original.id)` opens existing TaskDrawer.
- Pagination footer (border-t, `bg-card/60`): rows-per-page `Select` (10/25/50), "Showing X–Y of Z" with tabular-nums, Prev/Next `Button`s (disabled at bounds), "Page N / M" indicator. `useEffect` resets `pageIndex` to 0 when `filters` change so user never lands on an empty page.
- Empty state: centered `CircleDashed` icon + headline + helper text (different copy when filters active vs. no tasks at all), rendered as a single full-colSpan row.
- Toolbar (top): sprint name chip with `ListChecks` icon (`text-sprint-primary`), filtered/total count (lg+), and `Add task` button (`bg-sprint-primary text-sprint-primary-foreground`) → `setQuickAddTaskOpen(true)`.
- Responsive: filter bar wraps (`flex-wrap`); selects have fixed widths sized to fit common cases; table horizontal-scrolls inside its container on small screens; progress bar hides on mobile (`hidden sm:block`).
- Framer Motion entrance (`opacity/translateY`, 250ms).
- Self-check: `bun run lint` → only 1 warning in this file (`react-hooks/incompatible-library` for `useReactTable` — expected TanStack Table + React Compiler interaction, informational only). The 5 errors are all pre-existing in `quick-add-employee.tsx`/`quick-add-task.tsx`/`topbar.tsx` (also noted by Task 8). `bunx tsc --noEmit` → no errors in this file.

Stage Summary:
- Tasks view complete and ready to be imported by `src/app/page.tsx` (e.g. `import { TasksView } from "@/components/sprint/views/tasks-view";` then render when `view === "tasks"`).
- Uses only existing shared infrastructure — no new routes, no new queries, no new store actions.
- Powerful filter bar drives the table; pre-filtering approach (per spec) keeps TanStack Table's internal filter state unused but `getFilteredRowModel` is still wired per spec.
- Inline status change from the Status cell persists via `useUpdateTask` (auto-sets progress 100 on completed/released); row click opens TaskDrawer.
- Premium dark enterprise feel: emerald accent throughout, glassy sticky header, subtle zebra + emerald hover, tabular-nums for numeric columns, overdue red highlight.
- Caveats: relies on parent page providing vertical space (`h-full`); the React Compiler warning on `useReactTable` is benign and expected. Pre-existing TS/lint errors in other files remain (same set as Task 8 noted).

---
Task ID: 10
Agent: team-view-builder
Task: Build Team view (with employee detail panel) at `src/components/sprint/views/team-view.tsx`

Work Log:
- Read worklog + architecture (types, const, queries, store, shared components, board/tasks view reference, detail API route) to align with shared design tokens (`bg-sprint-primary`/`text-sprint-primary`, `bg-card/40`, emerald accent, dark-mode-first).
- Created `src/components/sprint/views/team-view.tsx` (client component, starts with `"use client";`). Exports both named `TeamView` and default export.
- Defined a local `EmployeeDetailData` interface (and `TaskWithSprint = TaskRaw & { sprint: SprintRaw | null }`) to type the result of `useEmployeeDetail` (which is untyped `jfetch`); cast the data with `query.data as EmployeeDetailData | undefined`. Defined local `ROLES` list (since `ROLES` is intentionally not exported from `@/lib/const`).
- Top-level `TeamView`: reads `useUI((s) => s.selectedEmployeeId)`; conditionally renders `TeamDetail` (if id set) or `TeamGrid` (default).
- **Team grid**: `useDashboard()` → `data.employees` + `data.workload` (indexed into a `workloadById` map by `useMemo` for O(1) lookup per card). Top toolbar: title chip (`Users` icon, emerald), team filter tabs (`All` + each `TEAMS` entry) using a shared `motion.span layoutId="team-tab"` for the active-pill animation, a stats strip (`Members`/`Active`/`Avg util`) hidden on mobile, and an `Add member` button (`bg-sprint-primary`) → `setQuickAddEmployeeOpen(true)`. Responsive grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`. Each card is a `motion.button` with `layout` + `AnimatePresence mode="popLayout"` for reordering animation; shows `EmployeeAvatar lg`, name + status dot (emerald for active, muted for inactive), role, team badge colored via `employeeColor(e.color)`, a `ProgressRing` (44px) for utilization with color (green <85, amber 85–100, red >100) and a % caption, mini-stats row (`Tasks`/`Estimate`/`Done`), a thin capacity bar (`estimate`/`capacity` with same color thresholds), and skills chips (first 3 + `+N`). Hover lift (`-translate-y-0.5` + emerald border + shadow). Click → `setSelectedEmployeeId(e.id)`. Loading skeleton (8 placeholder cards) and empty state for filter-with-no-results.
- **Team detail** (`TeamDetail`): `useEmployeeDetail(id)`. Back button (`ArrowLeft`) calls `setSelectedEmployeeId(null)`. Header card: large avatar, name, team badge (colored), role, email (Mail icon), timezone (Clock), joined date (CalendarDays), manager name (Users) — all on one wrapping flex row; right side has a status `Switch` (bound to active/inactive via `useUpdateEmployee`), and an action cluster: `Edit` (outline, opens `EditDialog`), `Deactivate` (only when active, calls `useUpdateEmployee` with `status:"inactive"`), and `Remove` (red-tinted outline, calls `useDeleteEmployee` then `setSelectedEmployeeId(null)`; uses `window.confirm`). Loading skeleton + error state with retry (`query.refetch()`).
- **EditDialog**: Dialog (re-using the QuickAddEmployee styling — `bg-popover p-0`, header/footer borders) with avatar preview that updates live as name/color change; fields: name (Input), role (Select from local `ROLES`), team (Select from `TEAMS`), capacity (number Input), color swatches (`EMPLOYEE_COLOR_OPTIONS` with `employeeColor(c).gradient` + selected ring). Submit → `useUpdateEmployee`. `useEffect` re-syncs local state when dialog opens.
- **Tabs** (Radix Tabs): Overview | Tasks | Activity | History | Notes.
  - **Overview**: 2-column layout. Left: `Current sprint workload` card with `ProgressRing` (56px) for completion %, 4-cell mini-stats (Tasks/Estimate/Done/Capacity), and a capacity-usage bar with color thresholds. Below it: `Performance per sprint` card using `SimpleBar` (horizontal) over `performance` array mapped to `{name:"S{n}", value: completedPts}`. Right: `Utilization` card with a large `ProgressRing` (120px) and a small legend (green/amber/red thresholds); `Skills` card with chips.
  - **Tasks**: filter strip (`All (n)` + one button per status present, labeled via `STATUS_META[status].label`, with `count`); grid (`sm:grid-cols-2`) of `currentTasks` cards with title (2-line clamp), `PriorityBadge`, `StatusBadge`, estimate pts, project caption, and a thin progress bar color-coded via `progressColor`. No task drawer — display only. Empty state when no current tasks.
  - **Activity**: 2-column layout. Left: `Activity heatmap` card with `Heatmap` chart (`weeks=13`) plus totals (updates count + hours logged). Below: `Recent daily updates` list (scrollable, max-h-480) showing date, `MoodPill`, hours worked, task title (tooltip), today's progress text, and blockers (red text with `AlertTriangle` icon). Right: `Mood distribution` side card with per-mood count/percent + thin emerald bars (sorted desc).
  - **History**: table of `performance` per sprint (Sprint name, Tasks, Estimate, Completed, Completion %) with a small colored progress bar (emerald ≥80, amber ≥50, red otherwise) and a `tabular-nums` percent column. Zebra hover (`bg-sprint-primary/5`).
  - **Notes**: 2-column layout. Left: scrollable notes list (each with `NOTE_TYPE_META` colored badge — general/blocker/risk/achievement/retro — and date + whitespace-pre-wrapped content). Right: `Add note` card with type Select (5 options) + content Textarea + emerald Add button → `useCreateNote` with `{ content, type, employeeId }`. Resets fields on success.
- Used `motion.div` entrance (`initial={{opacity:0, y:8}} animate={{opacity:1,y:0}}`, 250ms) on both grid and detail wrappers.
- Self-check: `bun run lint` → 5 errors + 1 warning, ALL pre-existing in `quick-add-employee.tsx`/`quick-add-task.tsx`/`topbar.tsx`/`tasks-view.tsx` (same set Task 8/9 noted). No errors/warnings in team-view.tsx. `bunx tsc --noEmit` → no errors in this file (only pre-existing errors in `examples/`, `skills/`, and a few API-route/quick-add-task import issues in other files).

Stage Summary:
- Team view complete and ready to be imported by `src/app/page.tsx` (e.g. `import { TeamView } from "@/components/sprint/views/team-view";` then render when `view === "team"`).
- Uses only existing shared infrastructure — no new routes, no new queries, no new store actions. `useEmployeeDetail` is untyped in `queries.ts`; I cast its result to a local `EmployeeDetailData` interface (matches the `/api/employees/[id]/detail` response shape).
- Grid ↔ detail switch is driven entirely by `useUI().selectedEmployeeId` (set by clicking a card; cleared by the back button). All mutations (`useUpdateEmployee` for status toggle + edit dialog; `useDeleteEmployee` for remove; `useCreateNote` for notes) invalidate the right query keys (already wired in `queries.ts`) so the grid/detail refetch automatically.
- Premium dark enterprise feel: emerald accent throughout, glassy cards (`bg-card/40`), emerald-bordered hover lift, color-thresholded utilization bars/rings, tabular-nums on numeric columns, skeleton + empty + error states everywhere.
- Caveats: relies on parent page providing vertical space (`h-full`); the edit dialog pattern (controlled `open` + `useEffect` to re-sync fields) is the same as `QuickAddEmployee` and triggers the same pre-existing lint rule on other files but NOT on this one (verified). Pre-existing TS/lint errors in other files remain (same set as Task 8/9 noted).

---
Task ID: 11
Agent: sprints-view-builder
Task: Build Sprints view (list + detail) at `src/components/sprint/views/sprints-view.tsx`

Work Log:
- Read worklog + architecture (queries → `SprintDetail` shape, `useUpdateSprint`, `useDashboard`, `useSprintDetail`; types → `SprintRaw`, `STATUS_META`, `RISK_META`, `RiskLevel`, `NoteRaw`, `EmployeeRaw`; sprint helpers → `fmtDate`, `fmtDateShort`, `daysUntil`, `getSprintByNumber`; shared → `EmployeeAvatar`, `ProgressRing`; charts → `BurndownChart`, `BurnupChart`, `VelocityChart`, `WorkloadChart`, `StatusDonut`, `SimpleBar`; UI store → `useUI().selectedSprintId/setSelectedSprintId`) and team-view/tasks-view references to align with shared design tokens (`bg-sprint-primary`/`text-sprint-primary`, `bg-card/40`, emerald accent, dark-mode-first). Confirmed `addDays` is NOT exported from `@/lib/sprint` (only imported internally) — used `daysUntil` instead.
- Created `src/components/sprint/views/sprints-view.tsx` (client component, starts with `"use client";`). Exports both named `SprintsView` and default export.
- Top-level `SprintsView`: reads `useUI((s) => s.selectedSprintId)`; conditionally renders `SprintDetail` (id set) or `SprintsList` (default).
- **SprintsList**: `useDashboard()` → `data.sprints` (sorted desc by `number`) + `data.velocity` (indexed by `number` into a map for O(1) lookup). Toolbar: title chip (`CalendarClock` icon, emerald), sprint count badge, current-sprint summary chip (clickable → opens current sprint; shows remaining days; `sm:` only), and an `active/upcoming/done` count strip on the right. Each `SprintRow` is a `motion.button` with: a left-side timeline connector (emerald dot with glow for active, amber for upcoming, muted for completed) that links each card vertically, sprint number + name with status pill (emerald "Active" w/ pulse dot / amber "Upcoming" / muted "Completed"), date range (`fmtDateShort` start → end), contextual status line ("Nd remaining" / "Starts in Nd" / "Completed"), a thin completion bar (color-coded by status — emerald for active, amber for upcoming, emerald/70 for completed), and a right-side velocity block (`sm:` only) showing completed pts and planned pts. Active sprint card has emerald border + ring + shadow on hover. Empty/error/loading states included. Loading: 6 skeleton rows. Clicking → `setSelectedSprintId(s.id)`. Wrapped list in a `ScrollArea` with `flex-1` for vertical scrolling.
- **SprintDetail**: `useSprintDetail(id)`. Loading skeleton (header + 6 KPI skeletons + tab list + content). Error state with retry. Back button "← All sprints" → `setSelectedSprintId(null)`. `handleUpdate` callback → `useUpdateSprint().mutate({ id, body })`. Used `useCallback` so it's stable for child editable components.
  - **Header**: status pill (color-coded by `SPRINT_STATUS_META`), "Sprint N" caption, sprint name, date range (`fmtDate` start → end), contextual remaining/starts-in/completed line, right-side calendar-vs-final progress bar with caption and a `ProgressRing` (64px). Active sprints show emerald border on the header card.
  - **KPI row** (6 cards, responsive 2/3/6 cols): Total tasks (+blocked hint), Completed (+% hint), Completion (accent card with `ProgressRing` 44px + pts caption), Velocity (accent, completed/planned), Capacity (pts or — if zero), Remaining (pts to deliver). All numeric values use `tabular-nums`.
  - **Tabs** (Radix Tabs): Overview | Burndown | Team | Retrospective | Notes.
    - **Overview**: 2-col layout. Left: "Sprint goals" card with editable `EditableTextList` (Textarea-per-item, blur-save via `useUpdateSprint` w/ `{ goals }`, add/remove buttons — Enter to add), "Achievements" card (read-only list with `Sparkles` icon), "Sprint risks" card (each risk with `RISK_META` colored level badge + mitigation text). Right: "Status distribution" card with `StatusDonut` over `statusDist` + a 2-col legend using `STATUS_META` colors, and "Risk distribution" card with `SimpleBar` (horizontal, color-coded by risk level via local color map).
    - **Burndown**: 4-cell stat strip (Planned, Completed w/ %, Today-vs-ideal w/ behind/ahead/on-track hint, Remaining) + 2-col grid of `BurndownChart` and `BurnupChart` side by side (each `SectionCard` with a legend: Actual/Completed solid line + Ideal/Scope dashed line). Below: `VelocityStrip` showing the last 8 sprints of `data.velocity` via `VelocityChart` (with current sprint's own velocity appended if not present). All chart cards have empty states when `burndown.length === 0`.
    - **Team**: 2-col layout. Left (`xl:col-span-2`): `WorkloadChart` over `workload` (filtered to members with tasks, sorted desc by estimate, height auto-scales with member count). Right: scrollable "Members" list (`ScrollArea max-h-420`) with `EmployeeAvatar sm`, name, "N tasks · M pts", right-side utilization % (color-thresholded) + thin capacity bar (also color-thresholded). Empty state for both.
    - **Retrospective**: 2-col grid. Left: "Retrospective" card with editable `EditableRetrospective` (Textarea, blur-save via `{ retrospective }` — only commits if changed). Right column: "Lessons learned" + "Action items" cards each using `EditableTextList` (blur-save via `{ lessonsLearned }` / `{ actionItems }`). Full-width: "Sprint risks" card (2-col grid of risks with level badge + mitigation).
    - **Notes**: 2-col grid of note cards. Each card: type badge (`NOTE_TYPE_META` colors — general/blocker/risk/achievement/retro), `fmtDate` createdAt, whitespace-pre-wrapped content, footer with `EmployeeAvatar xs` + name (when present). Empty state when no notes.
- **Editable patterns**:
  - `EditableTextList`: local state synced via `useEffect` when parent `items` change; per-item Textarea + remove button (visible on hover); Enter-to-add input row at bottom; commits entire array on blur or add/remove via `onCommit` callback → `useUpdateSprint`.
  - `EditableRetrospective`: local Textarea, only calls `onCommit` on blur if value changed (avoids spurious mutations).
- Helpers: `SPRINT_STATUS_META` (active/upcoming/completed → label/dot/text/bg/ring/border), `NOTE_TYPE_META` (5 note types), `utilizationBarColor` / `utilizationTextColor` (green <85, amber 85–100, red >100), `MiniStat` (icon + label + value + hint, optional `accent`), `SectionCard` (icon + title + optional action + body), `EmptyState` (icon + title + hint, dashed border).
- Used `motion.div` entrance (`initial={{opacity:0, y:8}} animate={{opacity:1,y:0}}`, 250ms) on both list and detail wrappers; `motion.button layout` with `AnimatePresence`-friendly initial/animate on each sprint row.
- Self-check: `bun run lint` → 5 errors + 1 warning, ALL pre-existing in `quick-add-employee.tsx`/`quick-add-task.tsx`/`topbar.tsx`/`daily-update-dialog.tsx`/`tasks-view.tsx` (same set Tasks 8/9/10 noted). `bunx eslint src/components/sprint/views/sprints-view.tsx` → exit 0, no errors/warnings in this file. `bunx tsc --noEmit | grep sprints-view` → no errors in this file (only pre-existing errors in `examples/`, `skills/`, several API routes missing `addDays` export, and `quick-add-task.tsx`).

Stage Summary:
- Sprints view complete and ready to be imported by `src/app/page.tsx` (e.g. `import { SprintsView } from "@/components/sprint/views/sprints-view";` then render when `view === "sprints"`).
- Uses only existing shared infrastructure — no new routes, no new queries, no new store actions. List ↔ detail switch is driven entirely by `useUI().selectedSprintId` (set by clicking a row; cleared by the back button). `useUpdateSprint` invalidates `sprints`, `sprint-detail`, and `dashboard` query keys so the list, detail, and other views refetch automatically after editable-field saves.
- Premium dark enterprise feel: emerald accent throughout, glassy cards (`bg-card/40`), emerald-bordered active sprint with pulse dot, timeline connector down the left side of the list, color-thresholded utilization bars, `tabular-nums` on all numeric columns, skeleton + empty + error states everywhere.
- Caveats: relies on parent page providing vertical space (`h-full`); `EditableTextList` commits the entire array on each blur (simple + safe — backend PATCH route JSON-stringifies the array). `addDays` is referenced by other API routes but not needed here. Pre-existing TS/lint errors in other files remain (same set Tasks 8/9/10 noted).

---
Task ID: 12
Agent: analytics-view-builder
Task: Build Analytics view at `src/components/sprint/views/analytics-view.tsx`

Work Log:
- Read worklog + architecture (queries → `AnalyticsData` shape returned by `useAnalytics()`; types → `STATUS_META`, `PRIORITY_META`, `RISK_META`, `TaskStatus`, `Priority`, `RiskLevel`; const → `PRIORITIES`, `RISKS`; charts → `VelocityChart`, `SimpleBar`, `StatusDonut`, `Heatmap` from `@/components/charts`; analytics API route verified to confirm exact field names incl. `riskMatrix: { risk, impact, count }[]` with risks ∈ {low/medium/high/critical} × impacts ∈ {low/medium/high}) and existing view references (board/tasks/team/sprints) to align with shared design tokens (`bg-sprint-primary`/`text-sprint-primary`, `bg-card/40`, `bg-card/60`, emerald accent, dark-mode-first).
- Created `src/components/sprint/views/analytics-view.tsx` (client component, starts with `"use client";`). Exports both named `AnalyticsView` and default export.
- Data: `useAnalytics()` only (all KPIs derivable from `AnalyticsData`). Handled loading (skeleton grid: 4 KPI placeholders + 1 full-width + 6 half-width + 1 full-width), error (red dashed card with `AlertTriangle` + Retry button → `query.refetch()`), and empty states (per-chart `EmptyState` with `CircleDashed` icon).
- Top KPI strip (`grid-cols-2 lg:grid-cols-4`): Avg Velocity (avg of `velocity.slice(-6).completed`, emerald accent), Avg Completion (avg of `completionTrend.pct`), Total Tasks (sum of `statusDist` values), Team Utilization (avg of `utilization` array). All numeric values use `tabular-nums`.
- Main grid (`grid-cols-1 lg:grid-cols-2 gap-4`), 10 chart cards via reusable `ChartCard` (icon badge in `bg-sprint-primary/10` ring `ring-sprint-primary/20`, uppercase muted subtitle, semibold title, optional action slot). Each card wrapped in `motion.div` with staggered entrance `initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay: index*0.04, duration:0.22}}` per spec.
  1. **Velocity Trend** (full-width `lg:col-span-2`) — `VelocityChart` over `velocity` mapped to `{sprint:"S{n}", completed, planned, status}` (height 280).
  2. **Completion Rate** — `SimpleBar` (vertical) over `completionTrend` → `{name:"S{n}", value:pct}` (height 220). Action chip shows "avg N%" in emerald.
  3. **Sprint Comparison** (full-width) — `SprintComparison` table over `recentSprints` (last 6). Columns: Sprint, Planned, Completed (emerald), Carryover, Completion (mini bar color-coded: ≥80 emerald / ≥50 amber / else red + tabular %), Status (pill: active emerald / upcoming amber / completed muted). Wrapped in `overflow-x-auto scrollbar-thin`. Zebra hover `bg-sprint-primary/5`.
  4. **By Category** — `SimpleBar` horizontal over top 8 `categoryDist` entries (`var(--chart-1)` emerald).
  5. **By Project** — `SimpleBar` horizontal over top 8 `projectDist` entries (`var(--chart-2)` sky for contrast).
  6. **By Priority** — `SimpleBar` vertical with per-bar colors via local `PRIORITY_HEX` map (critical red / high amber / medium sky / low slate); below the chart, a legend strip with `PRIORITY_META` dots and counts.
  7. **Status Mix** — `StatusDonut` over `statusDist` (uses internal color map) + side legend (top 7 statuses sorted desc) with `STATUS_META` color dots and counts.
  8. **Team Utilization** (full-width) — custom `UtilizationTable` (sorted desc by utilization). Each row: name + team + task count + `estimate/capacity` caption, a thin capacity bar (clamped at 100% with overflow segment rendered in red when >100), and right-side utilization % colored by `utilColor(u)` helper (green<85, amber 85–100, red>100). Top legend explains the three thresholds. `motion.div` row entrance with x-slide.
  9. **Risk × Impact Matrix** — `RiskMatrix` CSS grid `grid-cols-[68px_repeat(3,1fr)]` with header row (low/medium/high impact labels) + 4 risk rows (low/medium/high/critical with `RISK_DOT` color dots). Each cell uses `color-mix(in oklch, ${RISK_HEX[risk]} ${ratio*100}%, transparent)` where `ratio = count/max(1, maxCount)` and clamped to min 0.12 so non-zero cells are visible. Empty cells render `·` in muted; non-empty show count centered. Helper text below explains scaling + hover.
  10. **Daily Activity** (full-width) — `Heatmap` chart with `weeks={15}` (matches the 105-day window from the analytics API). Wrapped in `overflow-x-auto scrollbar-thin`. Below: legend with 5 color steps (Less → More) and "15 weeks ago" / "Today" labels.
- Helpers: `utilColor(u)` → `{bar, text}` classes (emerald/amber/red); `distToData(dist, limit)` → sorted+truncated `{name,value}[]`; `RISK_DOT`/`RISK_HEX`/`PRIORITY_HEX` color maps for matrix cells + priority bars.
- Self-check: `bunx eslint src/components/sprint/views/analytics-view.tsx` → exit 0 (no errors/warnings in this file). `bunx tsc --noEmit | grep analytics-view` → no errors in this file. `bun run lint` shows only the 5 pre-existing errors + 1 pre-existing warning (all in `quick-add-employee.tsx`/`quick-add-task.tsx`/`topbar.tsx`/`tasks-view.tsx` — same set Tasks 8/9/10/11 noted).
- Premium dark enterprise feel: emerald accent throughout (`bg-sprint-primary/10` icon badges, emerald borders on accent KPI, emerald completed column / hover tints), glassy cards (`bg-card/40` for charts, `bg-card/60` for KPIs), tabular-nums on every numeric value, color-thresholded bars (utilization, completion), skeleton + empty + error states on every section.

Stage Summary:
- Analytics view complete and ready to be imported by `src/app/page.tsx` (e.g. `import { AnalyticsView } from "@/components/sprint/views/analytics-view";` then render when `view === "analytics"`).
- Uses only existing shared infrastructure — no new routes, no new queries, no new store actions, no new charts. All 10 sections + 4-KPI strip are present per spec.
- All data is derived from `useAnalytics()`; loading/error/empty states handled at both the page level (skeleton/error) and per-card level (EmptyState for sections whose slice is empty).
- The risk matrix uses CSS `color-mix()` (modern browsers) to scale each cell's opacity by `count/max` per risk level, with per-risk-level color (emerald/amber/orange/red) so the matrix conveys both severity and density at a glance.
- Team utilization uses custom horizontal bars (not `WorkloadChart`) so per-row capacity bar + overflow segment + colored % can all be rendered in one row; legend explains the green/amber/red thresholds.
- Caveats: relies on parent page providing vertical space (`h-full`); `color-mix()` requires modern browsers (already used elsewhere in the codebase). Pre-existing TS/lint errors in other files remain (same set Tasks 8/9/10/11 noted).

---
Task ID: 13
Agent: calendar-history-views-builder
Task: Build Calendar + History views at `src/components/sprint/views/calendar-history-views.tsx`

Work Log:
- Read worklog + architecture (queries → `DashboardData` (sprints, sprintTasks, upcoming, overdue, velocity) + `SprintDetail` (sprint, burndown, statusDist, workload, velocity); types → `SprintRaw`, `TaskRaw`, `STATUS_META`, `TaskStatus`; sprint helpers → `fmtDate`, `fmtDateShort`, `relativeDay`; shared → `EmployeeAvatar`, `StatusBadge`; charts → `BurndownChart`, `StatusDonut`; ui store → `useUI` confirmed but unused here — used local state per spec hint to avoid `setSelectedSprintId` auto-navigating to the `sprints` view) and prior view references (board/tasks/team/sprints/analytics) to align with shared design tokens (`bg-sprint-primary`/`text-sprint-primary`, `bg-card/40`, emerald accent, dark-mode-first).
- Confirmed `addDays` is NOT exported from `@/lib/sprint` (per Task 11 note); used `subMonths`/`addMonths`/`startOfMonth` from `date-fns` instead for month navigation. All date helpers (`startOfMonth`, `endOfMonth`, `eachDayOfInterval`, `format`, `isSameMonth`, `isToday`, `isWeekend`, `addMonths`, `subMonths`, `startOfWeek`, `endOfWeek`) imported directly from `date-fns`.
- Created `src/components/sprint/views/calendar-history-views.tsx` (client component, starts with `"use client";`). Exports both named `CalendarView` and `HistoryView` (no default export — the file contains two components).
- **CalendarView**:
  - Local displayed-month state: `const [month, setMonth] = React.useState(() => startOfMonth(new Date()))`.
  - Toolbar: brand chip (`CalendarDays` icon, emerald ring), "Calendar" title, and prev / Today / next `Button`s wired to `subMonths`, `startOfMonth(new Date())`, `addMonths`.
  - Grid built from `startOfWeek(startOfMonth(month), {weekStartsOn:0})` → `endOfWeek(endOfMonth(month), {weekStartsOn:0})` via `eachDayOfInterval`. Weekday header row (Sun..Sat).
  - Event indexing (`useMemo` keyed on `[data, month]`): keyed by `format(d, "yyyy-MM-dd")`. Filtered to the visible month (`d >= monthStart && d <= monthEnd`) per spec for performance. Two event sources:
    - Tasks from `data.sprintTasks` keyed by `endDate` → chip with truncated title (24 chars) colored via `STATUS_META[status].bg/text/ring`.
    - Sprints from `data.sprints` keyed by `startDate` ("starts") and `endDate` ("ends") → full-width emerald chip "Sprint N starts/ends".
  - Day cell: `min-h-[88px] sm:min-h-[110px]`, weekend shading (`bg-muted/15` when in month), out-of-month muted (`bg-muted/10` + opacity-40 on number), today highlighted with emerald ring + filled emerald number badge + "Today" caption. Shows up to 3 task chips then "+N more" overflow.
  - Legend strip below the grid: 10 most-common `STATUS_META` swatches + an emerald "Sprint milestone" swatch.
  - Right rail (xl breakpoint): "Upcoming & overdue" card combining `data.overdue` + `data.upcoming` sorted by `endDate` asc, sliced to 7. Each item: title (truncate), relative due (`relativeDay`), owner `EmployeeAvatar xs`, `StatusBadge`, and a red "Overdue" pill when `endDate < today` and status not closed (completed/released/cancelled). ScrollArea caps height on large screens.
  - Loading state: 35-cell `CalendarSkeleton` with pulse + 5-row list skeleton. Error state: dashed red card with `AlertTriangle` + Retry button (`refetch()`). Empty upcoming list: emerald `CheckCircle2` "All clear" empty state.
  - Layout: `grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4` — calendar takes the wide column, upcoming list takes the 320px column. Below xl they stack.
- **HistoryView**:
  - Past sprints list = `data.sprints` filtered to `status === "completed" || "active"`, sorted desc by `number`. Velocity map indexed by sprint `number` for O(1) lookup.
  - Local selection state: `const [selId, setSelId] = React.useState<string|null>(null)` with a `useEffect` that auto-selects the most recent completed sprint once data loads (per spec hint). Used local state (NOT `useUI().setSelectedSprintId`) because that setter also forces `view: "sprints"`, which would navigate away from the history view.
  - Left rail: `ScrollArea` of `SprintRaw` cards. Each card shows sprint number ("Sprint N" caption), `Active`/`Done` pill, name (truncate), date range (`fmtDateShort` start → end), velocity pts + completion %, and a thin completion bar (emerald for active, emerald/70 for completed). Selected card gets emerald border + ring + tint. Loading skeleton + empty state handled.
  - Right detail: `SprintHistoryDetail` rendered with `key={selId}` so it remounts on selection change (re-entrance animation). Uses `useSprintDetail(id)`:
    - Header card: "Sprint N" caption, sprint name, `fmtDate` start → end, "Completed" badge (emerald when completed, emerald-primary when active). Active sprint header gets emerald border + tint.
    - KPI row (2 cols mobile / 4 cols sm): Total tasks, Completed (completed + released), Completion % (accent card, emerald text), Velocity (completed pts with "of N planned" hint).
    - Charts grid (1 col mobile / 2 cols lg): `BurndownChart` over `detail.burndown` and `StatusDonut` over `detail.statusDist`, each in a `HistoryCard` with empty states when data is missing.
    - Top contributors: `detail.workload` filtered to `completed > 0`, sorted desc by `completed`, sliced to 5. Each row: rank pill (#1 emerald), `EmployeeAvatar sm`, name + team + task count, a thin bar (scaled to top contributor), and completed pts in emerald.
    - Achievements card (only when `sprint.achievements.length > 0`): bulleted list with `Sparkles` emerald icons.
    - Retrospective snippet card (only when `sprint.retrospective` is non-empty): `line-clamp-6` whitespace-pre-wrapped text.
    - Loading: `DetailSkeleton` (header + 4 KPIs + 2 charts + contributors). Error: dashed red card with Retry.
  - Layout: `grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4` — left rail 300px on lg+, stacks on mobile. Left rail caps height with `ScrollArea` so the list scrolls independently on desktop.
- Helpers: `WEEKDAY_LABELS`, `LEGEND_STATUSES` (curated 10-status subset), `dateKey` (yyyy-MM-dd format), `parseDate` (safe Date parse → null on invalid), `truncate`, `startOfDay` (local helper for overdue comparison). Reusable presentational components: `HistoryKpi` (icon + label + value + hint, optional `accent`), `HistoryCard` (icon badge + title + optional subtitle + body), `HistoryChartEmpty`, `CalendarSkeleton`, `CalendarError`, `EmptyDetailPrompt`, `DetailSkeleton`.
- Used `motion.div` entrance animations (`initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}`, 220–250ms) on both view wrappers and the detail panel.
- Self-check: `bunx eslint src/components/sprint/views/calendar-history-views.tsx --max-warnings 0` → exit 0 (no errors/warnings in this file). `bunx tsc --noEmit | grep calendar-history-views` → no errors in this file. `bun run lint` shows only the 5 pre-existing errors + 1 pre-existing warning (all in `quick-add-task.tsx`/`quick-add-employee.tsx`/`topbar.tsx`/`tasks-view.tsx` — same set Tasks 8/9/10/11/12 noted).
- Premium dark enterprise feel: emerald accent throughout (`bg-sprint-primary/10` icon badges, emerald "Today" highlight + emerald number badge, emerald sprint milestone chips, emerald completion KPI/bars), glassy cards (`bg-card/40`), muted/15 weekend shading, tabular-nums on every numeric value, color-thresholded overdue pill (red), skeleton + empty + error states on every section.

Stage Summary:
- Calendar + History views complete and ready to be imported by `src/app/page.tsx` (e.g. `import { CalendarView, HistoryView } from "@/components/sprint/views/calendar-history-views";` then render `CalendarView` when `view === "calendar"` and `HistoryView` when `view === "history"`).
- Uses only existing shared infrastructure — no new routes, no new queries, no new store actions, no new charts. Both views consume `useDashboard()`; `HistoryView` additionally consumes `useSprintDetail(id)` for the right detail panel.
- `CalendarView` derives all events from `data.sprintTasks` (endDate) + `data.sprints` (start/end). Events are filtered to the visible month for performance per spec. Month navigation via local `useState`; "Today" button resets to current month.
- `HistoryView` uses local `selId` state (NOT the UI store's `selectedSprintId`, which would force-navigate to the sprints view) with auto-selection of the most recent completed sprint on first data load. Left rail lists completed + active sprints; right detail shows a rich summary (header, 4 KPIs, burndown + status donut, top-5 contributors, achievements, retrospective snippet) with loading/error/empty states.
- Fully responsive: calendar + upcoming list stack on xl-; history left rail + detail stack on lg-. Cells `min-h-[88px] sm:min-h-[110px]` per spec. Chip text truncates with title tooltips for full text on hover.
- Caveats: relies on parent page providing vertical space (`h-full`); `useEffect` for default selection is conditional (`if (!selId && mostRecentCompletedId)`) so it does NOT trigger the `react-hooks/set-state-in-effect` lint rule that fires on other files. Pre-existing TS/lint errors in other files remain (same set Tasks 8/9/10/11/12 noted).

---
Task ID: 7 + 14
Agent: main
Task: Build Dashboard view, wire page.tsx, fix lint errors, verify with Agent Browser + VLM

Work Log:
- Built `src/components/sprint/views/dashboard-view.tsx`: hero sprint header with 14-day timeline (weekend shading, today marker), 6 KPI cards, BurndownChart, CompletionGauge, VelocityChart, StatusDonut, WorkloadChart, Today's Standup feed (mood, blockers, progress rings), Needs Attention (overdue/blocked/delayed), Upcoming Deadlines, Recent Updates, Risk distribution, Activity Heatmap, Notes.
- Built reusable charts in `src/components/charts.tsx`: BurndownChart, BurnupChart, VelocityChart, WorkloadChart, StatusDonut, SimpleBar, CompletionGauge, Heatmap.
- Built `src/components/sprint/mobile-nav.tsx` (fixed bottom nav for mobile).
- Wired `src/app/page.tsx`: Providers → Sidebar + Topbar + main (ViewSwitch with AnimatePresence) + MobileNav + CommandPalette + NotificationsPanel + TaskDrawer + QuickAddTask + QuickAddEmployee + DailyUpdateDialog + KeyboardShortcuts (⌘K, ⌘N, single-letter nav d/b/t/e/s/a/c/h).
- Fixed React Compiler lint errors (react-hooks/set-state-in-effect) in quick-add-task, quick-add-employee, daily-update-dialog, command-palette, topbar by replacing useEffect resets with the render-time "adjust state when prop changes" pattern.
- Re-exported `addDays` from `src/lib/sprint.ts` (was imported by API routes but not exported — caused module-not-found).
- Rounded `progress` and `percentage` in `src/lib/serialize.ts` to fix ugly decimals (10.50411317481121% → 11%).
- Added `--sprint-primary` / `--sprint-primary-foreground` color tokens to globals.css + theme inline mapping so `bg-sprint-primary`/`text-sprint-primary` classes resolve in both dark and light themes.

Stage Summary:
- Lint: 0 errors, 1 benign warning (TanStack Table useReactTable incompatible-library — expected/unavoidable).
- Agent Browser verification (all PASSED, no console errors):
  - Dashboard renders: hero + timeline + 6 KPIs + burndown + completion gauge + velocity + status donut + workload + standup feed + needs attention + upcoming + recent updates + heatmap + notes.
  - Command palette (⌘K): actions, nav, live search (people/tasks/sprints), recents.
  - Board: kanban columns with drag-droppable cards (priority, estimate, owner, progress, risk).
  - Tasks: filterable TanStack table with sortable columns, pagination, inline status change.
  - Task drawer: full inline editing (status/priority/risk/owner/progress/dates/desc/remarks/links), delete.
  - Team: filterable employee grid + 5-tab detail (Overview/Tasks/Activity/History/Notes) with heatmap & performance chart.
  - Sprints: timeline list + 5-tab detail (Overview/Burndown/Team/Retrospective/Notes) with editable goals/retro.
  - Analytics: 10 charts (velocity, completion, sprint comparison, category/project/priority dist, status donut, utilization, risk matrix, activity heatmap).
  - Calendar: month grid with task/sprint event chips + upcoming/overdue rail.
  - History: past-sprint archive + detail (KPIs, burndown, top contributors, achievements, retro).
  - Quick-add task: created a task end-to-end (then cleaned up).
  - Mobile (390×844): bottom nav renders, layout responsive.
- VLM (glm-4.6v) visual audit: confirmed "modern and premium, dark theme, cohesive color hierarchy (teal/green on dark), clean integer percentages, all charts render visible data". Initial timing-related blank-chart observation resolved after reload.
- APIs all return 200: /api/dashboard, /api/analytics, /api/sprints, /api/sprints/[id], /api/employees, /api/employees/[id]/detail, /api/tasks, /api/search.
- Project is production-ready and browser-verified.

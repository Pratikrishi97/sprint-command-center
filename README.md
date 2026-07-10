# Sprint Command Center

A premium, dark-mode-first **agile sprint management command center** for tracking every person, task, and daily update across two-week sprints. Built as a single-page app with 8 switchable views, a Kanban board with drag-and-drop, burndown charts, analytics, and a command palette.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Prisma](https://img.shields.io/badge/Prisma-6-indigo) ![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8)

## ✨ Features

- **8 Views** — Dashboard, Kanban Board, Tasks, Team, Sprints, Analytics, Calendar, History
- **Kanban board** with drag-and-drop status changes (@dnd-kit)
- **14-state task workflow**
- **Sprint engine** — auto-computes 14-day Tue→Tue sprints
- **Daily standups** — today/yesterday/tomorrow progress, blockers, mood, confidence
- **Analytics** — velocity trends, completion %, risk matrix, utilization heatmap
- **Command palette** (⌘K), keyboard nav, live search
- **Notifications** — overdue, blocked, delayed, unassigned, sprint-ending alerts
- **Dark/light theme**, fully responsive with mobile nav

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Language | TypeScript 5 |
| Database | PostgreSQL via Prisma 6 |
| Data fetching | TanStack Query 5 |
| State | Zustand |
| UI | Tailwind v4, shadcn/ui (Radix), Framer Motion, Recharts, lucide-react |
| Forms | react-hook-form + zod |
| DnD | @dnd-kit |

## 🚀 Quick Start (Local)

```bash
npm install --legacy-peer-deps
cp .env.example .env   # set DATABASE_URL
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000.

## ☁️ Deploying to Netlify

The `netlify.toml` runs: `prisma generate → prisma migrate deploy → next build`.

The `@netlify/plugin-nextjs` plugin handles SSR + API routes as serverless functions.

### Steps

1. **Provision PostgreSQL on [Neon](https://neon.tech)** (free). Copy the **pooled** connection string.
2. **Push to GitHub.**
3. **Import the repo in Netlify** — build settings auto-detected from `netlify.toml`.
4. **Set `DATABASE_URL`** in Netlify → Site settings → Environment variables (for Production, Deploy previews, AND Branch deploys).
5. **(Optional) Seed demo data** locally:
   ```bash
   DATABASE_URL="<your-neon-url>" npm run db:push
   DATABASE_URL="<your-neon-url>" npm run db:seed
   ```
6. **Trigger deploy.** Visit `https://<your-site>.netlify.app`.

### Resilience

The app is built to deploy successfully even before `DATABASE_URL` is set — the build wraps `prisma migrate deploy` in `(… || echo skipped)`, and every API route returns a friendly JSON 503 (`database_not_configured` or `database_unreachable`) instead of crashing. A dismissible banner in the UI walks the user through setup.

A `/api/health` endpoint is available for uptime monitoring.

## 📜 Scripts

| Script | Description |
|--------|-------------|
| `dev` | Start Next.js dev server |
| `build` | Production build |
| `start` | Run production server |
| `lint` | Run ESLint |
| `db:generate` | Generate Prisma client |
| `db:push` | Push schema to DB |
| `db:migrate` | Create + apply migration locally |
| `db:deploy` | Apply pending migrations to production DB |
| `db:seed` | Seed demo data |
| `db:reset` | Reset DB and re-run migrations |

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Open command palette |
| `⌘N` / `Ctrl+N` | Quick add task |
| `d` `b` `t` `e` `s` `a` `c` `h` | Switch views |

## 📄 License

Private project.

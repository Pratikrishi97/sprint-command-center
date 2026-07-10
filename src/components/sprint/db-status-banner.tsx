"use client";

import { useDashboard } from "@/lib/queries";
import { AlertTriangle, Database, X, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Dismissible banner shown when DB is missing or unreachable.
 */
export function DbStatusBanner() {
  const { data, error } = useDashboard();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  if (data && !error) return null;
  if (dismissed) return null;

  let kind: "not_configured" | "unreachable" | null = null;
  if (error) {
    const msg = error.message || "";
    if (msg.includes("database_not_configured")) kind = "not_configured";
    else if (msg.includes("database_unreachable")) kind = "unreachable";
    else if (msg.includes("HTTP 503")) {
      kind = msg.includes("DATABASE_URL") ? "not_configured" : "unreachable";
    }
  }
  if (!kind) return null;

  const copy = {
    not_configured: {
      icon: Database,
      title: "Database not configured",
      body: "This Netlify deploy doesn't have a DATABASE_URL set. Create a free PostgreSQL database (Neon, Supabase, or any other host), then add the connection string as the DATABASE_URL environment variable in Netlify → Site settings → Environment variables, and redeploy.",
      tone: "amber",
    },
    unreachable: {
      icon: AlertTriangle,
      title: "Can't reach the database",
      body: "The DATABASE_URL is set but the connection failed. Check that the database is online (Neon free tier auto-suspends after inactivity — open the Neon dashboard to resume), that the URL is correct, and that any IP allowlist includes Netlify's egress.",
      tone: "red",
    },
  }[kind];

  const Icon = copy.icon;
  const tones = {
    amber: "border-amber-500/40 bg-amber-500/10 text-amber-100",
    red: "border-red-500/40 bg-red-500/10 text-red-100",
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className={`mx-3 mt-3 rounded-lg border p-3 text-sm md:mx-6 md:mt-4 ${tones[copy.tone]}`}
      >
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{copy.title}</p>
            <p className="mt-1 text-xs leading-relaxed opacity-90">{copy.body}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              <a
                href="https://neon.tech"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
              >
                Create a free Neon database <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://docs.netlify.com/environment-variables/overview/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
              >
                Netlify env var docs <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="grid h-6 w-6 shrink-0 place-items-center rounded text-current/70 transition hover:bg-current/10"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Lightweight health check for Netlify uptime monitoring.
 * Returns 200 if the app is alive; the `database` field tells you whether
 * DATABASE_URL is configured (not whether the DB is actually reachable).
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: hasDatabase ? "configured" : "missing",
  });
}

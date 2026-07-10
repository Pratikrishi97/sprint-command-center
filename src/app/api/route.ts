import { NextResponse } from "next/server";
import { withDb } from "@/lib/db";
async function _GET() {
  return NextResponse.json({ message: "Hello, world!" });
}

export const GET = withDb(_GET);

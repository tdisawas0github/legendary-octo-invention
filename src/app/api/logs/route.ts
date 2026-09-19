import { NextResponse } from "next/server";
import { getRequestLogs, getRequestLogCount } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const logs = getRequestLogs(limit, offset);
    const total = getRequestLogCount();

    return NextResponse.json({ logs, total, limit, offset });
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}

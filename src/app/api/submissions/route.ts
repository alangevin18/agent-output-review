import { NextResponse } from "next/server";
import { listSubmissions } from "@/lib/data/submissions";

export const runtime = "nodejs";

export async function GET() {
  const submissions = await listSubmissions();
  return NextResponse.json({ submissions });
}

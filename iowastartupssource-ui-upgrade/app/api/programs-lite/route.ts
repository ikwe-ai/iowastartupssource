import { NextResponse } from "next/server";
import { listProgramsLite } from "@/lib/notion";

export async function GET() {
  try {
    const items = await listProgramsLite();
    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load programs" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createSuggestion } from "@/lib/notion";

export async function POST(req: Request) {
  const form = await req.formData();
  const programId = (form.get("program_id") as string | null)?.trim() || undefined;
  const notes = (form.get("notes") as string | null)?.trim();
  const submitterEmail = (form.get("submitter_email") as string | null)?.trim() || undefined;

  if (!notes) {
    return NextResponse.json({ error: "Missing notes" }, { status: 400 });
  }

  await createSuggestion({ programId, notes, submitterEmail });

  // Redirect back
  return NextResponse.redirect(new URL("/", req.url), 303);
}

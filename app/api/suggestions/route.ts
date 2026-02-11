import { NextResponse } from "next/server";
import { createSuggestion } from "@/lib/notion";

function parseCsv(v: string | null): string[] {
  if (!v) return [];
  return v
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export async function POST(req: Request) {
  const form = await req.formData();
  const title = (form.get("title") as string | null)?.trim() || "";
  const suggestionType = (form.get("suggestion_type") as string | null)?.trim() || "Other";
  const relatedProgramId = (form.get("related_program_id") as string | null)?.trim() || undefined;
  const programUrl = (form.get("program_url") as string | null)?.trim() || undefined;
  const provider = (form.get("provider") as string | null)?.trim() || undefined;
  const category = parseCsv(form.get("category") as string | null);
  const stage = parseCsv(form.get("stage") as string | null);
  const whatYouGet = (form.get("what_you_get") as string | null)?.trim() || undefined;
  const eligibility = (form.get("eligibility") as string | null)?.trim() || undefined;
  const proposedChange = (form.get("proposed_change") as string | null)?.trim() || undefined;
  const evidenceUrl = (form.get("evidence_url") as string | null)?.trim() || undefined;
  const notes = (form.get("notes") as string | null)?.trim() || undefined;
  const submitterEmail = (form.get("submitter_email") as string | null)?.trim() || undefined;

  if (!title) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }

  await createSuggestion({
    title,
    suggestionType,
    relatedProgramId,
    programUrl,
    provider,
    category,
    stage,
    whatYouGet,
    eligibility,
    proposedChange,
    submitterEmail,
    evidenceUrl,
    notes,
  });

  // Redirect back
  return NextResponse.redirect(new URL("/", req.url), 303);
}

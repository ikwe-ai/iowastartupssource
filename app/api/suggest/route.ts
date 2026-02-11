import { NextResponse } from "next/server";
import { createSuggestion, type SuggestionType } from "@/lib/notion";

const ALLOWED_TYPES: SuggestionType[] = ["New Program", "Update Existing", "Broken Link", "Other"];

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const title = String(body.title || "").trim();
    if (!title) {
      return NextResponse.json({ ok: false, error: "Missing title" }, { status: 400 });
    }

    const suggestionType = String(body.suggestionType || "New Program").trim() as SuggestionType;
    const safeType: SuggestionType = ALLOWED_TYPES.includes(suggestionType) ? suggestionType : "Other";

    const id = await createSuggestion({
      title,
      suggestionType: safeType,
      relatedProgramId: body.relatedProgramId || "",
      programUrl: body.programUrl || "",
      provider: body.provider || "",
      category: Array.isArray(body.category) ? body.category : [],
      stage: Array.isArray(body.stage) ? body.stage : [],
      whatYouGet: body.whatYouGet || "",
      eligibility: body.eligibility || "",
      proposedChange: body.proposedChange || "",
      evidenceUrl: body.evidenceUrl || "",
      submitterEmail: body.submitterEmail || "",
      programId: body.programId || "",
      notes: body.notes || "",
    });

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}

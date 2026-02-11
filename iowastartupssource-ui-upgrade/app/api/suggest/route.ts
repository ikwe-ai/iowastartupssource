import { NextResponse } from "next/server";
import { createSuggestion, normalizeSuggestionType } from "@/lib/notion";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const suggestion = {
      title: String(body.title || body.name || ""),
      suggestionType: normalizeSuggestionType(body.suggestionType),
      relatedProgramId: body.relatedProgramId ? String(body.relatedProgramId) : undefined,
      programId: body.programId ? String(body.programId) : undefined,
      programUrl: body.programUrl ? String(body.programUrl) : undefined,
      provider: body.provider ? String(body.provider) : undefined,
      category: Array.isArray(body.category) ? body.category.map(String) : undefined,
      stage: Array.isArray(body.stage) ? body.stage.map(String) : undefined,
      whatYouGet: body.whatYouGet ? String(body.whatYouGet) : undefined,
      eligibility: body.eligibility ? String(body.eligibility) : undefined,
      proposedChange: body.proposedChange ? String(body.proposedChange) : undefined,
      evidenceUrl: body.evidenceUrl ? String(body.evidenceUrl) : undefined,
      submitterEmail: body.submitterEmail ? String(body.submitterEmail) : undefined,
    };

    if (!suggestion.title) {
      return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    const id = await createSuggestion(suggestion);
    return NextResponse.json({ ok: true, id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to submit" },
      { status: 500 }
    );
  }
}

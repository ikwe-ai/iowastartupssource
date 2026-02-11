import { NextResponse } from "next/server";
import { createSuggestion, normalizeSuggestionType } from "@/lib/notion";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const title = String(body.title || "").trim();
    if (!title) {
      return NextResponse.json({ ok: false, error: "Missing title" }, { status: 400 });
    }

    const safeType = normalizeSuggestionType(body.suggestionType);

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

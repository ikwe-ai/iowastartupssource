import { NextResponse } from "next/server";
import { createSuggestion } from "@/lib/notion";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const title = String(body.title || "").trim();
    const suggestionType = String(body.suggestionType || "New Program").trim();

    if (!title) {
      return NextResponse.json({ ok: false, error: "Missing title" }, { status: 400 });
    }

    const id = await createSuggestion({
      title,
      suggestionType,
      programUrl: body.programUrl || "",
      provider: body.provider || "",
      category: Array.isArray(body.category) ? body.category : [],
      stage: Array.isArray(body.stage) ? body.stage : [],
      whatYouGet: body.whatYouGet || "",
      eligibility: body.eligibility || "",
      proposedChange: body.proposedChange || "",
      relatedProgramId: body.relatedProgramId || "",
      evidenceUrl: body.evidenceUrl || "",
      submitterEmail: body.submitterEmail || "",
      notes: body.notes || "",
    });

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}

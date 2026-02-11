import { getProgram } from "@/lib/notion";
import Link from "next/link";

export default async function ProgramDetail({ params }: { params: { id: string } }) {
  const p = await getProgram(params.id);

  if (!p) return <div className="rounded-2xl border bg-white/80 p-6 text-red-600">Program not found.</div>;

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center rounded-full border bg-white px-3 py-1.5 text-sm hover:bg-zinc-50">
        ← Back to directory
      </Link>

      <div className="rounded-3xl border bg-white/80 p-6 shadow-sm backdrop-blur">
        <h1 className="text-3xl font-semibold tracking-tight">{p.name || "Untitled Program"}</h1>
        <div className="mt-1 text-zinc-600">{p.provider}</div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {(p.category || []).map((c) => (
          <span key={c} className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-700">{c}</span>
        ))}
        {p.requiresReferral && <span className="rounded-full border px-2 py-1">Referral</span>}
        {p.geo && <span className="rounded-full border px-2 py-1">{p.geo}</span>}
        {p.confidence && <span className="rounded-full border px-2 py-1">Confidence: {p.confidence}</span>}
        {p.needsReview && <span className="rounded-full border px-2 py-1">Needs review</span>}
      </div>

      {p.eligibilitySummary && (
        <div className="rounded-2xl border bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="font-medium mb-1">Eligibility</div>
          <div className="opacity-90">{p.eligibilitySummary}</div>
        </div>
      )}

      <div className="rounded-2xl border bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="mb-3 text-sm font-medium text-zinc-700">Program links</div>
        <div className="grid gap-2">
        {p.applyUrl && (
          <a className="underline" href={p.applyUrl} target="_blank" rel="noreferrer">
            Apply / program page
          </a>
        )}
        {p.sourceUrl && (
          <a className="underline" href={p.sourceUrl} target="_blank" rel="noreferrer">
            Source
          </a>
        )}
        </div>
      </div>

      <div className="rounded-2xl border bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="font-medium mb-2">Suggest an update</div>
        <p className="mb-4 text-sm text-zinc-600">
          Found outdated eligibility, value, or links? Send a structured update for review.
        </p>
        <Link
          href={`/submit?suggestionType=Update%20Existing&relatedProgramId=${encodeURIComponent(p.id)}&title=${encodeURIComponent(p.name || "Program update")}&programUrl=${encodeURIComponent(p.applyUrl || "")}`}
          className="inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
        >
          Open update form
        </Link>
      </div>
    </div>
  );
}

import { getProgram } from "@/lib/notion";

export default async function ProgramDetail({ params }: { params: { id: string } }) {
  const p = await getProgram(params.id);

  if (!p) return <div className="text-red-600">Program not found.</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{p.name || "Untitled Program"}</h1>
        <div className="opacity-80">{p.provider}</div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {(p.category || []).map((c) => (
          <span key={c} className="rounded-full border px-2 py-1">{c}</span>
        ))}
        {p.requiresReferral && <span className="rounded-full border px-2 py-1">Referral</span>}
        {p.geo && <span className="rounded-full border px-2 py-1">{p.geo}</span>}
        {p.confidence && <span className="rounded-full border px-2 py-1">{p.confidence}</span>}
        {p.needsReview && <span className="rounded-full border px-2 py-1">Needs review</span>}
      </div>

      {p.eligibilitySummary && (
        <div className="rounded-lg border p-4">
          <div className="font-medium mb-1">Eligibility</div>
          <div className="opacity-90">{p.eligibilitySummary}</div>
        </div>
      )}

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

      <div className="rounded-lg border p-4">
        <div className="font-medium mb-2">Suggest an update</div>
        <form action="/api/suggestions" method="post" className="space-y-2">
          <input type="hidden" name="program_id" value={p.id} />
          <textarea
            name="notes"
            className="w-full rounded border p-2"
            rows={4}
            placeholder="What should be updated? (credits amount, eligibility, link, etc.)"
            required
          />
          <input
            name="submitter_email"
            className="w-full rounded border p-2"
            placeholder="Email (optional)"
          />
          <button className="rounded bg-black px-3 py-2 text-white" type="submit">
            Submit suggestion
          </button>
        </form>
      </div>
    </div>
  );
}

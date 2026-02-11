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
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {p.status === "Active" && !p.needsReview ? (
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Verified entry
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border px-3 py-1 text-zinc-600">
              Community entry
            </span>
          )}
          {p.linkStatus && <span className="text-zinc-600">Link: {p.linkStatus}</span>}
          {p.lastVerifiedAt && <span className="text-zinc-600">• checked {p.lastVerifiedAt}</span>}
        </div>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{p.name || "Untitled Program"}</h1>
        <div className="mt-1 text-zinc-600">{p.provider}</div>

        <div className="mt-4 flex flex-wrap gap-2">
          {p.applyUrl && (
            <a
              href={p.applyUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-black px-4 py-2 text-sm text-white hover:opacity-90"
            >
              Apply
            </a>
          )}
          {p.sourceUrl && (
            <a
              href={p.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border px-4 py-2 text-sm hover:bg-zinc-50"
            >
              Official source
            </a>
          )}
        </div>
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

      {(p.valueUsdEst || p.offerType || p.stage?.length || p.lastVerifiedAt || p.linkStatus || typeof p.httpStatus === "number") && (
        <div className="rounded-2xl border bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="mb-3 text-sm font-medium text-zinc-700">Founder snapshot</div>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            {p.offerType && <div><span className="font-medium">Type:</span> {p.offerType}</div>}
            {typeof p.valueUsdEst === "number" && <div><span className="font-medium">Estimated value:</span> ${p.valueUsdEst.toLocaleString()}</div>}
            {!!p.stage?.length && <div><span className="font-medium">Stage:</span> {p.stage.join(", ")}</div>}
            {p.lastVerifiedAt && <div><span className="font-medium">Last verified:</span> {p.lastVerifiedAt}</div>}
            {p.linkStatus && <div><span className="font-medium">Link status:</span> {p.linkStatus}</div>}
            {typeof p.httpStatus === "number" && <div><span className="font-medium">HTTP status:</span> {p.httpStatus}</div>}
          </div>
        </div>
      )}

      {p.whatYouGet && (
        <div className="rounded-2xl border bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="font-medium mb-1">What you get</div>
          <div className="opacity-90">{p.whatYouGet}</div>
        </div>
      )}

      {p.eligibilitySummary && (
        <div className="rounded-2xl border bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="font-medium mb-1">Who it's for</div>
          <div className="opacity-90">{p.eligibilitySummary}</div>
        </div>
      )}

      {p.howToApply && (
        <div className="rounded-2xl border bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="font-medium mb-1">How to apply</div>
          <div className="opacity-90">{p.howToApply}</div>
        </div>
      )}

      <div className="rounded-2xl border bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="mb-3 text-sm font-medium text-zinc-700">Verification</div>
        <div className="grid gap-2">
        {p.applyUrl && (
          <a className="underline" href={p.applyUrl} target="_blank" rel="noreferrer">
            Apply URL
          </a>
        )}
        {p.sourceUrl && (
          <a className="underline" href={p.sourceUrl} target="_blank" rel="noreferrer">
            Source URL
          </a>
        )}
        {p.finalUrl && p.finalUrl !== p.applyUrl && (
          <a className="underline" href={p.finalUrl} target="_blank" rel="noreferrer">
            Final destination URL
          </a>
        )}
        </div>
      </div>

      {(p.sourceSummary || p.autoSummary || p.notes) && (
        <div className="rounded-2xl border bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="mb-3 text-sm font-medium text-zinc-700">Source notes</div>
          <div className="grid gap-3 text-sm text-zinc-700">
            {p.sourceSummary && (
              <div>
                <div className="font-medium">Source summary</div>
                <div className="opacity-90">{p.sourceSummary}</div>
              </div>
            )}
            {p.autoSummary && (
              <div>
                <div className="font-medium">Auto summary</div>
                <div className="opacity-90">{p.autoSummary}</div>
              </div>
            )}
            {p.notes && (
              <div>
                <div className="font-medium">Notes</div>
                <div className="opacity-90">{p.notes}</div>
              </div>
            )}
          </div>
        </div>
      )}

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

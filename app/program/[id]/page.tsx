import { getProgram } from "@/lib/notion";
import ProgramActionPanel from "@/components/ProgramActionPanel";
import Link from "next/link";

function toBullets(text?: string): string[] {
  if (!text) return [];
  const normalized = text
    .replace(/\r/g, "\n")
    .split(/\n|•|;|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const unique: string[] = [];
  for (const item of normalized) {
    if (unique.some((u) => u.toLowerCase() === item.toLowerCase())) continue;
    unique.push(item);
    if (unique.length >= 5) break;
  }
  return unique;
}

export default async function ProgramDetail({ params }: { params: { id: string } }) {
  const p = await getProgram(params.id);

  if (!p) return <div className="rounded-2xl border bg-white/80 p-6 text-red-600">Program not found.</div>;

  const whatBullets = toBullets(p.whatYouGet);
  const eligibilityBullets = toBullets(p.eligibilitySummary);
  const applyBullets = toBullets(p.howToApply);
  const readiness = [whatBullets.length > 0, eligibilityBullets.length > 0, applyBullets.length > 0].filter(Boolean).length;
  const updateHref = `/submit?suggestionType=Update%20Existing&relatedProgramId=${encodeURIComponent(
    p.programId || p.id,
  )}&title=${encodeURIComponent(p.name || "Program update")}&programUrl=${encodeURIComponent(p.applyUrl || "")}`;

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center rounded-full border bg-white px-3 py-1.5 text-sm hover:bg-zinc-50">
        ← Back to directory
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="rounded-3xl border bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {p.status === "Active" && !p.needsReview ? (
                <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Verified entry
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border px-3 py-1 text-zinc-600">Community entry</span>
              )}
              {p.linkStatus && <span className="text-zinc-600">Link: {p.linkStatus}</span>}
              {p.lastVerifiedAt && <span className="text-zinc-600">• checked {p.lastVerifiedAt}</span>}
              <span className={`rounded-full px-2.5 py-1 ${readiness === 3 ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>
                Profile {readiness}/3
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">{p.name || "Untitled Program"}</h1>
            <div className="mt-1 text-zinc-600">{p.provider}</div>
            <p className="mt-2 text-sm text-zinc-700">
              {p.founderSnapshot || p.whatYouGet || p.sourceSummary || "Review value, fit, and effort before applying."}
            </p>
            <p className="mt-2 text-xs text-zinc-500">Verified entries only • community suggestions reviewed before publish</p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {(p.category || []).map((c) => (
                <span key={c} className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-700">{c}</span>
              ))}
              {p.requiresReferral && <span className="rounded-full border px-2 py-1">Referral required</span>}
              {p.geo && <span className="rounded-full border px-2 py-1">{p.geo}</span>}
              {p.confidence && <span className="rounded-full border px-2 py-1">Confidence: {p.confidence}</span>}
              {p.needsReview && <span className="rounded-full border px-2 py-1">Needs review</span>}
            </div>
          </div>

          <div className="rounded-2xl border bg-white/90 p-5 shadow-sm backdrop-blur">
            <div className="mb-2 text-sm font-medium text-zinc-700">Founder snapshot</div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div><span className="font-medium">Type:</span> {p.offerType || "Not specified"}</div>
              <div><span className="font-medium">Stage:</span> {p.stage?.length ? p.stage.join(", ") : "Not specified"}</div>
              <div><span className="font-medium">Estimated value:</span> {typeof p.valueUsdEst === "number" ? `$${p.valueUsdEst.toLocaleString()}` : "Not specified"}</div>
              <div><span className="font-medium">Time to apply:</span> {applyBullets.length >= 4 ? "~45 min" : applyBullets.length >= 2 ? "~20 min" : "~10 min"}</div>
              <div><span className="font-medium">Link status:</span> {p.linkStatus || "Unknown"}</div>
              <div><span className="font-medium">HTTP status:</span> {typeof p.httpStatus === "number" ? p.httpStatus : "Unknown"}</div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white/90 p-5 shadow-sm backdrop-blur">
            <div className="font-medium mb-1">What you get</div>
            {whatBullets.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-800">
                {whatBullets.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm italic text-zinc-500">Missing summary. Use “Suggest update” to add details.</p>
            )}
          </div>

          <div className="rounded-2xl border bg-white/90 p-5 shadow-sm backdrop-blur">
            <div className="font-medium mb-1">Eligibility</div>
            {eligibilityBullets.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-800">
                {eligibilityBullets.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm italic text-zinc-500">Eligibility details are missing.</p>
            )}
          </div>

          <div className="rounded-2xl border bg-white/90 p-5 shadow-sm backdrop-blur">
            <div className="font-medium mb-1">How to apply</div>
            {applyBullets.length > 0 ? (
              <ol className="list-decimal pl-5 space-y-1 text-sm text-zinc-800">
                {applyBullets.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
            ) : (
              <p className="text-sm italic text-zinc-500">Application steps are missing.</p>
            )}
          </div>

          <div className="rounded-2xl border bg-white/90 p-5 shadow-sm backdrop-blur">
            <div className="mb-3 text-sm font-medium text-zinc-700">Verification + references</div>
            <div className="grid gap-2 text-sm">
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
            <div className="rounded-2xl border bg-white/90 p-5 shadow-sm backdrop-blur">
              <div className="mb-3 text-sm font-medium text-zinc-700">Gotchas / Notes</div>
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

          <div className="rounded-2xl border bg-white/90 p-5 shadow-sm backdrop-blur">
            <div className="font-medium mb-2">Suggest an update</div>
            <p className="mb-4 text-sm text-zinc-600">
              Found outdated value, eligibility, or links? Send a structured update for review.
            </p>
            <Link href={updateHref} className="inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800">
              Open update form
            </Link>
            {p.programId && <div className="mt-3 text-xs text-zinc-500">Program ID: {p.programId}</div>}
          </div>
        </div>

        <ProgramActionPanel
          programId={p.id}
          programName={p.name}
          applyUrl={p.applyUrl}
          sourceUrl={p.sourceUrl}
          finalUrl={p.finalUrl}
          updateHref={updateHref}
        />
      </div>
    </div>
  );
}

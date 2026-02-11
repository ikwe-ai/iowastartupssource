import Link from "next/link";
import { getProgramById } from "@/lib/notion";

export const dynamic = "force-dynamic";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border bg-white px-3 py-1 text-sm text-neutral-700">
      {children}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-3 text-neutral-700">{children}</div>
    </section>
  );
}

export default async function ProgramPage({ params }: { params: { id: string } }) {
  const program = await getProgramById(params.id);

  if (!program) {
    return (
      <div className="rounded-2xl border bg-white p-8">
        <h1 className="text-2xl font-semibold">Program not found</h1>
        <p className="mt-2 text-neutral-600">It may have been removed or is currently under review.</p>
        <div className="mt-6">
          <Link className="btn" href="/">Back to directory</Link>
        </div>
      </div>
    );
  }

  const applyHref = program.applyUrl || program.finalUrl || program.sourceUrl || "";
  const officialHref = program.sourceUrl || program.finalUrl || program.applyUrl || "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border bg-gradient-to-b from-white to-neutral-50 p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-neutral-500">{program.provider || ""}</p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight">{program.name}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {program.categories.map((c) => (
                <Pill key={c}>{c}</Pill>
              ))}
              {program.stage.length > 0 && <Pill>Stage: {program.stage.join(", ")}</Pill>}
              {program.confidence && <Pill>Confidence: {program.confidence}</Pill>}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {applyHref && (
              <a className="btn" href={applyHref} target="_blank" rel="noreferrer">
                Apply
              </a>
            )}
            {officialHref && (
              <a className="btn-secondary" href={officialHref} target="_blank" rel="noreferrer">
                Official source
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main */}
        <div className="space-y-6">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Founder snapshot</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Value</p>
                <p className="mt-2 text-sm text-neutral-700">
                  {program.whatYouGet || program.summary || "Credits / perk details listed on the official page."}
                </p>
              </div>
              <div className="rounded-xl border bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Fit</p>
                <p className="mt-2 text-sm text-neutral-700">
                  {program.eligibilityDetailed || program.eligibility || program.stage.join(", ") || "Check eligibility on the official page."}
                </p>
              </div>
              <div className="rounded-xl border bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Effort</p>
                <p className="mt-2 text-sm text-neutral-700">
                  {program.timeToApplyMin
                    ? `${program.timeToApplyMin} min to apply (estimate)`
                    : "Time to apply: unknown (we’ll label it once verified)."}
                </p>
              </div>
            </div>
          </section>

          {program.howToApply && (
            <Section title="How to apply">
              <p className="whitespace-pre-line">{program.howToApply}</p>
            </Section>
          )}

          {(program.whatYouGet || program.summary) && (
            <Section title="What you get">
              <p className="whitespace-pre-line">{program.whatYouGet || program.summary}</p>
            </Section>
          )}

          {(program.eligibilityDetailed || program.eligibility) && (
            <Section title="Eligibility">
              <p className="whitespace-pre-line">{program.eligibilityDetailed || program.eligibility}</p>
            </Section>
          )}

          <Section title="Verification">
            <div className="grid gap-2 text-sm">
              {program.applyUrl && (
                <div>
                  <span className="text-neutral-500">Apply URL:</span> {" "}
                  <a className="link" href={program.applyUrl} target="_blank" rel="noreferrer">
                    {program.applyUrl}
                  </a>
                </div>
              )}
              {program.sourceUrl && (
                <div>
                  <span className="text-neutral-500">Source URL:</span> {" "}
                  <a className="link" href={program.sourceUrl} target="_blank" rel="noreferrer">
                    {program.sourceUrl}
                  </a>
                </div>
              )}
              {program.finalUrl && (
                <div>
                  <span className="text-neutral-500">Final URL:</span> {" "}
                  <a className="link" href={program.finalUrl} target="_blank" rel="noreferrer">
                    {program.finalUrl}
                  </a>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                {program.linkStatus && <Pill>Link: {program.linkStatus}</Pill>}
                {typeof program.httpStatus === "number" && <Pill>HTTP: {program.httpStatus}</Pill>}
                {program.lastVerified && <Pill>Verified: {program.lastVerified}</Pill>}
              </div>
            </div>
          </Section>
        </div>

        {/* Action rail */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold">Next action</p>
            <p className="mt-1 text-sm text-neutral-600">Open the official page, then come back and mark what you learned.</p>
            <div className="mt-4 flex flex-col gap-2">
              {applyHref && (
                <a className="btn" href={applyHref} target="_blank" rel="noreferrer">
                  Apply now
                </a>
              )}
              {officialHref && (
                <a className="btn-secondary" href={officialHref} target="_blank" rel="noreferrer">
                  View official source
                </a>
              )}
              <Link className="btn-ghost" href="/">
                Back to directory
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold">Suggest an update</p>
            <p className="mt-1 text-sm text-neutral-600">
              Found outdated eligibility, value, or links? Send a structured update for review.
            </p>

            <form className="mt-4 space-y-3" action="/api/suggest" method="POST">
              <input type="hidden" name="relatedProgramId" value={program.id} />
              <input type="hidden" name="title" value={program.name} />
              <input type="hidden" name="suggestionType" value="Update Existing" />
              <textarea
                name="proposedChange"
                className="w-full rounded-xl border px-3 py-2 text-sm"
                rows={4}
                placeholder="What changed? (e.g., new URL, updated eligibility, new credit amount...)"
              />
              <input
                name="evidenceUrl"
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="Evidence / source URL (optional)"
              />
              <input name="submitterEmail" className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Your email" />
              <button className="btn w-full" type="submit">
                Send update
              </button>
              <p className="text-xs text-neutral-500">Updates land in a review queue before anything changes publicly.</p>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}

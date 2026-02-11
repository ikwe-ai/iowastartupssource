import Link from "next/link";
import { listPrograms, type Program } from "@/lib/notion";

type PriorityRow = {
  id: string;
  name: string;
  provider: string;
  readiness: number;
  priority: number;
  gaps: string[];
  whatLen: number;
  eligibilityLen: number;
  applyLen: number;
  linkStatus?: string;
  confidence?: string;
  needsReview?: boolean;
};

function len(value?: string) {
  return String(value || "").replace(/\s+/g, " ").trim().length;
}

function fieldPenalty(length: number, strongMin: number, weakMin: number) {
  if (length >= strongMin) return 0;
  if (length >= weakMin) return 1;
  if (length > 0) return 2;
  return 3;
}

function assess(program: Program): PriorityRow {
  const whatLen = len(program.whatYouGet);
  const eligibilityLen = len(program.eligibilitySummary);
  const applyLen = len(program.howToApply);

  const whatPenalty = fieldPenalty(whatLen, 120, 60);
  const eligibilityPenalty = fieldPenalty(eligibilityLen, 100, 50);
  const applyPenalty = fieldPenalty(applyLen, 90, 45);

  const readiness = [whatPenalty, eligibilityPenalty, applyPenalty].filter((x) => x === 0).length;
  const missingCount = [whatLen, eligibilityLen, applyLen].filter((x) => x === 0).length;

  let priority = whatPenalty + eligibilityPenalty + applyPenalty;
  if (missingCount >= 2) priority += 2;
  if (program.needsReview) priority += 2;
  if (String(program.confidence || "").toLowerCase() === "low") priority += 2;
  if (String(program.linkStatus || "").toLowerCase() === "broken") priority += 2;

  const gaps: string[] = [];
  if (whatPenalty > 0) gaps.push("What you get");
  if (eligibilityPenalty > 0) gaps.push("Eligibility");
  if (applyPenalty > 0) gaps.push("How to apply");

  return {
    id: program.id,
    name: program.name || "Untitled",
    provider: program.provider || "Unknown",
    readiness,
    priority,
    gaps,
    whatLen,
    eligibilityLen,
    applyLen,
    linkStatus: program.linkStatus,
    confidence: program.confidence,
    needsReview: program.needsReview,
  };
}

export const dynamic = "force-dynamic";

export default async function FillPriorityPage() {
  const programs = await listPrograms();
  const scored = programs.map(assess).sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name));
  const needFill = scored.filter((r) => r.readiness < 3);
  const readyCount = scored.length - needFill.length;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Admin Fill Priority</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Programs ranked by missing detail quality in <span className="font-medium">What you get</span>,{" "}
              <span className="font-medium">Eligibility</span>, and <span className="font-medium">How to apply</span>.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="rounded-full border px-4 py-2 text-sm hover:bg-zinc-50">
              Back to directory
            </Link>
            <Link href="/submit" className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800">
              Suggest update
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-zinc-100 px-3 py-1">Total: {scored.length}</span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">Need fill: {needFill.length}</span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-900">Ready: {readyCount}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white/80 shadow-sm backdrop-blur">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-600">
              <tr>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Program</th>
                <th className="px-4 py-3">Readiness</th>
                <th className="px-4 py-3">Gaps</th>
                <th className="px-4 py-3">Field Lengths</th>
                <th className="px-4 py-3">Signals</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {needFill.map((row) => (
                <tr key={row.id} className="border-t border-zinc-200 align-top">
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">{row.priority}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900">{row.name}</div>
                    <div className="text-xs text-zinc-600">{row.provider}</div>
                  </td>
                  <td className="px-4 py-3">{row.readiness}/3</td>
                  <td className="px-4 py-3">
                    {row.gaps.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {row.gaps.map((g) => (
                          <span key={g} className="rounded-full bg-zinc-100 px-2 py-1 text-xs">
                            {g}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-zinc-500">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-700">
                    <div>W: {row.whatLen}</div>
                    <div>E: {row.eligibilityLen}</div>
                    <div>A: {row.applyLen}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-700">
                    <div>Link: {row.linkStatus || "Unknown"}</div>
                    <div>Confidence: {row.confidence || "Unknown"}</div>
                    <div>Review: {row.needsReview ? "Yes" : "No"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/program/${row.id}`} className="rounded-full border px-3 py-1 text-xs hover:bg-zinc-50">
                        Open
                      </Link>
                      <Link
                        href={`/submit?suggestionType=Update%20Existing&relatedProgramId=${encodeURIComponent(row.id)}&title=${encodeURIComponent(
                          row.name,
                        )}`}
                        className="rounded-full bg-zinc-900 px-3 py-1 text-xs text-white hover:bg-zinc-800"
                      >
                        Update
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

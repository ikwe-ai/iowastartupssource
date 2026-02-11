import Link from "next/link";

type Program = {
  id: string;
  programId?: string;
  name: string;
  provider?: string;
  applyUrl?: string;
  category?: string[];
  stage?: string[];
  founderSnapshot?: string;
  whatYouGet?: string;
  eligibilitySummary?: string;
  howToApply?: string;
  autoSummary?: string;
  notes?: string;
  offerType?: string;
  valueUsdEst?: number;
  linkStatus?: string;
  lastVerifiedAt?: string;
  status?: string;
  needsReview?: boolean;
};

function daysAgo(iso?: string) {
  if (!iso) return null;
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return null;
  return Math.max(0, Math.round((Date.now() - ts) / (1000 * 60 * 60 * 24)));
}

function statusDot(status?: string) {
  const v = String(status || "").toLowerCase();
  if (v === "ok") return "bg-emerald-500";
  if (v === "redirect") return "bg-amber-500";
  if (v === "broken") return "bg-rose-500";
  return "bg-zinc-400";
}

function oneLine(text?: string, max = 120) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export default function ProgramCard({
  p,
  isSaved = false,
  onToggleSave,
}: {
  p: Program;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
}) {
  const verified = String(p.status || "").toLowerCase() === "active" && !p.needsReview;
  const summary = (p.founderSnapshot || p.whatYouGet || p.autoSummary || p.notes || "").trim();
  const valueLine = oneLine(
    p.whatYouGet ||
      (typeof p.valueUsdEst === "number" ? `Estimated value: $${p.valueUsdEst.toLocaleString()}` : "") ||
      (p.offerType ? `${p.offerType} program for startups.` : ""),
    220,
  );
  const qualifyLine = oneLine(p.eligibilitySummary || "", 200);
  const applyLine = oneLine(p.howToApply || "", 200);
  const ago = daysAgo(p.lastVerifiedAt);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold leading-snug">
              <Link href={`/program/${p.id}`} className="hover:underline">
                {p.name || "Untitled Program"}
              </Link>
            </h3>
            {p.provider ? <p className="truncate text-sm text-zinc-600">{p.provider}</p> : null}
          </div>

          {verified ? (
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Verified
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600">
              Community
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(p.category || []).slice(0, 3).map((c) => (
            <span key={c} className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-800">
              {c}
            </span>
          ))}
          {(p.stage || []).slice(0, 2).map((s) => (
            <span key={s} className="inline-flex items-center rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-700">
              {s}
            </span>
          ))}
        </div>

        <div className="mt-4 space-y-2 text-sm">
          {valueLine ? (
            <div>
              <div className="text-xs font-medium text-zinc-500">What you get</div>
              <p className="text-zinc-900">{valueLine}</p>
            </div>
          ) : null}
          {qualifyLine ? (
            <div>
              <div className="text-xs font-medium text-zinc-500">Who it&apos;s for</div>
              <p className="text-zinc-800">{qualifyLine}</p>
            </div>
          ) : null}
          {applyLine ? (
            <div>
              <div className="text-xs font-medium text-zinc-500">How to apply</div>
              <p className="text-zinc-800">{applyLine}</p>
            </div>
          ) : null}
          {!valueLine && !qualifyLine && !applyLine ? (
            summary ? (
              <p className="text-zinc-800">{oneLine(summary, 240)}</p>
            ) : (
              <p className="italic text-zinc-500">No summary yet - suggest an update.</p>
            )
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-5 pb-5">
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <span className={`h-2 w-2 rounded-full ${statusDot(p.linkStatus)}`} />
          <span>{p.linkStatus ? `Link: ${p.linkStatus}` : "Link: Unknown"}</span>
          {ago !== null ? <span>• checked {ago}d ago</span> : null}
        </div>

        <div className="flex items-center gap-2">
          {onToggleSave ? (
            <button
              type="button"
              onClick={() => onToggleSave(p.id)}
              className={`rounded-full border px-4 py-2 text-sm ${
                isSaved ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              {isSaved ? "Saved" : "Save"}
            </button>
          ) : null}
          <Link href={`/program/${p.id}`} className="rounded-full bg-black px-4 py-2 text-sm text-white hover:opacity-90">
            Read details
          </Link>
          {p.applyUrl ? (
            <a
              href={p.applyUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50"
            >
              Apply
            </a>
          ) : (
            <Link href="/submit" className="rounded-full bg-black px-4 py-2 text-sm text-white hover:opacity-90">
              Add link
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState, type FormEvent } from "react";

const SUGGESTION_TYPES = ["New Program", "Update Existing", "Broken Link", "Other"] as const;

type SuggestionType = (typeof SUGGESTION_TYPES)[number];

export default function SubmitPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ ok: boolean; msg: string } | null>(null);

  const [suggestionType, setSuggestionType] = useState<SuggestionType>("New Program");
  const [title, setTitle] = useState("");
  const [programUrl, setProgramUrl] = useState("");
  const [provider, setProvider] = useState("");
  const [category, setCategory] = useState("");
  const [stage, setStage] = useState("");
  const [whatYouGet, setWhatYouGet] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [proposedChange, setProposedChange] = useState("");
  const [relatedProgramId, setRelatedProgramId] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");

  const categoryArr = useMemo(() => category.split(",").map((s) => s.trim()).filter(Boolean), [category]);
  const stageArr = useMemo(() => stage.split(",").map((s) => s.trim()).filter(Boolean), [stage]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setDone(null);

    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestionType,
          title,
          programUrl,
          provider,
          category: categoryArr,
          stage: stageArr,
          whatYouGet,
          eligibility,
          proposedChange,
          relatedProgramId,
          evidenceUrl,
          submitterEmail,
        }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Submission failed");

      setDone({ ok: true, msg: "Submitted. Thank you - this goes into review before publishing." });
      setTitle("");
      setProgramUrl("");
      setProvider("");
      setCategory("");
      setStage("");
      setWhatYouGet("");
      setEligibility("");
      setProposedChange("");
      setRelatedProgramId("");
      setEvidenceUrl("");
      setSubmitterEmail("");
      setSuggestionType("New Program");
    } catch (err: any) {
      setDone({ ok: false, msg: err?.message || "Something went wrong." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-3xl border bg-white/80 backdrop-blur p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Suggest a program</h1>
        <p className="mt-2 text-zinc-600">
          Submissions land in a review inbox. Nothing goes public until verified.
        </p>
      </div>

      <form onSubmit={onSubmit} className="rounded-3xl border bg-white/80 backdrop-blur p-6 shadow-sm space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Suggestion type</label>
            <select
              className="mt-1 w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              value={suggestionType}
              onChange={(e) => setSuggestionType(e.target.value as SuggestionType)}
            >
              {SUGGESTION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Your email (optional)</label>
            <input
              className="mt-1 w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              value={submitterEmail}
              onChange={(e) => setSubmitterEmail(e.target.value)}
              placeholder="so we can follow up if needed"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Program name / headline</label>
          <input
            className="mt-1 w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Google for Startups Cloud Program"
            required
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Program URL</label>
            <input
              className="mt-1 w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              value={programUrl}
              onChange={(e) => setProgramUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Provider</label>
            <input
              className="mt-1 w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="e.g., AWS, Google, State of Iowa"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Category (comma-separated)</label>
            <input
              className="mt-1 w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Cloud Credits, LLM/API Credits, Accelerator..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Stage (comma-separated)</label>
            <input
              className="mt-1 w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              placeholder="Idea, MVP, Pre-seed, Seed..."
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">What you get</label>
            <textarea
              className="mt-1 w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              value={whatYouGet}
              onChange={(e) => setWhatYouGet(e.target.value)}
              placeholder="e.g., up to $25k credits + partner support"
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Eligibility</label>
            <textarea
              className="mt-1 w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value)}
              placeholder="e.g., incorporated, under $X funding, partner referral..."
              rows={3}
            />
          </div>
        </div>

        {(suggestionType === "Update Existing" || suggestionType === "Broken Link") && (
          <div className="rounded-2xl border bg-white p-4 space-y-3">
            <div className="text-sm font-medium">Update details</div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm">Related Program ID (optional)</label>
                <input
                  className="mt-1 w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                  value={relatedProgramId}
                  onChange={(e) => setRelatedProgramId(e.target.value)}
                  placeholder="Paste the Program ID if you have it"
                />
              </div>
              <div>
                <label className="text-sm">Evidence / source URL (optional)</label>
                <input
                  className="mt-1 w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="Link showing updated info"
                />
              </div>
            </div>

            <div>
              <label className="text-sm">What changed?</label>
              <textarea
                className="mt-1 w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                value={proposedChange}
                onChange={(e) => setProposedChange(e.target.value)}
                placeholder="Describe the change clearly (credits amount, eligibility, new link, deadlines...)"
                rows={4}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            disabled={loading}
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit for review"}
          </button>
          <div className="text-xs text-zinc-500">
            Nothing is published until verified.
          </div>
        </div>

        {done && (
          <div className={`rounded-2xl border p-4 text-sm ${done.ok ? "bg-emerald-50" : "bg-rose-50"}`}>
            {done.msg}
          </div>
        )}
      </form>
    </div>
  );
}

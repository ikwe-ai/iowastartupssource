"use client";

import { useEffect, useMemo, useState } from "react";
import ProgramCard from "@/components/ProgramCard";

type Program = {
  id: string;
  programId?: string;
  name: string;
  provider: string;
  category: string[];
  founderSnapshot?: string;
  whatYouGet?: string;
  eligibilitySummary?: string;
  howToApply?: string;
  sourceSummary?: string;
  autoSummary?: string;
  notes?: string;
  stage?: string[];
  geo?: string;
  valueUsdEst?: number;
  offerType?: string;
  applyUrl?: string;
  linkStatus?: string;
  lastVerifiedAt?: string;
  status?: string;
  requiresReferral?: boolean;
  needsReview?: boolean;
};

export default function DirectoryFilters({
  programs,
  initialCategory = "",
  initialStage = "",
  initialQuery = "",
}: {
  programs: Program[];
  initialCategory?: string;
  initialStage?: string;
  initialQuery?: string;
}) {
  const [q, setQ] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [stage, setStage] = useState(initialStage);
  const [onlyIowa, setOnlyIowa] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sort, setSort] = useState<"provider" | "value">("provider");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const activeFilterCount = [q.trim(), category, stage, onlyIowa ? "iowa" : "", savedOnly ? "saved" : ""].filter(Boolean).length;

  function onSortChange(v: string) {
    setSort(v === "value" ? "value" : "provider");
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem("savedPrograms");
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        setSavedIds(arr.filter((x) => typeof x === "string"));
      }
    } catch {
      // no-op
    }
  }, []);

  function toggleSaved(id: string) {
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem("savedPrograms", JSON.stringify(next));
      } catch {
        // no-op
      }
      return next;
    });
  }

  const categories = useMemo(() => {
    const s = new Set<string>();
    programs.forEach((p) => (p.category || []).forEach((c) => s.add(c)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [programs]);

  const stages = useMemo(() => {
    const s = new Set<string>();
    programs.forEach((p) => (p.stage || []).forEach((x) => s.add(x)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [programs]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    let out = programs.filter((p) => {
      if (category && !(p.category || []).includes(category)) return false;
      if (stage && !(p.stage || []).includes(stage)) return false;

      if (onlyIowa) {
        const g = (p.geo || "").toLowerCase();
        if (!g.includes("iowa")) return false;
      }
      if (savedOnly && !savedIds.includes(p.id)) return false;

      if (query) {
        const hay = `${p.name} ${p.provider} ${(p.category || []).join(" ")} ${(p.stage || []).join(" ")} ${p.whatYouGet || ""} ${p.eligibilitySummary || ""} ${p.howToApply || ""} ${p.sourceSummary || ""} ${p.autoSummary || ""}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }

      return true;
    });

    if (sort === "value") {
      out = out.sort((a, b) => (b.valueUsdEst || 0) - (a.valueUsdEst || 0));
    } else {
      out = out.sort((a, b) => (a.provider || "").localeCompare(b.provider || "") || a.name.localeCompare(b.name));
    }

    return out;
  }, [programs, q, category, stage, onlyIowa, savedOnly, savedIds, sort]);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border bg-white/80 backdrop-blur p-4 shadow-sm">
        <div className="grid gap-2 md:grid-cols-4">
          <input
            className="w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            placeholder="Search (name, provider, category...)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            className="w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            className="w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            <option value="">All stages</option>
            {stages.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            className="w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="provider">Sort: Provider A→Z</option>
            <option value="value">Sort: Value high→low</option>
          </select>

          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" checked={onlyIowa} onChange={(e) => setOnlyIowa(e.target.checked)} />
            Iowa-only (geo contains &quot;Iowa&quot;)
          </label>

          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" checked={savedOnly} onChange={(e) => setSavedOnly(e.target.checked)} />
            Saved only
          </label>

          <button
            className="rounded-2xl border bg-white px-3 py-2 text-sm hover:bg-zinc-50 md:col-span-4"
            onClick={() => {
              setQ("");
              setCategory("");
              setStage("");
              setOnlyIowa(false);
              setSavedOnly(false);
              setSort("provider");
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="text-sm opacity-80">
        Showing <span className="font-medium">{filtered.length}</span> programs
        {activeFilterCount > 0 && (
          <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
            {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border bg-white/80 p-8 text-center shadow-sm backdrop-blur">
          <div className="text-lg font-medium">No programs match these filters.</div>
          <p className="mt-2 text-sm text-zinc-600">Try broadening your search or reset filters to see all approved entries.</p>
          <button
            className="mt-4 rounded-full border bg-white px-4 py-2 text-sm hover:bg-zinc-50"
            onClick={() => {
              setQ("");
              setCategory("");
              setStage("");
              setOnlyIowa(false);
              setSort("provider");
            }}
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => (
            <ProgramCard key={p.id} p={p} isSaved={savedIds.includes(p.id)} onToggleSave={toggleSaved} />
          ))}
        </div>
      )}
    </div>
  );
}

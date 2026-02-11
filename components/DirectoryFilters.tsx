"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Program = {
  id: string;
  name: string;
  provider: string;
  category: string[];
  stage?: string[];
  geo?: string;
  valueUsdEst?: number;
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
  const [sort, setSort] = useState<"provider" | "value">("provider");

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

      if (query) {
        const hay = `${p.name} ${p.provider} ${(p.category || []).join(" ")} ${(p.stage || []).join(" ")}`.toLowerCase();
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
  }, [programs, q, category, stage, onlyIowa, sort]);

  return (
    <div className="space-y-4">
      <div className="grid gap-2 md:grid-cols-4">
        <input
          className="w-full rounded border p-2"
          placeholder="Search (name, provider, category...)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select className="w-full rounded border p-2" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select className="w-full rounded border p-2" value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="">All stages</option>
          {stages.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select className="w-full rounded border p-2" value={sort} onChange={(e) => setSort(e.target.value as any)}>
          <option value="provider">Sort: Provider A→Z</option>
          <option value="value">Sort: Value high→low</option>
        </select>

        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" checked={onlyIowa} onChange={(e) => setOnlyIowa(e.target.checked)} />
          Iowa-only (geo contains "Iowa")
        </label>

        <button
          className="rounded border px-3 py-2 text-sm md:col-span-2"
          onClick={() => {
            setQ("");
            setCategory("");
            setStage("");
            setOnlyIowa(false);
            setSort("provider");
          }}
        >
          Reset
        </button>
      </div>

      <div className="text-sm opacity-80">
        Showing <span className="font-medium">{filtered.length}</span> programs
      </div>

      <div className="grid gap-3">
        {filtered.map((p) => (
          <Link key={p.id} href={`/program/${p.id}`} className="block rounded-lg border p-4 hover:bg-zinc-50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium">{p.name || "Untitled Program"}</div>
                <div className="text-sm opacity-80">{p.provider}</div>

                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {(p.category || []).slice(0, 4).map((c) => (
                    <span key={c} className="rounded-full border px-2 py-1">{c}</span>
                  ))}
                  {p.requiresReferral && <span className="rounded-full border px-2 py-1">Referral</span>}
                  {p.geo && <span className="rounded-full border px-2 py-1">{p.geo}</span>}
                </div>
              </div>

              <div className="text-sm opacity-80 text-right">
                {typeof p.valueUsdEst === "number" ? `$${p.valueUsdEst.toLocaleString()}` : ""}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

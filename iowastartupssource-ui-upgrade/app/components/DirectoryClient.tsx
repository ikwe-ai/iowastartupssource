"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Program } from "@/lib/notion";

type SortKey = "provider" | "name";

function uniqSorted(xs: string[]) {
  return Array.from(new Set(xs)).filter(Boolean).sort((a, b) => a.localeCompare(b));
}

export function DirectoryClient({ programs }: { programs: Program[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "";
  const initialStage = searchParams.get("stage") || "";

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [stage, setStage] = useState(initialStage);
  const [sort, setSort] = useState<SortKey>("provider");

  const categories = useMemo(
    () => uniqSorted(programs.flatMap((p) => p.categories || [])),
    [programs]
  );
  const stages = useMemo(() => uniqSorted(programs.flatMap((p) => p.stages || [])), [programs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = programs.filter((p) => {
      if (category && !(p.categories || []).includes(category)) return false;
      if (stage && !(p.stages || []).includes(stage)) return false;
      if (!q) return true;

      const hay = [
        p.name,
        p.provider,
        (p.categories || []).join(" "),
        (p.stages || []).join(" "),
        p.whatYouGet,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

    list = list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      return (a.provider || "").localeCompare(b.provider || "") || a.name.localeCompare(b.name);
    });
    return list;
  }, [programs, query, category, stage, sort]);

  function syncUrl(next: { q?: string; category?: string; stage?: string }) {
    const sp = new URLSearchParams(searchParams.toString());
    if (next.q !== undefined) {
      next.q ? sp.set("q", next.q) : sp.delete("q");
    }
    if (next.category !== undefined) {
      next.category ? sp.set("category", next.category) : sp.delete("category");
    }
    if (next.stage !== undefined) {
      next.stage ? sp.set("stage", next.stage) : sp.delete("stage");
    }
    const qs = sp.toString();
    router.replace(qs ? `/?${qs}` : "/");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <input
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                syncUrl({ q: v });
              }}
              placeholder="Search (name, provider, category…)"
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring"
            />
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <select
              value={category}
              onChange={(e) => {
                const v = e.target.value;
                setCategory(v);
                syncUrl({ category: v });
              }}
              className="rounded-xl border px-3 py-3 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={stage}
              onChange={(e) => {
                const v = e.target.value;
                setStage(v);
                syncUrl({ stage: v });
              }}
              className="rounded-xl border px-3 py-3 text-sm"
            >
              <option value="">All stages</option>
              {stages.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-xl border px-3 py-3 text-sm"
            >
              <option value="provider">Sort: Provider A→Z</option>
              <option value="name">Sort: Name A→Z</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
          <div>
            Showing <span className="font-medium text-gray-900">{filtered.length}</span> verified entries
          </div>
          <button
            onClick={() => {
              setQuery("");
              setCategory("");
              setStage("");
              syncUrl({ q: "", category: "", stage: "" });
            }}
            className="rounded-lg border bg-white px-3 py-1.5 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <ProgramCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}

function Pill({ children }: { children: any }) {
  return (
    <span className="inline-flex items-center rounded-full border bg-white px-2.5 py-1 text-xs text-gray-700">
      {children}
    </span>
  );
}

function metricLabel(s: string) {
  return s.length > 72 ? s.slice(0, 69) + "…" : s;
}

function ProgramCard({ p }: { p: Program }) {
  const value = p.whatYouGet || "Credits / perks (details inside)";
  const fit = p.eligibilityDetailed || (p.stages?.length ? `Stage: ${p.stages.join(", ")}` : "Who it’s for inside");
  const effort = p.timeToApplyMin ? `${p.timeToApplyMin} min` : "Unknown";

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold tracking-tight">{p.name}</div>
          <div className="mt-0.5 text-sm text-gray-600">{p.provider || ""}</div>
        </div>
        {p.confidence && <Pill>Confidence: {p.confidence}</Pill>}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(p.categories || []).slice(0, 3).map((c) => (
          <Pill key={c}>{c}</Pill>
        ))}
        {(p.stages || []).slice(0, 2).map((s) => (
          <Pill key={s}>{s}</Pill>
        ))}
      </div>

      <div className="mt-4 grid gap-3 rounded-xl bg-gray-50 p-3 text-sm">
        <div>
          <div className="text-xs font-medium text-gray-500">Value</div>
          <div className="text-gray-900">{metricLabel(value)}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs font-medium text-gray-500">Fit</div>
            <div className="text-gray-900">{metricLabel(fit)}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500">Effort</div>
            <div className="text-gray-900">{effort}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={`/program/${p.id}`}
          className="inline-flex items-center justify-center rounded-xl border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          View details
        </a>
        {p.applyUrl ? (
          <a
            href={p.finalUrl || p.applyUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Apply
          </a>
        ) : null}
      </div>
    </div>
  );
}

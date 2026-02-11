import Link from "next/link";
import { listPrograms } from "@/lib/notion";

export default async function Home() {
  const programs = await listPrograms();

  // lightweight sort: provider then name
  programs.sort((a, b) => (a.provider || "").localeCompare(b.provider || "") || a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Credits & perks directory</h1>
        <p className="opacity-80">
          A living list of startup credits, perks, and Iowa ecosystem programs. Use <a className="underline" href="/submit">Suggest</a> to add or update.
        </p>
      </div>

      <div className="grid gap-3">
        {programs.map((p) => (
          <Link
            key={p.id}
            href={`/program/${p.id}`}
            className="block rounded-lg border p-4 hover:bg-zinc-50"
          >
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
                  {p.needsReview && <span className="rounded-full border px-2 py-1">Needs review</span>}
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

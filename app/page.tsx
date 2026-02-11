import DirectoryFilters from "@/components/DirectoryFilters";
import { listPrograms } from "@/lib/notion";

export default async function Home({
  searchParams,
}: {
  searchParams?: { q?: string; category?: string; stage?: string };
}) {
  const programs = await listPrograms();

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-white p-8 shadow-sm">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-zinc-600">
            Iowa ecosystem resource • updated by community
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            Find credits & programs that extend runway
          </h1>

          <p className="max-w-3xl text-zinc-600">
            A curated directory of startup credits, perks, accelerators, and non-dilutive programs for Iowa founders.
            Verified entries only (Active + not flagged for review).
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="/submit"
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
            >
              Suggest a program
            </a>
            <a
              href="/about"
              className="rounded-full border bg-white px-4 py-2 text-sm hover:bg-zinc-50"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <a className="rounded-2xl border bg-white p-6 shadow-sm hover:bg-zinc-50" href="/?category=LLM%2FAPI%20Credits">
          <div className="text-sm text-zinc-500">Stack</div>
          <div className="mt-1 text-lg font-semibold">AI Credits</div>
          <div className="mt-2 text-sm text-zinc-600">LLM/API credits to apply for this week.</div>
        </a>

        <a className="rounded-2xl border bg-white p-6 shadow-sm hover:bg-zinc-50" href="/?category=Cloud%20Credits">
          <div className="text-sm text-zinc-500">Stack</div>
          <div className="mt-1 text-lg font-semibold">Cloud Runway</div>
          <div className="mt-2 text-sm text-zinc-600">AWS/GCP/Azure + infra perks.</div>
        </a>

        <a className="rounded-2xl border bg-white p-6 shadow-sm hover:bg-zinc-50" href="/?q=VentureNet">
          <div className="text-sm text-zinc-500">Stack</div>
          <div className="mt-1 text-lg font-semibold">Iowa Non-Dilutive</div>
          <div className="mt-2 text-sm text-zinc-600">State programs + VentureNet pathways.</div>
        </a>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-semibold">Directory</h2>
          <div className="text-sm text-zinc-500">
            {programs.length} approved entries
          </div>
        </div>

        <DirectoryFilters
          programs={programs as any}
          initialQuery={searchParams?.q || ""}
          initialCategory={searchParams?.category || ""}
          initialStage={searchParams?.stage || ""}
        />
      </section>
    </div>
  );
}

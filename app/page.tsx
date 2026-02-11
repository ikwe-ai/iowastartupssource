import DirectoryFilters from "@/components/DirectoryFilters";
import { listPrograms, type Program } from "@/lib/notion";

export default async function Home({
  searchParams,
}: {
  searchParams?: { q?: string; category?: string; stage?: string };
}) {
  const programs: Program[] = await listPrograms();

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border bg-white/80 p-5 shadow-sm backdrop-blur sm:p-8">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/20 to-pink-500/10 blur-2xl" />
        <div className="absolute -bottom-28 -left-24 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-500/15 to-indigo-500/10 blur-2xl" />

        <div className="relative space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-[11px] text-zinc-600 sm:text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            updated by community • verified entries only
          </div>

          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Iowa’s runway cheat codes.
          </h1>

          <p className="max-w-2xl text-base text-zinc-600 sm:text-lg">
            A living directory of startup credits, perks, accelerators, and non-dilutive programs.
            Built to help founders move faster with less burn.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="/submit"
              className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm text-white hover:bg-zinc-800 shadow-sm"
            >
              Suggest a program
            </a>
            <a
              href="/?category=LLM%2FAPI%20Credits"
              className="rounded-full border bg-white px-5 py-2.5 text-sm hover:bg-zinc-50"
            >
              Show AI credits
            </a>
            <a
              href="/about"
              className="rounded-full border bg-white px-5 py-2.5 text-sm hover:bg-zinc-50"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <a className="rounded-3xl border bg-white/80 backdrop-blur p-6 shadow-sm hover:bg-white" href="/?category=LLM%2FAPI%20Credits">
          <div className="text-xs text-zinc-500">Stack</div>
          <div className="mt-1 text-lg font-semibold">AI Credits</div>
          <div className="mt-2 text-sm text-zinc-600">LLM/API credits to apply for this week.</div>
          <div className="mt-4 inline-flex rounded-full bg-zinc-900 px-3 py-1.5 text-xs text-white">Open</div>
        </a>

        <a className="rounded-3xl border bg-white/80 backdrop-blur p-6 shadow-sm hover:bg-white" href="/?category=Cloud%20Credits">
          <div className="text-xs text-zinc-500">Stack</div>
          <div className="mt-1 text-lg font-semibold">Cloud Runway</div>
          <div className="mt-2 text-sm text-zinc-600">AWS/GCP/Azure + infra perks.</div>
          <div className="mt-4 inline-flex rounded-full bg-zinc-900 px-3 py-1.5 text-xs text-white">Open</div>
        </a>

        <a className="rounded-3xl border bg-white/80 backdrop-blur p-6 shadow-sm hover:bg-white" href="/?q=VentureNet">
          <div className="text-xs text-zinc-500">Stack</div>
          <div className="mt-1 text-lg font-semibold">Iowa Non-Dilutive</div>
          <div className="mt-2 text-sm text-zinc-600">VentureNet + state ecosystem pathways.</div>
          <div className="mt-4 inline-flex rounded-full bg-zinc-900 px-3 py-1.5 text-xs text-white">Open</div>
        </a>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-semibold">Directory</h2>
          <div className="text-sm text-zinc-500">
            {programs.length} approved entries
          </div>
        </div>

        <div className="rounded-2xl border bg-white/80 p-4 text-sm text-zinc-700 shadow-sm backdrop-blur">
          <div className="font-medium">How founders use this page</div>
          <div className="mt-1">1) Scan cards for value, fit, and steps. 2) Save promising programs for later. 3) Open details when ready to act.</div>
        </div>

        <DirectoryFilters
          programs={programs}
          initialQuery={searchParams?.q || ""}
          initialCategory={searchParams?.category || ""}
          initialStage={searchParams?.stage || ""}
        />
      </section>
    </div>
  );
}

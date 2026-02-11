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
      <section className="rounded-xl border p-6 space-y-3">
        <h1 className="text-2xl font-semibold">Iowa Startups Source</h1>
        <p className="opacity-80 max-w-3xl">
          A living directory of credits, perks, accelerators, and non-dilutive programs to extend runway for Iowa founders.
          Built by Ikwe.ai - ecosystem infrastructure, not a pitch deck.
        </p>

        <div className="grid gap-2 md:grid-cols-3 pt-2">
          <a className="rounded-lg border p-4 hover:bg-zinc-50" href="/?category=LLM%2FAPI%20Credits">
            <div className="font-medium">AI Credits Stack</div>
            <div className="text-sm opacity-80">LLM/API credits to apply for this week</div>
          </a>

          <a className="rounded-lg border p-4 hover:bg-zinc-50" href="/?category=Cloud%20Credits">
            <div className="font-medium">Cloud Runway Stack</div>
            <div className="text-sm opacity-80">Cloud credits + startup infra perks</div>
          </a>

          <a className="rounded-lg border p-4 hover:bg-zinc-50" href="/?q=VentureNet">
            <div className="font-medium">Iowa Non-Dilutive Stack</div>
            <div className="text-sm opacity-80">VentureNet + state ecosystem resources</div>
          </a>
        </div>

        <div className="text-sm pt-2">
          <a className="underline" href="/submit">Suggest a program</a>
          <span className="opacity-60"> - </span>
          <a className="underline" href="/about">How this works</a>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Directory</h2>
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

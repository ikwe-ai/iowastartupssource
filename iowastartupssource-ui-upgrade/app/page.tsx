import Link from "next/link";
import { listPrograms } from "@/lib/notion";
import DirectoryClient from "@/app/components/DirectoryClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const programs = await listPrograms();
  const total = programs.length;

  return (
    <div className="space-y-10">
      {/* HERO */}
      <section className="rounded-3xl border bg-gradient-to-br from-white to-zinc-50 p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-zinc-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              updated by community • verified entries only
            </div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Iowa’s runway cheat codes.
            </h1>
            <p className="max-w-2xl text-lg text-zinc-600">
              A living directory of startup credits, perks, accelerators, and non‑dilutive programs —
              built so founders can move faster with less burn.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/submit"
              className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
            >
              Suggest a program
            </Link>
            <a
              href="/api/export/verified.csv"
              className="rounded-full border bg-white px-5 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              Download CSV
            </a>
            <Link
              href="#how-it-works"
              className="rounded-full border bg-white px-5 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              How it works
            </Link>
          </div>
        </div>
      </section>

      {/* ISU PATHWAYS */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">For ISU founders</h2>
            <p className="text-sm text-zinc-600">
              Start with a pathway, then drill into details when you’re ready to apply.
            </p>
          </div>
          <p className="text-sm text-zinc-500">{total} verified entries</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <a
            href="/?q=&category=AI%2FML"
            className="rounded-3xl border bg-white p-5 shadow-sm hover:shadow"
          >
            <div className="text-xs text-zinc-500">Pathway</div>
            <div className="mt-1 text-lg font-semibold">AI Credits</div>
            <p className="mt-2 text-sm text-zinc-600">LLM/API credits you can apply for this week.</p>
            <div className="mt-4 inline-flex rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white">
              Open
            </div>
          </a>
          <a
            href="/?q=&category=Cloud%20Credits"
            className="rounded-3xl border bg-white p-5 shadow-sm hover:shadow"
          >
            <div className="text-xs text-zinc-500">Pathway</div>
            <div className="mt-1 text-lg font-semibold">Cloud Runway</div>
            <p className="mt-2 text-sm text-zinc-600">AWS/GCP/Azure + infra perks.</p>
            <div className="mt-4 inline-flex rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white">
              Open
            </div>
          </a>
          <a
            href="/?q=&category=Non-Dilutive"
            className="rounded-3xl border bg-white p-5 shadow-sm hover:shadow"
          >
            <div className="text-xs text-zinc-500">Pathway</div>
            <div className="mt-1 text-lg font-semibold">Iowa Non‑Dilutive</div>
            <p className="mt-2 text-sm text-zinc-600">VentureNet + state ecosystem pathways.</p>
            <div className="mt-4 inline-flex rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white">
              Open
            </div>
          </a>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">How it works</h3>
            <p className="mt-2 text-sm text-zinc-600">
              This directory is backed by a Notion database, reviewed for accuracy, and designed for quick founder decisions.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">1) Verified entries only</div>
            <p className="text-sm text-zinc-600">Only programs marked <span className="font-medium">Active</span> and not flagged for review appear publicly.</p>
          </div>
          <div className="space-y-3">
            <div className="text-sm font-medium">2) Community updates, human approval</div>
            <p className="text-sm text-zinc-600">Anyone can suggest an add/update — it lands in a queue until approved.</p>
          </div>
        </div>
      </section>

      {/* DIRECTORY */}
      <DirectoryClient programs={programs} />
    </div>
  );
}

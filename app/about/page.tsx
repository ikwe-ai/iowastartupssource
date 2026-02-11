export default function About() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight">About this resource</h1>
        <p className="mt-2 max-w-3xl text-zinc-600">
          Iowa Startups Source is a founder-first directory of credits, perks, and programs that can extend runway and reduce operating burn.
          Entries are curated for practical use by startups, accelerators, and ecosystem partners.
        </p>
      </section>

      <div className="rounded-2xl border bg-white/80 p-5 shadow-sm backdrop-blur space-y-2">
        <div className="font-medium">How freshness works</div>
        <p className="text-zinc-600">
          Program terms change frequently. We combine source monitoring, link checks, and human verification before entries are treated as approved.
        </p>
      </div>

      <div className="rounded-2xl border bg-white/80 p-5 shadow-sm backdrop-blur space-y-2">
        <div className="font-medium">Disclaimer</div>
        <p className="text-zinc-600">
          Always confirm terms on the official provider page. If you notice something outdated, use the Suggest form.
        </p>
      </div>
    </div>
  );
}

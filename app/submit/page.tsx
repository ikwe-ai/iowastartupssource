export default function Submit() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Suggest a program or update</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600 sm:text-base">
          Help keep the directory accurate. Submit a new program, update an existing one, or flag a broken link.
        </p>
      </section>

      <form action="/api/suggestions" method="post" className="rounded-3xl border bg-white/80 p-5 shadow-sm backdrop-blur sm:p-6">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input
              name="title"
              className="w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              placeholder="Program name or update headline"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Suggestion type</label>
            <select
              name="suggestion_type"
              defaultValue="New Program"
              className="w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            >
              <option>New Program</option>
              <option>Update Existing</option>
              <option>Broken Link</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Related Program ID (optional)</label>
            <input
              name="related_program_id"
              className="w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              placeholder="If this updates an existing entry"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Program URL</label>
            <input
              name="program_url"
              type="url"
              className="w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              placeholder="https://example.com/program"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Provider</label>
            <input
              name="provider"
              className="w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              placeholder="AWS, Google, VentureNet, etc."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Category (comma-separated)</label>
            <input
              name="category"
              className="w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              placeholder="Cloud Credits, LLM/API Credits"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Stage (comma-separated)</label>
            <input
              name="stage"
              className="w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              placeholder="Idea, Pre-seed, Seed"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">What you get</label>
            <textarea
              name="what_you_get"
              rows={3}
              className="w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              placeholder="Credits amount, perks, trial details, or grant value"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Eligibility</label>
            <textarea
              name="eligibility"
              rows={3}
              className="w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              placeholder="Who qualifies, referral requirements, geography, etc."
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Proposed change</label>
            <textarea
              name="proposed_change"
              rows={4}
              className="w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              placeholder="What should be changed and why"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Evidence / Source URL</label>
            <input
              name="evidence_url"
              type="url"
              className="w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              placeholder="https://source.example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Submitter email (optional)</label>
            <input
              name="submitter_email"
              type="email"
              className="w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              placeholder="you@email.com"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Notes (optional)</label>
            <textarea
              name="notes"
              rows={4}
              className="w-full rounded-2xl border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              placeholder="Anything else reviewers should know"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">Submissions go to review queue before public listing.</p>
          <button className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm text-white hover:bg-zinc-800 shadow-sm" type="submit">
            Submit suggestion
          </button>
        </div>
      </form>
    </div>
  );
}

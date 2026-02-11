export default function Submit() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Suggest a program or update</h1>
      <p className="opacity-80">Use this to suggest a new program or propose edits to an existing entry.</p>

      <form action="/api/suggestions" method="post" className="space-y-2 rounded-lg border p-4">
        <input
          name="program_id"
          className="w-full rounded border p-2"
          placeholder="Program ID (optional) — paste Notion page ID if updating"
        />
        <textarea
          name="notes"
          className="w-full rounded border p-2"
          rows={6}
          placeholder="Describe the program or the update. Include links if you have them."
          required
        />
        <input
          name="submitter_email"
          className="w-full rounded border p-2"
          placeholder="Email (optional)"
        />
        <button className="rounded bg-black px-3 py-2 text-white" type="submit">
          Submit
        </button>
      </form>
    </div>
  );
}

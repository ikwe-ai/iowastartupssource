export default function About() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">About</h1>
      <p className="opacity-80">
        Iowa Startups Source is a directory of credits, perks, and programs founders can stack to extend runway.
      </p>
      <div className="rounded-lg border p-4 space-y-2">
        <div className="font-medium">How freshness works</div>
        <p className="opacity-80">
          Providers change program terms often. This directory is designed to be maintained via source monitoring and human verification.
        </p>
      </div>
      <div className="rounded-lg border p-4 space-y-2">
        <div className="font-medium">Disclaimer</div>
        <p className="opacity-80">
          Always confirm terms on the official provider page. If you notice something outdated, use the Suggest form.
        </p>
      </div>
    </div>
  );
}

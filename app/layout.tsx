import "./globals.css";

export const metadata = {
  title: "Iowa Startups Source",
  description: "Credits, perks, and programs for Iowa startups.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-zinc-900" />
              <div className="leading-tight">
                <div className="font-semibold">Iowa Startups Source</div>
                <div className="text-xs text-zinc-500">credits • perks • programs</div>
              </div>
            </a>

            <nav className="flex items-center gap-4 text-sm">
              <a href="/submit" className="text-zinc-700 hover:text-zinc-900">Suggest</a>
              <a href="/about" className="text-zinc-700 hover:text-zinc-900">About</a>
              <a
                href="/submit"
                className="rounded-full bg-zinc-900 px-3 py-2 text-white hover:bg-zinc-800"
              >
                Add a program
              </a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

        <footer className="border-t bg-white">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-zinc-600">
            Built by Ikwe.ai • Source-monitored + human-verified •{" "}
            <a className="underline" href="/about">How it works</a>
          </div>
        </footer>
      </body>
    </html>
  );
}

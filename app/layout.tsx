import "./globals.css";

export const metadata = {
  title: "Iowa Startups Source",
  description: "Credits, perks, and programs for Iowa startups.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 shadow-sm" />
              <div className="leading-tight">
                <div className="font-semibold tracking-tight">Iowa Startups Source</div>
                <div className="text-xs text-zinc-500">credits • perks • programs</div>
              </div>
            </a>

            <nav className="flex items-center gap-4 text-sm">
              <a href="/about" className="text-zinc-700 hover:text-zinc-900">About</a>
              <a href="/submit" className="text-zinc-700 hover:text-zinc-900">Suggest</a>
              <a
                href="/submit"
                className="rounded-full bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 shadow-sm"
              >
                Add a program
              </a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

        <footer className="border-t bg-white/70 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-zinc-600 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>Built for Iowa founders • Source-monitored + human-verified</div>
            <div className="opacity-80">
              Built by <span className="font-medium text-zinc-800">Ikwe.ai</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

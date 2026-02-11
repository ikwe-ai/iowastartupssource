import "./globals.css";

export const metadata = {
  title: "Iowa Startups Source",
  description: "Credits, perks, and programs for Iowa startups.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-2xl bg-zinc-900" aria-hidden />
              <span>
                <div className="font-semibold leading-tight">Iowa Startups Source</div>
                <div className="text-xs opacity-70">credits • perks • programs</div>
              </span>
            </a>
            <nav className="flex items-center gap-6 text-sm">
              <a href="/" className="hover:underline">Directory</a>
              <a href="/about" className="hover:underline">About</a>
              <a href="/submit" className="hover:underline">Suggest</a>
              <a href="/submit" className="btn btn-primary">Add a program</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="border-t mt-10">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm opacity-80">
            Built by Ikwe.ai • Updated by community • Human-verified.
          </div>
        </footer>
      </body>
    </html>
  );
}

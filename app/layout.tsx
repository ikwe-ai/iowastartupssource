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
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
            <a href="/" className="font-semibold">Iowa Startups Source</a>
            <nav className="flex gap-4 text-sm">
              <a href="/submit" className="underline">Suggest</a>
              <a href="/about" className="underline">About</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="border-t mt-10">
          <div className="mx-auto max-w-5xl px-4 py-6 text-sm opacity-80">
            Built by Ikwe.ai • Source-monitored + human-verified.
          </div>
        </footer>
      </body>
    </html>
  );
}

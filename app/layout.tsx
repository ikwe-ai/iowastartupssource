import "./globals.css";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "Iowa Startups Source",
  description: "Credits, perks, and programs for Iowa startups.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <SiteHeader />

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

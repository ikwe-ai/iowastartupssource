"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Directory" },
  { href: "/about", label: "About" },
  { href: "/submit", label: "Suggest" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:py-4">
        <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 shadow-sm" />
          <div className="min-w-0 leading-tight">
            <div className="truncate font-semibold tracking-tight">Iowa Startups Source</div>
            <div className="truncate text-xs text-zinc-500">credits • perks • programs</div>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-2 text-sm transition ${
                    active ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-white hover:text-zinc-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/submit"
            className="shrink-0 rounded-full bg-zinc-900 px-3 py-2 text-xs text-white shadow-sm hover:bg-zinc-800 sm:px-4 sm:text-sm"
          >
            <span className="lg:hidden">Add</span>
            <span className="hidden lg:inline">Add a program</span>
          </Link>

          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="rounded-xl border bg-white p-2 text-zinc-700 sm:hidden"
          >
            {open ? "X" : "≡"}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t bg-white px-4 py-3 sm:hidden">
          <nav className="grid gap-2">
            {navItems.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    active ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

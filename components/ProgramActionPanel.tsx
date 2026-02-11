"use client";

import Link from "next/link";
import { useState } from "react";

function ActionButton({
  href,
  label,
  primary = false,
  download = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
  download?: boolean;
}) {
  return (
    <a
      href={href}
      download={download}
      target={download ? undefined : "_blank"}
      rel={download ? undefined : "noreferrer"}
      className={`inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm ${
        primary ? "bg-zinc-900 text-white hover:bg-zinc-800" : "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
      }`}
    >
      {label}
    </a>
  );
}

export default function ProgramActionPanel({
  programId,
  programName,
  applyUrl,
  sourceUrl,
  finalUrl,
  updateHref,
}: {
  programId: string;
  programName: string;
  applyUrl?: string;
  sourceUrl?: string;
  finalUrl?: string;
  updateHref: string;
}) {
  const [copied, setCopied] = useState<"" | "page" | "apply">("");

  async function copyText(value: string, kind: "page" | "apply") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(""), 1400);
    } catch {
      setCopied("");
    }
  }

  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      <div className="rounded-2xl border bg-white/90 p-4 shadow-sm backdrop-blur">
        <div className="text-sm font-medium">Take action</div>
        <div className="mt-3 grid gap-2">
          {applyUrl ? <ActionButton href={applyUrl} label="Apply now" primary /> : null}
          {sourceUrl ? <ActionButton href={sourceUrl} label="Official source" /> : null}
          {finalUrl && finalUrl !== applyUrl ? <ActionButton href={finalUrl} label="Final destination" /> : null}

          <button
            type="button"
            onClick={() => copyText(window.location.href, "page")}
            className="inline-flex w-full items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
          >
            {copied === "page" ? "Page link copied" : "Copy page link"}
          </button>

          {applyUrl ? (
            <button
              type="button"
              onClick={() => copyText(applyUrl, "apply")}
              className="inline-flex w-full items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
            >
              {copied === "apply" ? "Apply link copied" : "Copy apply link"}
            </button>
          ) : null}

          <ActionButton href={`/api/program/${programId}/brief`} label="Download brief (.txt)" download />

          <Link
            href={updateHref}
            className="inline-flex w-full items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
          >
            Suggest update
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border bg-white/90 p-4 shadow-sm backdrop-blur">
        <div className="text-sm font-medium">How to use this page</div>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-zinc-700">
          <li>Check value, eligibility, and time-to-apply first.</li>
          <li>Copy links or download the brief to save for later.</li>
          <li>Open apply only when this fits your current stage.</li>
        </ol>
        <div className="mt-3 text-xs text-zinc-500">Program: {programName || "Untitled"}</div>
      </div>
    </aside>
  );
}

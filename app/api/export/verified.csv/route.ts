import { NextResponse } from "next/server";
import { listPrograms } from "@/lib/notion";

export const dynamic = "force-dynamic";

function csvEscape(v: string) {
  const needsQuotes = /[",\n]/.test(v);
  const escaped = v.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export async function GET() {
  const programs = await listPrograms();
  const header = [
    "Name",
    "Provider",
    "Type",
    "Categories",
    "Stages",
    "Apply URL",
    "Source URL",
    "Final URL",
    "What you get",
    "Eligibility",
    "How to apply",
    "Link Status",
    "HTTP Status",
    "Last Verified",
  ];

  const rows = programs.map((p) => [
    p.name || "",
    p.provider || "",
    p.offerType || "",
    (p.category || []).join("; "),
    (p.stage || []).join("; "),
    p.applyUrl || "",
    p.sourceUrl || "",
    p.finalUrl || "",
    p.whatYouGet || "",
    p.eligibilitySummary || "",
    p.howToApply || "",
    p.linkStatus || "",
    typeof p.httpStatus === "number" ? String(p.httpStatus) : "",
    p.lastVerifiedAt || "",
  ]);

  const csv = [
    header.map(csvEscape).join(","),
    ...rows.map((r) => r.map((v) => csvEscape(String(v || ""))).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="iowa-startups-verified.csv"',
      "Cache-Control": "no-store",
    },
  });
}

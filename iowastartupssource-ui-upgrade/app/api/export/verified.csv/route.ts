import { NextResponse } from "next/server";
import { listPrograms } from "@/lib/notion";

function csvEscape(v: string) {
  const needs = /[",\n]/.test(v);
  const s = v.replace(/"/g, '""');
  return needs ? `"${s}"` : s;
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
    "What you get",
    "Eligibility (detailed)",
    "How to apply",
    "Time to apply (min)",
  ];

  const rows = programs.map((p) => [
    p.name || "",
    p.provider || "",
    p.type || "",
    (p.category || []).join("; "),
    (p.stage || []).join("; "),
    p.applyUrl || "",
    p.sourceUrl || "",
    p.whatYouGet || "",
    p.eligibilityDetailed || "",
    p.howToApply || "",
    p.timeToApplyMin != null ? String(p.timeToApplyMin) : "",
  ]);

  const csv = [
    header.map(csvEscape).join(","),
    ...rows.map((r) => r.map(csvEscape).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="iowa-startups-verified.csv"',
    },
  });
}

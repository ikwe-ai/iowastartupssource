import { getProgram } from "@/lib/notion";

function slugify(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function line(label: string, value?: string | number) {
  if (value == null) return "";
  const text = String(value).trim();
  if (!text) return "";
  return `${label}: ${text}`;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const program = await getProgram(params.id);
  if (!program) {
    return new Response("Program not found", { status: 404 });
  }

  const content = [
    line("Program", program.name),
    line("Provider", program.provider),
    line("Type", program.offerType),
    line("Categories", (program.category || []).join(", ")),
    line("Stage", (program.stage || []).join(", ")),
    line("What you get", program.whatYouGet),
    line("Eligibility", program.eligibilitySummary),
    line("How to apply", program.howToApply),
    line("Apply URL", program.applyUrl),
    line("Source URL", program.sourceUrl),
    line("Final URL", program.finalUrl),
    line("Link status", program.linkStatus),
    line("Last verified", program.lastVerifiedAt),
  ]
    .filter(Boolean)
    .join("\n\n");

  const filename = `${slugify(program.name || "program") || "program"}-brief.txt`;

  return new Response(content, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}

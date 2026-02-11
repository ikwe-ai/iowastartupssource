import fs from "node:fs";
import path from "node:path";
import { Client } from "@notionhq/client";

const token = process.env.NOTION_TOKEN;
const programsDbId = process.env.NOTION_PROGRAMS_DB_ID;
const inputArg = process.argv[2] || "perks-believe.html";
const inputPath = path.isAbsolute(inputArg) ? inputArg : path.join(process.cwd(), inputArg);

if (!token) throw new Error("Missing env var: NOTION_TOKEN");
if (!programsDbId) throw new Error("Missing env var: NOTION_PROGRAMS_DB_ID");
if (!fs.existsSync(inputPath)) {
  throw new Error(`Input HTML file not found: ${inputPath}`);
}

const notion = new Client({ auth: token });

function decodeHtml(text) {
  return String(text || "")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(v) {
  return decodeHtml(v)
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseDealsFromHtml(html) {
  const deals = [];
  const cardRe = /<div class="grid-view"[\s\S]*?<a class="absolute inset-0"[^>]*href="\/([^"#?]+)#([^"]+)"[^>]*><\/a>[\s\S]*?<\/div>\s*<\/div>/g;

  for (const match of html.matchAll(cardRe)) {
    const block = match[0];
    const slug = decodeHtml(match[1] || "");

    const name = decodeHtml((block.match(/<p class="text-md font-semibold leading-tight">([\s\S]*?)<\/p>/) || [])[1] || "");
    const offer = decodeHtml((block.match(/<p class="text-success-hover[^"]*">([\s\S]*?)<\/p>/) || [])[1] || "");
    const description = decodeHtml((block.match(/<p class="custom-text-sm line-clamp-2">([\s\S]*?)<\/p>/) || [])[1] || "");
    const saveUpTo = decodeHtml((block.match(/<p class="custom-text-sm text-gray-500 mt-0.5">\s*Save up to ([\s\S]*?)\s*<\/p>/) || [])[1] || "");

    if (!name || !slug) continue;

    deals.push({
      name,
      slug,
      url: `https://perks.believe.app/${slug}`,
      offer,
      description,
      saveUpTo,
      normalizedName: normalize(name),
    });
  }

  const dedup = new Map();
  for (const d of deals) {
    const key = d.normalizedName || normalize(d.slug);
    if (!dedup.has(key)) dedup.set(key, d);
  }

  return Array.from(dedup.values());
}

function titleText(prop) {
  return (prop?.title || []).map((t) => t.plain_text).join("").trim();
}

function richText(prop) {
  return (prop?.rich_text || []).map((t) => t.plain_text).join("").trim();
}

function selectText(prop) {
  return prop?.select?.name || prop?.status?.name || "";
}

function urlText(prop) {
  return prop?.url || "";
}

async function fetchPrograms() {
  let cursor = undefined;
  const all = [];

  while (true) {
    const resp = await notion.databases.query({
      database_id: programsDbId,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });

    for (const page of resp.results) {
      const props = page.properties || {};
      const name = titleText(props["Program Name"] || props["Name"] || props["Program"]);
      const provider = selectText(props["Provider"]) || richText(props["Provider"]);
      const applyUrl = urlText(props["Application Link"]) || urlText(props["Apply URL"]);
      all.push({
        name,
        provider,
        applyUrl,
        normalizedName: normalize(name),
        normalizedProvider: normalize(provider),
      });
    }

    if (!resp.has_more || !resp.next_cursor) break;
    cursor = resp.next_cursor;
  }

  return all;
}

function maybeMatch(deal, programs) {
  const dn = deal.normalizedName;
  if (!dn) return null;

  for (const p of programs) {
    if (!p.normalizedName && !p.normalizedProvider) continue;
    if (p.normalizedName === dn) return { reason: "exact-name", program: p };
    if (p.normalizedProvider === dn) return { reason: "provider-match", program: p };

    // weak containment check to catch minor suffix variations
    if (dn.length >= 6 && p.normalizedName.includes(dn)) return { reason: "name-contains", program: p };
    if (p.normalizedName.length >= 6 && dn.includes(p.normalizedName)) return { reason: "contains-name", program: p };
  }

  return null;
}

function markdownEscape(v) {
  return String(v || "").replace(/\|/g, "\\|");
}

async function main() {
  const html = fs.readFileSync(inputPath, "utf8");
  const deals = parseDealsFromHtml(html);
  const programs = await fetchPrograms();

  const missing = [];
  const matched = [];

  for (const d of deals) {
    const match = maybeMatch(d, programs);
    if (match) {
      matched.push({ deal: d, match });
    } else {
      missing.push(d);
    }
  }

  missing.sort((a, b) => a.name.localeCompare(b.name));

  const today = new Date().toISOString().slice(0, 10);
  const outPath = path.join(process.cwd(), "reports", `perks-gap-report-${today}.md`);

  const lines = [];
  lines.push(`# Perks Gap Report (${today})`);
  lines.push("");
  lines.push(`- Source file: \`${path.basename(inputPath)}\``);
  lines.push(`- Perks deals parsed: **${deals.length}**`);
  lines.push(`- Existing programs in Notion: **${programs.length}**`);
  lines.push(`- Matched deals: **${matched.length}**`);
  lines.push(`- Missing deals to review/add: **${missing.length}**`);
  lines.push("");
  lines.push("## Missing Deals");
  lines.push("");
  lines.push("| Deal | Save up to | URL | Suggested category |");
  lines.push("|---|---:|---|---|");

  for (const d of missing) {
    const suggested = /(cloud|aws|gcp|azure|digitalocean|supabase)/i.test(d.name + " " + d.offer)
      ? "Cloud Credits"
      : /(ai|openai|anthropic|hugging face|perplexity|elevenlabs)/i.test(d.name + " " + d.offer)
        ? "LLM/API Credits"
        : /(hubspot|intercom|zendesk|sales|crm)/i.test(d.name + " " + d.offer)
          ? "Sales/Customer"
          : "Needs review";

    lines.push(`| ${markdownEscape(d.name)} | ${markdownEscape(d.saveUpTo || "-")} | [link](${d.url}) | ${suggested} |`);
  }

  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push("- This is a heuristic match (name/provider containment). Manually review before import.");
  lines.push("- Next step: enrich each missing row with canonical apply URL and eligibility before setting Active.");

  fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");

  console.log(`Parsed deals: ${deals.length}`);
  console.log(`Missing deals: ${missing.length}`);
  console.log(`Report written: ${outPath}`);
}

main().catch((err) => {
  console.error("perksGapReport failed:", err?.message || err);
  process.exit(1);
});

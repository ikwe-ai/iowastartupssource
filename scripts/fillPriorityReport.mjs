import { Client } from "@notionhq/client";
import fs from "node:fs";
import path from "node:path";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_PROGRAMS_DB_ID;
const maxItems = Number(process.env.FILL_AUDIT_MAX ?? "500");
const onlyActive = String(process.env.FILL_AUDIT_ONLY_ACTIVE ?? "true").toLowerCase() === "true";

if (!process.env.NOTION_TOKEN) throw new Error("Missing env var: NOTION_TOKEN");
if (!databaseId) throw new Error("Missing env var: NOTION_PROGRAMS_DB_ID");

function textFromTitle(prop) {
  return (prop?.title ?? []).map((x) => x.plain_text || "").join("").trim();
}

function textFromRich(prop) {
  return (prop?.rich_text ?? []).map((x) => x.plain_text || "").join("").trim();
}

function selectName(prop) {
  return prop?.select?.name || prop?.status?.name || "";
}

function checkbox(prop) {
  return Boolean(prop?.checkbox);
}

function valueLength(value) {
  return String(value || "").replace(/\s+/g, " ").trim().length;
}

function fieldPenalty(len, strongMin, weakMin) {
  if (len >= strongMin) return 0;
  if (len >= weakMin) return 1;
  if (len > 0) return 2;
  return 3;
}

function assessRow(row) {
  const whatLen = valueLength(row.whatYouGet);
  const eligibilityLen = valueLength(row.eligibility);
  const applyLen = valueLength(row.howToApply);

  const penalties = {
    whatYouGet: fieldPenalty(whatLen, 120, 60),
    eligibility: fieldPenalty(eligibilityLen, 100, 50),
    howToApply: fieldPenalty(applyLen, 90, 45),
  };

  const readiness = [penalties.whatYouGet, penalties.eligibility, penalties.howToApply].filter((p) => p === 0).length;
  const missingCount = [whatLen, eligibilityLen, applyLen].filter((n) => n === 0).length;

  let priority = penalties.whatYouGet + penalties.eligibility + penalties.howToApply;
  if (missingCount >= 2) priority += 2;
  if (row.needsReview) priority += 2;
  if (String(row.confidence).toLowerCase() === "low") priority += 2;
  if (String(row.linkStatus).toLowerCase() === "broken") priority += 2;

  const gaps = [];
  if (penalties.whatYouGet > 0) gaps.push("What you get");
  if (penalties.eligibility > 0) gaps.push("Eligibility");
  if (penalties.howToApply > 0) gaps.push("How to apply");

  return { ...row, readiness, priority, gaps, penalties };
}

async function fetchAllPages(query) {
  const out = [];
  let cursor = undefined;

  while (out.length < maxItems) {
    const resp = await notion.databases.query({
      ...query,
      page_size: Math.min(100, maxItems - out.length),
      start_cursor: cursor,
    });
    out.push(...resp.results);
    if (!resp.has_more || !resp.next_cursor) break;
    cursor = resp.next_cursor;
  }

  return out;
}

function rowFromPage(page) {
  const props = page.properties || {};
  return {
    id: page.id,
    name: textFromTitle(props["Name"]) || "Untitled",
    provider: selectName(props["Provider"]) || textFromRich(props["Provider"]) || "Unknown",
    whatYouGet: textFromRich(props["What you get"]) || textFromRich(props["Offer Summary"]) || textFromRich(props["Offer"]),
    eligibility: textFromRich(props["Eligibility"]) || textFromRich(props["Eligibility Summary"]),
    howToApply: textFromRich(props["How to apply"]) || textFromRich(props["How To Apply"]) || textFromRich(props["Application Steps"]),
    confidence: selectName(props["Extraction confidence"]) || textFromRich(props["Extraction confidence"]) || "",
    linkStatus: selectName(props["Link Status"]) || textFromRich(props["Link Status"]) || "",
    status: selectName(props["Status"]) || "",
    needsReview: checkbox(props["Needs review"]),
    applyUrl: props["Apply URL"]?.url || props["Program URL"]?.url || props["Application Link"]?.url || "",
  };
}

function toMarkdown(items, totals) {
  const lines = [];
  lines.push("# Fill Priority Report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push(`- Total scanned: **${totals.total}**`);
  lines.push(`- Need fill (readiness < 3): **${totals.needFill}**`);
  lines.push(`- Fully ready (readiness = 3): **${totals.ready}**`);
  lines.push("");
  lines.push("## Priority Queue");
  lines.push("");
  lines.push("| Priority | Program | Provider | Readiness | Gaps |");
  lines.push("|---:|---|---|:---:|---|");
  for (const item of items) {
    lines.push(`| ${item.priority} | ${item.name} | ${item.provider} | ${item.readiness}/3 | ${item.gaps.join(", ") || "None"} |`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function main() {
  const query = {
    database_id: databaseId,
    ...(onlyActive
      ? {
          filter: {
            property: "Status",
            status: { equals: "Active" },
          },
        }
      : {}),
  };

  const pages = await fetchAllPages(query);
  const scored = pages.map(rowFromPage).map(assessRow);
  scored.sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name));

  const needFill = scored.filter((x) => x.readiness < 3);
  const totals = {
    total: scored.length,
    needFill: needFill.length,
    ready: scored.length - needFill.length,
  };

  const reportDir = path.join(process.cwd(), "reports");
  fs.mkdirSync(reportDir, { recursive: true });

  const top = needFill.slice(0, 100);
  fs.writeFileSync(path.join(reportDir, "fill-priority.json"), JSON.stringify({ totals, generatedAt: new Date().toISOString(), items: top }, null, 2));
  fs.writeFileSync(path.join(reportDir, "fill-priority.md"), toMarkdown(top, totals));

  console.log(`Scanned ${totals.total} programs`);
  console.log(`Need fill: ${totals.needFill}`);
  console.log(`Ready: ${totals.ready}`);
  console.log(`Wrote reports/fill-priority.json`);
  console.log(`Wrote reports/fill-priority.md`);
}

main().catch((err) => {
  console.error("fillPriorityReport failed:", err?.message || err);
  process.exit(1);
});

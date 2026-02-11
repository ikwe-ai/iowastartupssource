import fs from "node:fs";
import path from "node:path";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const suggestionsDbId = process.env.NOTION_SUGGESTIONS_DB_ID;

const dryRun = String(process.env.AUTO_ADD_DRY_RUN ?? "true").toLowerCase() === "true";
const seedFile = process.env.AUTO_ADD_SEED_FILE || "data/suggestion-seeds.json";
const statusDefault = process.env.AUTO_ADD_STATUS || "Pending";
const submitterEmail = process.env.AUTO_ADD_SUBMITTER_EMAIL || "";

if (!process.env.NOTION_TOKEN) throw new Error("Missing env var: NOTION_TOKEN");
if (!suggestionsDbId) throw new Error("Missing env var: NOTION_SUGGESTIONS_DB_ID");

function normalize(v) {
  return String(v || "").trim().toLowerCase();
}

function readSeeds() {
  const full = path.join(process.cwd(), seedFile);
  const raw = fs.readFileSync(full, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error(`Seed file must be an array: ${seedFile}`);
  return parsed;
}

async function existsByProgramUrl(programUrl) {
  if (!programUrl) return false;
  const resp = await notion.databases.query({
    database_id: suggestionsDbId,
    page_size: 1,
    filter: {
      property: "Program URL",
      url: { equals: programUrl },
    },
  });
  return resp.results.length > 0;
}

async function existsByTitle(title) {
  if (!title) return false;
  const resp = await notion.databases.query({
    database_id: suggestionsDbId,
    page_size: 50,
    filter: {
      property: "Title",
      title: { contains: title.slice(0, 50) },
    },
  });
  return resp.results.some((r) => normalize(r?.properties?.Title?.title?.[0]?.plain_text) === normalize(title));
}

function compactText(value, max = 1900) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

async function createSuggestion(seed, reachability) {
  const properties = {
    Title: { title: [{ text: { content: compactText(seed.title, 180) || "Untitled suggestion" } }] },
    "Suggestion Type": { select: { name: seed.suggestionType || "New Program" } },
    Status: { select: { name: statusDefault } },
    ...(seed.programUrl ? { "Program URL": { url: seed.programUrl } } : {}),
    ...(seed.provider ? { Provider: { rich_text: [{ text: { content: compactText(seed.provider, 180) } }] } } : {}),
    ...(Array.isArray(seed.category) && seed.category.length
      ? { Category: { multi_select: seed.category.map((c) => ({ name: String(c) })) } }
      : {}),
    ...(Array.isArray(seed.stage) && seed.stage.length
      ? { Stage: { multi_select: seed.stage.map((s) => ({ name: String(s) })) } }
      : {}),
    ...(seed.evidenceUrl ? { "Evidence / Source URL": { url: seed.evidenceUrl } } : {}),
    ...(submitterEmail ? { "Submitter email": { email: submitterEmail } } : {}),
    Notes: {
      rich_text: [
        {
          text: {
            content: compactText(
              [
                seed.notes || "",
                `Auto-add check: HTTP ${reachability.status}`,
                reachability.finalUrl ? `Final URL: ${reachability.finalUrl}` : "",
              ]
                .filter(Boolean)
                .join(" | "),
              1800,
            ),
          },
        },
      ],
    },
  };

  if (!dryRun) {
    await notion.pages.create({
      parent: { database_id: suggestionsDbId },
      properties,
    });
  }
}

async function checkUrl(url) {
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (res.status === 403 || res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: "GET", redirect: "follow" });
    }
    return { ok: res.status >= 200 && res.status < 400, status: res.status, finalUrl: res.url || url };
  } catch (err) {
    return { ok: false, status: 0, finalUrl: url, error: err instanceof Error ? err.message : String(err) };
  }
}

async function main() {
  const seeds = readSeeds();
  let created = 0;
  let skipped = 0;

  for (const seed of seeds) {
    const title = compactText(seed.title, 180);
    const programUrl = compactText(seed.programUrl, 800);
    if (!title) {
      skipped += 1;
      console.log("[SKIP] missing title");
      continue;
    }

    const urlExists = await existsByProgramUrl(programUrl);
    const titleExists = await existsByTitle(title);
    if (urlExists || titleExists) {
      skipped += 1;
      console.log(`[SKIP] duplicate suggestion: ${title}`);
      continue;
    }

    const reachability = programUrl ? await checkUrl(programUrl) : { ok: false, status: 0, finalUrl: "" };
    await createSuggestion({ ...seed, title, programUrl }, reachability);
    created += 1;
    console.log(`[${dryRun ? "DRY" : "OK"}] ${title} -> status ${reachability.status}`);
  }

  console.log(`\nDone. created=${created}, skipped=${skipped}, dryRun=${dryRun}`);
}

main().catch((err) => {
  console.error("autoAddSuggestions failed:", err?.message || err);
  process.exit(1);
});

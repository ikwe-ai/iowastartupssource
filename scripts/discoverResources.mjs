import fs from "node:fs";
import path from "node:path";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const suggestionsDbId = process.env.NOTION_SUGGESTIONS_DB_ID;
const programsDbId = process.env.NOTION_PROGRAMS_DB_ID;

const dryRun = String(process.env.DISCOVERY_DRY_RUN ?? "true").toLowerCase() === "true";
const maxItems = Number(process.env.DISCOVERY_MAX_ITEMS ?? "40");
const lookbackDays = Number(process.env.DISCOVERY_LOOKBACK_DAYS ?? "45");
const sourcesFile = process.env.DISCOVERY_SOURCES_FILE || "data/discovery-sources.json";
const statusDefault = process.env.DISCOVERY_STATUS || "Pending";
const submitterEmail = process.env.DISCOVERY_SUBMITTER_EMAIL || "";
const minScore = Number(process.env.DISCOVERY_MIN_SCORE ?? "2");

if (!process.env.NOTION_TOKEN) throw new Error("Missing env var: NOTION_TOKEN");
if (!suggestionsDbId) throw new Error("Missing env var: NOTION_SUGGESTIONS_DB_ID");

const KEYWORDS = [
  "startup",
  "startups",
  "credits",
  "credit",
  "grant",
  "grants",
  "perk",
  "perks",
  "accelerator",
  "incubator",
  "founder",
  "founders",
  "program",
  "funding",
  "non-dilutive",
  "student founder",
];

const NEGATIVE_KEYWORDS = [
  "privacy",
  "terms",
  "cookie",
  "job",
  "careers",
  "contact us",
  "login",
  "sign in",
  "unsubscribe",
];

function compact(v, max = 1900) {
  return String(v || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function normalize(v) {
  return compact(v, 300).toLowerCase();
}

function isRecent(pubDate) {
  if (!pubDate) return true;
  const dt = new Date(pubDate);
  if (Number.isNaN(dt.getTime())) return true;
  const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
  return dt.getTime() >= cutoff;
}

function countMatches(text, words) {
  const hay = normalize(text);
  return words.reduce((acc, w) => (hay.includes(w) ? acc + 1 : acc), 0);
}

function scoreCandidate(c) {
  const body = [c.title, c.summary, c.url, c.sourceName].filter(Boolean).join(" ");
  const positive = countMatches(body, KEYWORDS);
  const negative = countMatches(body, NEGATIVE_KEYWORDS);
  return positive - negative;
}

function inferCategory(candidate, source) {
  const categories = new Set(Array.isArray(source.category) ? source.category : []);
  const body = normalize([candidate.title, candidate.summary].filter(Boolean).join(" "));
  if (body.includes("grant") || body.includes("funding")) categories.add("Non-Dilutive Funding");
  if (body.includes("credit") || body.includes("cloud")) categories.add("Cloud Credits");
  if (body.includes("ai") || body.includes("llm") || body.includes("api")) categories.add("LLM/API Credits");
  if (body.includes("accelerator") || body.includes("cohort")) categories.add("Accelerator");
  if (body.includes("iowa") || body.includes("isu")) categories.add("Iowa Programs");
  return Array.from(categories).slice(0, 5);
}

function inferStage(source) {
  const stages = Array.isArray(source.stage) ? source.stage : [];
  return stages.slice(0, 4);
}

function parseRss(xml, source) {
  const out = [];
  const itemMatches = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)];
  const entryMatches = [...xml.matchAll(/<entry[\s\S]*?<\/entry>/gi)];
  const blocks = itemMatches.length ? itemMatches.map((m) => m[0]) : entryMatches.map((m) => m[0]);

  for (const block of blocks) {
    const title = compact((block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/<!\[CDATA\[|\]\]>/g, ""), 240);
    const link =
      compact(block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || "", 1000) ||
      compact(block.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1] || "", 1000);
    const summary = compact(
      (block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] ||
        block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1] ||
        "")
        .replace(/<!\[CDATA\[|\]\]>/g, "")
        .replace(/<[^>]+>/g, " "),
      1200,
    );
    const pubDate = compact(
      block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] ||
      block.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)?.[1] ||
      block.match(/<published[^>]*>([\s\S]*?)<\/published>/i)?.[1] ||
      "",
      80,
    );

    if (!title || !link) continue;
    out.push({
      sourceName: source.name,
      sourceUrl: source.url,
      title,
      url: link,
      summary,
      pubDate,
      providerHint: source.providerHint || "",
      category: inferCategory({ title, summary }, source),
      stage: inferStage(source),
    });
  }
  return out;
}

function absolutize(base, href) {
  try {
    return new URL(href, base).toString();
  } catch {
    return "";
  }
}

function parseHtmlLinks(html, source) {
  const out = [];
  const anchors = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  for (const m of anchors) {
    const href = m[1] || "";
    const text = compact((m[2] || "").replace(/<[^>]+>/g, " "), 200);
    const url = absolutize(source.url, href);
    if (!url || !/^https?:\/\//i.test(url)) continue;
    if (!text) continue;

    out.push({
      sourceName: source.name,
      sourceUrl: source.url,
      title: text,
      url,
      summary: "",
      pubDate: "",
      providerHint: source.providerHint || "",
      category: inferCategory({ title: text, summary: "" }, source),
      stage: inferStage(source),
    });
  }
  return out;
}

async function fetchText(url) {
  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: { "user-agent": "IkweIowaScanner/1.0 (+https://iowastartups.ikwe.ai)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

function readSources() {
  const full = path.join(process.cwd(), sourcesFile);
  const raw = fs.readFileSync(full, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error(`Sources file must be an array: ${sourcesFile}`);
  return parsed;
}

async function existsInSuggestionsByUrl(programUrl) {
  if (!programUrl) return false;
  const resp = await notion.databases.query({
    database_id: suggestionsDbId,
    page_size: 1,
    filter: { property: "Program URL", url: { equals: programUrl } },
  });
  return resp.results.length > 0;
}

async function existsInSuggestionsByTitle(title) {
  if (!title) return false;
  const resp = await notion.databases.query({
    database_id: suggestionsDbId,
    page_size: 25,
    filter: { property: "Title", title: { contains: title.slice(0, 50) } },
  });
  return resp.results.some((r) => normalize(r?.properties?.Title?.title?.[0]?.plain_text) === normalize(title));
}

async function existsInPrograms(programUrl, title) {
  if (!programsDbId) return false;

  if (programUrl) {
    const byApply = await notion.databases.query({
      database_id: programsDbId,
      page_size: 1,
      filter: { property: "Apply URL", url: { equals: programUrl } },
    });
    if (byApply.results.length > 0) return true;
  }

  if (title) {
    const byName = await notion.databases.query({
      database_id: programsDbId,
      page_size: 10,
      filter: { property: "Name", title: { contains: title.slice(0, 50) } },
    });
    return byName.results.some((r) => normalize(r?.properties?.Name?.title?.[0]?.plain_text) === normalize(title));
  }
  return false;
}

async function checkUrl(url) {
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (res.status === 403 || res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: "GET", redirect: "follow" });
    }
    return { status: res.status, finalUrl: res.url || url };
  } catch (err) {
    return { status: 0, finalUrl: url, error: err instanceof Error ? err.message : String(err) };
  }
}

function buildSuggestion(candidate) {
  const score = scoreCandidate(candidate);
  const note = compact(
    [
      "Auto-discovery candidate from curated source.",
      `Source: ${candidate.sourceName}`,
      candidate.sourceUrl ? `Source URL: ${candidate.sourceUrl}` : "",
      candidate.pubDate ? `Published: ${candidate.pubDate}` : "",
      `Score: ${score}`,
      candidate.summary ? `Summary: ${candidate.summary}` : "",
    ].filter(Boolean).join(" | "),
    1800,
  );

  return {
    title: compact(candidate.title, 180),
    suggestionType: "New Program",
    programUrl: candidate.url,
    provider: compact(candidate.providerHint || "", 160),
    category: candidate.category || [],
    stage: candidate.stage || [],
    evidenceUrl: candidate.sourceUrl || candidate.url,
    notes: note,
    score,
  };
}

async function createSuggestion(suggestion, reachability) {
  const properties = {
    Title: { title: [{ text: { content: suggestion.title || "Untitled suggestion" } }] },
    "Suggestion Type": { select: { name: "New Program" } },
    Status: { select: { name: statusDefault } },
    ...(suggestion.programUrl ? { "Program URL": { url: suggestion.programUrl } } : {}),
    ...(suggestion.provider ? { Provider: { rich_text: [{ text: { content: suggestion.provider } }] } } : {}),
    ...(Array.isArray(suggestion.category) && suggestion.category.length
      ? { Category: { multi_select: suggestion.category.map((x) => ({ name: String(x) })) } }
      : {}),
    ...(Array.isArray(suggestion.stage) && suggestion.stage.length
      ? { Stage: { multi_select: suggestion.stage.map((x) => ({ name: String(x) })) } }
      : {}),
    ...(suggestion.evidenceUrl ? { "Evidence / Source URL": { url: suggestion.evidenceUrl } } : {}),
    ...(submitterEmail ? { "Submitter email": { email: submitterEmail } } : {}),
    Notes: {
      rich_text: [
        {
          text: {
            content: compact(
              [
                suggestion.notes,
                `Auto-discovery URL check: HTTP ${reachability.status}`,
                reachability.finalUrl ? `Final URL: ${reachability.finalUrl}` : "",
                reachability.error ? `Error: ${reachability.error}` : "",
              ].filter(Boolean).join(" | "),
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

async function discoverFromSource(source) {
  try {
    const text = await fetchText(source.url);
    if (source.kind === "rss") return parseRss(text, source);
    return parseHtmlLinks(text, source);
  } catch (err) {
    console.log(`[WARN] source failed: ${source.name} -> ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

async function main() {
  const sources = readSources();
  const seen = new Set();
  const candidates = [];

  for (const source of sources) {
    const found = await discoverFromSource(source);
    for (const c of found) {
      const key = `${normalize(c.title)}::${normalize(c.url)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (!isRecent(c.pubDate)) continue;
      const score = scoreCandidate(c);
      if (score < minScore) continue;
      candidates.push({ ...c, score });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  let created = 0;
  let skipped = 0;
  for (const candidate of candidates) {
    if (created >= maxItems) break;

    const suggestion = buildSuggestion(candidate);
    if (!suggestion.title || !suggestion.programUrl) {
      skipped += 1;
      continue;
    }

    const dupSuggestionUrl = await existsInSuggestionsByUrl(suggestion.programUrl);
    const dupSuggestionTitle = await existsInSuggestionsByTitle(suggestion.title);
    const dupProgram = await existsInPrograms(suggestion.programUrl, suggestion.title);
    if (dupSuggestionUrl || dupSuggestionTitle || dupProgram) {
      skipped += 1;
      continue;
    }

    const reachability = await checkUrl(suggestion.programUrl);
    await createSuggestion(suggestion, reachability);
    created += 1;
    console.log(`[${dryRun ? "DRY" : "OK"}] ${suggestion.title} | score=${suggestion.score} | http=${reachability.status}`);
  }

  console.log(`\nDone. candidates=${candidates.length}, created=${created}, skipped=${skipped}, dryRun=${dryRun}`);
}

main().catch((err) => {
  console.error("discoverResources failed:", err?.message || err);
  process.exit(1);
});

import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_PROGRAMS_DB_ID;

const dryRun = String(process.env.ENRICH_DRY_RUN ?? "true").toLowerCase() === "true";
const onlyApproved = String(process.env.ENRICH_ONLY_APPROVED ?? "true").toLowerCase() === "true";
const maxItems = Number(process.env.ENRICH_MAX ?? "200");
const requestTimeoutMs = Number(process.env.ENRICH_TIMEOUT_MS ?? "15000");
const flagUnparsedForReview = String(process.env.ENRICH_FLAG_UNPARSED ?? "false").toLowerCase() === "true";

if (!process.env.NOTION_TOKEN) throw new Error("Missing env var: NOTION_TOKEN");
if (!databaseId) throw new Error("Missing env var: NOTION_PROGRAMS_DB_ID");

function normalize(v) {
  return String(v || "").trim().toLowerCase();
}

function resolveProperty(schemaProps, candidates, expectedTypes = []) {
  const candidateSet = new Set(candidates.map(normalize));
  for (const [name, spec] of Object.entries(schemaProps)) {
    if (!candidateSet.has(normalize(name))) continue;
    if (expectedTypes.length === 0 || expectedTypes.includes(spec?.type)) {
      return { name, type: spec?.type, spec };
    }
  }
  return null;
}

function titleText(prop) {
  return (prop?.title || []).map((t) => t.plain_text || "").join("").trim();
}

function richText(prop) {
  return (prop?.rich_text || []).map((t) => t.plain_text || "").join("").trim();
}

function statusText(prop) {
  return prop?.status?.name || prop?.select?.name || "";
}

function urlText(prop) {
  return prop?.url || "";
}

function stripTags(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|br)>/gi, ". ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function sentenceSplit(text) {
  return String(text || "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 25 && s.length <= 300);
}

function scoreSentence(sentence, keywords) {
  const s = sentence.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (s.includes(kw)) score += 3;
  }
  if (/\$[\d,]+/.test(sentence) || /\b\d+(k|m|%)\b/i.test(sentence)) score += 2;
  if (/\b(apply|application|program|startup|founder|company)\b/i.test(sentence)) score += 1;
  return score;
}

function pickTopSentences(text, keywords, maxLen = 380) {
  const scored = sentenceSplit(text)
    .map((s) => ({ s, score: scoreSentence(s, keywords) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return "";

  const chosen = [];
  let total = 0;
  for (const item of scored) {
    const duplicate = chosen.some((c) => normalize(c) === normalize(item.s));
    if (duplicate) continue;
    if (total + item.s.length > maxLen) continue;
    chosen.push(item.s);
    total += item.s.length + 1;
    if (chosen.length >= 2) break;
  }
  return chosen.join(" ").trim();
}

function extractMeta(html, name) {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']+)["'][^>]*>`, "i");
  const m = String(html || "").match(re);
  return m?.[1]?.trim() || "";
}

function extractTitle(html) {
  const m = String(html || "").match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return (m?.[1] || "").replace(/\s+/g, " ").trim();
}

async function fetchPageText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; IowaStartupsSourceBot/1.0; +https://iowastartups.ikwe.ai)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    const html = await res.text();
    const title = extractTitle(html);
    const description = extractMeta(html, "description") || extractMeta(html, "og:description");
    const body = stripTags(html);
    return {
      ok: res.ok,
      status: res.status,
      finalUrl: res.url || url,
      title,
      description,
      body,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function optionExists(spec, value) {
  const options = spec?.select?.options || spec?.status?.options || [];
  const wanted = normalize(value);
  return options.some((o) => normalize(o?.name) === wanted);
}

function mkPropValue(prop, value) {
  if (!prop || value == null || value === "") return null;
  if (prop.type === "rich_text") {
    return {
      [prop.name]: {
        rich_text: [{ type: "text", text: { content: String(value).slice(0, 1900) } }],
      },
    };
  }
  if (prop.type === "url") return { [prop.name]: { url: String(value) } };
  if (prop.type === "date") return { [prop.name]: { date: { start: String(value) } } };
  if (prop.type === "checkbox") return { [prop.name]: { checkbox: Boolean(value) } };
  if (prop.type === "select") {
    if (!optionExists(prop.spec, value)) return null;
    return { [prop.name]: { select: { name: String(value) } } };
  }
  if (prop.type === "status") {
    if (!optionExists(prop.spec, value)) return null;
    return { [prop.name]: { status: { name: String(value) } } };
  }
  return null;
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

async function main() {
  const db = await notion.databases.retrieve({ database_id: databaseId });
  const schema = db.properties || {};

  const nameProp = resolveProperty(schema, ["Name", "Program Name"], ["title"]);
  const statusProp = resolveProperty(schema, ["Status"], ["status", "select"]);
  const reviewProp = resolveProperty(schema, ["Needs review", "Needs Review"], ["checkbox"]);
  const urlProp =
    resolveProperty(schema, ["Application Link", "Apply URL", "URL", "Program URL"], ["url"]) ||
    resolveProperty(schema, ["Source URL", "Source"], ["url"]);

  const whatProp = resolveProperty(schema, ["What you get", "What You Get", "Offer Summary", "Offer"], ["rich_text"]);
  const eligibilityProp = resolveProperty(schema, ["Eligibility Summary", "Eligibility", "Who qualifies"], ["rich_text"]);
  const sourceSummaryProp = resolveProperty(schema, ["Source Summary", "Summary", "Description"], ["rich_text"]);
  const finalUrlProp = resolveProperty(schema, ["Final URL"], ["url", "rich_text"]);
  const lastVerifiedProp = resolveProperty(schema, ["Last Verified", "Last Verified At"], ["date"]);

  if (!urlProp) throw new Error("No URL property found in Programs DB (Application Link/Apply URL/Source URL).");

  const filters = [];
  if (onlyApproved && statusProp) {
    if (statusProp.type === "status") filters.push({ property: statusProp.name, status: { equals: "Active" } });
    if (statusProp.type === "select") filters.push({ property: statusProp.name, select: { equals: "Active" } });
  }
  if (onlyApproved && reviewProp) {
    filters.push({ property: reviewProp.name, checkbox: { equals: false } });
  }

  const query = {
    database_id: databaseId,
    ...(filters.length === 0 ? {} : filters.length === 1 ? { filter: filters[0] } : { filter: { and: filters } }),
  };

  const pages = await fetchAllPages(query);
  const today = new Date().toISOString().slice(0, 10);

  let processed = 0;
  let enriched = 0;
  let failed = 0;

  for (const page of pages) {
    const props = page.properties || {};
    const programName = nameProp ? titleText(props[nameProp.name]) : page.id;
    const targetUrl = urlText(props[urlProp.name]);
    if (!targetUrl) {
      console.log(`[SKIP] ${programName}: missing URL`);
      continue;
    }

    try {
      const source = await fetchPageText(targetUrl);
      const textCorpus = [source.title, source.description, source.body].filter(Boolean).join(". ");

      const whatYouGet = pickTopSentences(textCorpus, [
        "credit",
        "credits",
        "grant",
        "funding",
        "free",
        "discount",
        "save",
        "perk",
        "award",
        "stipend",
        "benefit",
      ]);
      const eligibility = pickTopSentences(textCorpus, [
        "eligible",
        "eligibility",
        "qualify",
        "qualifies",
        "must",
        "requires",
        "requirement",
        "startup",
        "founder",
        "student",
        "company",
      ]);
      const sourceSummary = source.description || pickTopSentences(textCorpus, ["program", "startup", "apply"], 260);

      const updates = {
        ...(mkPropValue(whatProp, whatYouGet) || {}),
        ...(mkPropValue(eligibilityProp, eligibility) || {}),
        ...(mkPropValue(sourceSummaryProp, sourceSummary) || {}),
        ...(mkPropValue(finalUrlProp, source.finalUrl) || {}),
        ...(mkPropValue(lastVerifiedProp, today) || {}),
      };

      if (flagUnparsedForReview && !whatYouGet && !eligibility && reviewProp) {
        Object.assign(updates, mkPropValue(reviewProp, true) || {});
      }

      if (!dryRun && Object.keys(updates).length > 0) {
        await notion.pages.update({ page_id: page.id, properties: updates });
      }

      processed += 1;
      if (whatYouGet || eligibility || sourceSummary) enriched += 1;

      console.log(
        `[${dryRun ? "DRY" : "OK"}] ${programName}: ${source.status} what=${whatYouGet ? "yes" : "no"} elig=${
          eligibility ? "yes" : "no"
        }`,
      );
    } catch (err) {
      failed += 1;
      processed += 1;
      console.log(`[ERR] ${programName}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`\nDone. processed=${processed}, enriched=${enriched}, failed=${failed}, dryRun=${dryRun}`);
}

main().catch((err) => {
  console.error("enrichPrograms failed:", err?.message || err);
  process.exit(1);
});


import { Client } from "@notionhq/client";

// -----------------------------
// Env
// -----------------------------

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const PROGRAMS_DB_ID = process.env.NOTION_PROGRAMS_DB_ID;
const SUGGESTIONS_DB_ID = process.env.NOTION_SUGGESTIONS_DB_ID;

if (!NOTION_TOKEN) throw new Error("Missing env: NOTION_TOKEN");
if (!PROGRAMS_DB_ID) throw new Error("Missing env: NOTION_PROGRAMS_DB_ID");
if (!SUGGESTIONS_DB_ID) throw new Error("Missing env: NOTION_SUGGESTIONS_DB_ID");

const notion = new Client({ auth: NOTION_TOKEN });

// -----------------------------
// Program types
// -----------------------------

export type LinkStatus = "OK" | "Redirect" | "Broken" | "Unknown";
export type ProgramStatus = "Active" | "Paused" | "Deprecated" | "Needs Review";

export type Program = {
  id: string;
  name: string;
  provider?: string;
  categories: string[];
  stage: string[];
  type?: string;
  applyUrl?: string;
  sourceUrl?: string;
  finalUrl?: string;

  // enrichment
  whatYouGet?: string;
  howToApply?: string;
  eligibilityDetailed?: string;
  timeToApplyMin?: number;
  autoSummary?: string;
  extractionConfidence?: "High" | "Medium" | "Low";

  // verification
  linkStatus?: LinkStatus;
  httpStatus?: number;
  lastVerified?: string; // ISO

  // workflow
  status?: ProgramStatus;
  needsReview?: boolean;
};

const P = {
  // Programs DB
  name: "Name", // title
  provider: "Provider", // rich_text
  categories: "Category", // multi_select
  stage: "Stage", // multi_select
  type: "Type", // select or multi_select depending on your DB
  applyUrl: "Apply URL", // url
  sourceUrl: "Source URL", // url
  finalUrl: "Final URL", // url
  whatYouGet: "What you get", // rich_text
  howToApply: "How to apply", // rich_text
  eligibilityDetailed: "Eligibility (detailed)", // rich_text
  timeToApply: "Time to apply (min)", // number
  autoSummary: "Auto summary", // rich_text (or Notes)
  notes: "Notes", // fallback rich_text
  extractionConfidence: "Extraction confidence", // select
  linkStatus: "Link Status", // select
  httpStatus: "HTTP Status", // number
  lastVerified: "Last Verified", // date
  status: "Status", // status
  needsReview: "Needs review", // checkbox
} as const;

function getTitle(props: any, key: string): string {
  const t = props?.[key]?.title;
  if (!Array.isArray(t)) return "";
  return t.map((x: any) => x.plain_text).join("").trim();
}

function getRichText(props: any, key: string): string | undefined {
  const rt = props?.[key]?.rich_text;
  if (!Array.isArray(rt) || rt.length === 0) return undefined;
  const s = rt.map((x: any) => x.plain_text).join("").trim();
  return s || undefined;
}

function getSelect(props: any, key: string): string | undefined {
  const s = props?.[key]?.select?.name;
  return typeof s === "string" ? s : undefined;
}

function getMultiSelect(props: any, key: string): string[] {
  const arr = props?.[key]?.multi_select;
  if (!Array.isArray(arr)) return [];
  return arr.map((x: any) => x.name).filter(Boolean);
}

function getUrl(props: any, key: string): string | undefined {
  const u = props?.[key]?.url;
  return typeof u === "string" ? u : undefined;
}

function getNumber(props: any, key: string): number | undefined {
  const n = props?.[key]?.number;
  return typeof n === "number" ? n : undefined;
}

function getCheckbox(props: any, key: string): boolean | undefined {
  const b = props?.[key]?.checkbox;
  return typeof b === "boolean" ? b : undefined;
}

function getDate(props: any, key: string): string | undefined {
  const d = props?.[key]?.date?.start;
  return typeof d === "string" ? d : undefined;
}

function getStatus(props: any, key: string): ProgramStatus | undefined {
  const s = props?.[key]?.status?.name;
  return typeof s === "string" ? (s as ProgramStatus) : undefined;
}

export async function listPrograms(opts?: {
  onlyVerified?: boolean;
  limit?: number;
}): Promise<Program[]> {
  const onlyVerified = opts?.onlyVerified ?? true;
  const limit = opts?.limit ?? 200;

  const filter: any = onlyVerified
    ? {
        and: [
          { property: P.status, status: { equals: "Active" } },
          { property: P.needsReview, checkbox: { equals: false } },
        ],
      }
    : undefined;

  const res = await notion.databases.query({
    database_id: PROGRAMS_DB_ID!,
    ...(filter ? { filter } : {}),
    page_size: Math.min(limit, 100),
  });

  const pages = res.results as any[];
  const programs = pages.map((page) => {
    const props = page.properties;
    const autoSummary = getRichText(props, P.autoSummary) ?? getRichText(props, P.notes);
    return {
      id: page.id,
      name: getTitle(props, P.name) || "(Untitled)",
      provider: getRichText(props, P.provider),
      categories: getMultiSelect(props, P.categories),
      stage: getMultiSelect(props, P.stage),
      type: getSelect(props, P.type) ?? undefined,
      applyUrl: getUrl(props, P.applyUrl),
      sourceUrl: getUrl(props, P.sourceUrl),
      finalUrl: getUrl(props, P.finalUrl),
      whatYouGet: getRichText(props, P.whatYouGet),
      howToApply: getRichText(props, P.howToApply),
      eligibilityDetailed: getRichText(props, P.eligibilityDetailed),
      timeToApplyMin: getNumber(props, P.timeToApply),
      autoSummary,
      extractionConfidence: (getSelect(props, P.extractionConfidence) as any) ?? undefined,
      linkStatus: (getSelect(props, P.linkStatus) as any) ?? undefined,
      httpStatus: getNumber(props, P.httpStatus),
      lastVerified: getDate(props, P.lastVerified),
      status: getStatus(props, P.status),
      needsReview: getCheckbox(props, P.needsReview),
    } satisfies Program;
  });

  // Basic client-side sort: Provider A→Z, then Name.
  programs.sort((a, b) => {
    const ap = (a.provider || "").toLowerCase();
    const bp = (b.provider || "").toLowerCase();
    if (ap < bp) return -1;
    if (ap > bp) return 1;
    return a.name.localeCompare(b.name);
  });

  return programs;
}

export async function getProgramById(id: string): Promise<Program | null> {
  const page = await notion.pages.retrieve({ page_id: id });
  const props: any = (page as any).properties;
  const autoSummary = getRichText(props, P.autoSummary) ?? getRichText(props, P.notes);
  return {
    id: (page as any).id,
    name: getTitle(props, P.name) || "(Untitled)",
    provider: getRichText(props, P.provider),
    categories: getMultiSelect(props, P.categories),
    stage: getMultiSelect(props, P.stage),
    type: getSelect(props, P.type) ?? undefined,
    applyUrl: getUrl(props, P.applyUrl),
    sourceUrl: getUrl(props, P.sourceUrl),
    finalUrl: getUrl(props, P.finalUrl),
    whatYouGet: getRichText(props, P.whatYouGet),
    howToApply: getRichText(props, P.howToApply),
    eligibilityDetailed: getRichText(props, P.eligibilityDetailed),
    timeToApplyMin: getNumber(props, P.timeToApply),
    autoSummary,
    extractionConfidence: (getSelect(props, P.extractionConfidence) as any) ?? undefined,
    linkStatus: (getSelect(props, P.linkStatus) as any) ?? undefined,
    httpStatus: getNumber(props, P.httpStatus),
    lastVerified: getDate(props, P.lastVerified),
    status: getStatus(props, P.status),
    needsReview: getCheckbox(props, P.needsReview),
  } satisfies Program;
}

// -----------------------------
// Suggestions
// -----------------------------

export type SuggestionType = "New Program" | "Update Existing" | "Broken Link" | "Other";

export function normalizeSuggestionType(v: unknown): SuggestionType {
  const s = String(v || "").trim();
  if (s === "New Program") return "New Program";
  if (s === "Update Existing") return "Update Existing";
  if (s === "Broken Link") return "Broken Link";
  return "Other";
}

export async function createSuggestion(input: {
  title: string;
  suggestionType: SuggestionType;
  relatedProgramId?: string;
  programUrl?: string;
  provider?: string;
  category?: string[];
  stage?: string[];
  whatYouGet?: string;
  eligibility?: string;
  proposedChange?: string;
  evidenceUrl?: string;
  submitterEmail?: string;
  notes?: string;
}) {
  const props: any = {
    Title: { title: [{ type: "text", text: { content: input.title || "Suggestion" } }] },
    "Suggestion Type": { select: { name: input.suggestionType } },
    Status: { select: { name: "Pending" } },
  };

  if (input.relatedProgramId) props["Related Program ID"] = { rich_text: [{ type: "text", text: { content: input.relatedProgramId } }] };
  if (input.programUrl) props["Program URL"] = { url: input.programUrl };
  if (input.provider) props["Provider"] = { rich_text: [{ type: "text", text: { content: input.provider } }] };
  if (input.category?.length) props["Category"] = { multi_select: input.category.map((name) => ({ name })) };
  if (input.stage?.length) props["Stage"] = { multi_select: input.stage.map((name) => ({ name })) };
  if (input.whatYouGet) props["What you get"] = { rich_text: [{ type: "text", text: { content: input.whatYouGet } }] };
  if (input.eligibility) props["Eligibility"] = { rich_text: [{ type: "text", text: { content: input.eligibility } }] };
  if (input.proposedChange) props["Proposed change"] = { rich_text: [{ type: "text", text: { content: input.proposedChange } }] };
  if (input.evidenceUrl) props["Evidence / Source URL"] = { url: input.evidenceUrl };
  if (input.submitterEmail) props["Submitter email"] = { email: input.submitterEmail };
  if (input.notes) props["Notes"] = { rich_text: [{ type: "text", text: { content: input.notes } }] };

  return await notion.pages.create({
    parent: { database_id: SUGGESTIONS_DB_ID! },
    properties: props,
  });
}

export async function listProgramsLite(): Promise<Array<{ id: string; name: string; provider?: string }>> {
  const res = await notion.databases.query({
    database_id: PROGRAMS_DB_ID!,
    filter: { property: P.status, status: { equals: "Active" } },
    page_size: 100,
  });
  const pages = res.results as any[];
  const out = pages.map((page) => {
    const props = page.properties;
    return {
      id: page.id,
      name: getTitle(props, P.name) || "(Untitled)",
      provider: getRichText(props, P.provider),
    };
  });
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

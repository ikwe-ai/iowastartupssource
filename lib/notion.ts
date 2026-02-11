import { Client } from "@notionhq/client";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_PROGRAMS_DB_ID = process.env.NOTION_PROGRAMS_DB_ID;
const NOTION_SUGGESTIONS_DB_ID = process.env.NOTION_SUGGESTIONS_DB_ID;

export type Program = {
  id: string;
  name: string;
  provider: string;
  category: string[];
  whatYouGet?: string;
  howToApply?: string;
  offerType?: string;
  valueUsdEst?: number;
  eligibilitySummary?: string;
  requiresReferral?: boolean;
  geo?: string;
  stage?: string[];
  applyUrl?: string;
  sourceUrl?: string;
  finalUrl?: string;
  sourceType?: string;
  sourceSummary?: string;
  autoSummary?: string;
  notes?: string;
  linkStatus?: string;
  httpStatus?: number;
  status?: string;
  confidence?: string;
  lastVerifiedAt?: string;
  needsReview?: boolean;
};

export type SuggestionInput = {
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
  programId?: string;
  submitterEmail?: string;
  evidenceUrl?: string;
  notes?: string;
};

export type SuggestionType = "New Program" | "Update Existing" | "Broken Link" | "Other";

function reqEnv(name: string, v: string | undefined): string {
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function textFromTitle(prop: any): string {
  const title = prop?.title ?? [];
  return title.map((t: any) => t.plain_text).join("") || "";
}

function textFromRich(prop: any): string {
  const rt = prop?.rich_text ?? [];
  return rt.map((t: any) => t.plain_text).join("") || "";
}

function selectName(prop: any): string | undefined {
  return prop?.select?.name;
}

function statusName(prop: any): string | undefined {
  return prop?.status?.name;
}

function multiSelectNames(prop: any): string[] {
  return (prop?.multi_select ?? []).map((x: any) => x.name);
}

function checkbox(prop: any): boolean | undefined {
  return prop?.checkbox;
}

function url(prop: any): string | undefined {
  return prop?.url;
}

function number(prop: any): number | undefined {
  const n = prop?.number;
  return typeof n === "number" ? n : undefined;
}

function numberFromRich(prop: any): number | undefined {
  const txt = textFromRich(prop);
  const m = txt.match(/\d+/);
  if (!m) return undefined;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : undefined;
}

function date(prop: any): string | undefined {
  return prop?.date?.start;
}

export function notionClient() {
  return new Client({ auth: reqEnv("NOTION_TOKEN", NOTION_TOKEN) });
}

function pickExistingProperty(
  allProperties: Record<string, any>,
  names: string[],
  type?: string,
): string | undefined {
  const normalized = new Set(names.map((n) => n.toLowerCase()));
  for (const [propName, spec] of Object.entries(allProperties)) {
    const nameMatches = normalized.has(propName.toLowerCase());
    if (!nameMatches) continue;
    if (!type || spec?.type === type) return propName;
  }
  return undefined;
}

function pickByType(allProperties: Record<string, any>, type: string): string | undefined {
  for (const [name, spec] of Object.entries(allProperties)) {
    if (spec?.type === type) return name;
  }
  return undefined;
}

function optionExists(propSpec: any, value: string): boolean {
  const options = propSpec?.select?.options ?? propSpec?.status?.options ?? [];
  const wanted = value.toLowerCase();
  return options.some((opt: any) => String(opt?.name || "").toLowerCase() === wanted);
}

function richTextValue(content: string) {
  return {
    rich_text: [{ type: "text", text: { content: content.slice(0, 1900) } }],
  };
}

function setSchemaValue(
  target: Record<string, any>,
  allProperties: Record<string, any>,
  candidates: string[],
  rawValue: any,
  allowedTypes: string[],
) {
  const propName = candidates
    .map((name) => pickExistingProperty(allProperties, [name]))
    .find((name) => {
      if (!name) return false;
      const t = allProperties[name]?.type;
      return allowedTypes.includes(t);
    });
  if (!propName) return;

  const propType = allProperties[propName]?.type;
  const isEmptyString = typeof rawValue === "string" && rawValue.trim() === "";
  const isEmptyArray = Array.isArray(rawValue) && rawValue.length === 0;
  if (rawValue == null || isEmptyString || isEmptyArray) return;

  if (propType === "title") {
    target[propName] = { title: [{ type: "text", text: { content: String(rawValue).slice(0, 1900) } }] };
    return;
  }
  if (propType === "rich_text") {
    target[propName] = richTextValue(String(rawValue));
    return;
  }
  if (propType === "url") {
    target[propName] = { url: String(rawValue) };
    return;
  }
  if (propType === "email") {
    target[propName] = { email: String(rawValue) };
    return;
  }
  if (propType === "multi_select") {
    const values = (Array.isArray(rawValue) ? rawValue : [rawValue])
      .map((x) => String(x).trim())
      .filter(Boolean);
    if (values.length === 0) return;
    target[propName] = { multi_select: values.map((name) => ({ name })) };
    return;
  }
  if (propType === "select") {
    const value = String(rawValue);
    if (optionExists(allProperties[propName], value)) {
      target[propName] = { select: { name: value } };
    }
    return;
  }
  if (propType === "status") {
    const value = String(rawValue);
    if (optionExists(allProperties[propName], value)) {
      target[propName] = { status: { name: value } };
    }
  }
}

export async function listPrograms(): Promise<Program[]> {
  const notion = notionClient();
  const dbId = reqEnv("NOTION_PROGRAMS_DB_ID", NOTION_PROGRAMS_DB_ID);

  const resp = await notion.databases.query({
    database_id: dbId,
    page_size: 200,
    filter: {
      and: [
        {
          property: "Status",
          status: { equals: "Active" },
        },
        {
          property: "Needs review",
          checkbox: { equals: false },
        },
      ],
    },
  });

  return resp.results.map((page: any) => {
    const props = page.properties ?? {};
    const name = textFromTitle(props["Name"]);
    const provider = selectName(props["Provider"]) ?? textFromRich(props["Provider"]) ?? "Unknown";
    const category = multiSelectNames(props["Category"]);
    const stage = multiSelectNames(props["Stage"]) || multiSelectNames(props["Best For Stage"]);
    return {
      id: page.id,
      name,
      provider,
      category,
      whatYouGet: textFromRich(props["What you get"]) ?? textFromRich(props["Offer Summary"]) ?? textFromRich(props["Offer"]),
      howToApply: textFromRich(props["How to apply"]) ?? textFromRich(props["How To Apply"]) ?? textFromRich(props["Application Steps"]),
      offerType: selectName(props["Offer Type"]) ?? textFromRich(props["Offer Type"]),
      valueUsdEst: number(props["Value (USD est.)"]) ?? number(props["Value"]),
      eligibilitySummary: textFromRich(props["Eligibility Summary"]) ?? textFromRich(props["Eligibility"]),
      requiresReferral: checkbox(props["Requires VC/Accelerator Referral"]) ?? checkbox(props["Requires Referral"]),
      geo: selectName(props["Geo Restrictions"]) ?? textFromRich(props["Geo"]),
      stage,
      applyUrl: url(props["Apply URL"]) ?? url(props["Application Link"]) ?? url(props["Program URL"]),
      sourceUrl: url(props["Source URL"]) ?? url(props["Source"]),
      finalUrl: url(props["Final URL"]) ?? textFromRich(props["Final URL"]),
      sourceType: selectName(props["Source Type"]) ?? textFromRich(props["Source Type"]),
      sourceSummary: textFromRich(props["Source Summary"]) ?? textFromRich(props["Summary"]) ?? textFromRich(props["Description"]),
      autoSummary: textFromRich(props["Auto summary"]) ?? textFromRich(props["Auto Summary"]),
      notes: textFromRich(props["Notes"]),
      linkStatus:
        selectName(props["Link Status"]) ??
        statusName(props["Link Status"]) ??
        textFromRich(props["Link Status"]),
      httpStatus: number(props["HTTP Status"]) ?? numberFromRich(props["HTTP Status"]),
      status: statusName(props["Status"]),
      confidence:
        selectName(props["Extraction confidence"]) ??
        selectName(props["Confidence"]) ??
        textFromRich(props["Extraction confidence"]) ??
        textFromRich(props["Confidence"]),
      lastVerifiedAt: date(props["Last Verified"]) ?? date(props["Last Verified At"]),
      needsReview: checkbox(props["Needs review"]),
    };
  });
}

export async function getProgram(programId: string): Promise<Program | null> {
  const notion = notionClient();
  try {
    const page: any = await notion.pages.retrieve({ page_id: programId });
    const props = page.properties ?? {};
    const name = textFromTitle(props["Name"]);
    const provider = selectName(props["Provider"]) ?? textFromRich(props["Provider"]) ?? "Unknown";
    const category = multiSelectNames(props["Category"]);
    const stage = multiSelectNames(props["Stage"]) || multiSelectNames(props["Best For Stage"]);
    return {
      id: page.id,
      name,
      provider,
      category,
      whatYouGet: textFromRich(props["What you get"]) ?? textFromRich(props["Offer Summary"]) ?? textFromRich(props["Offer"]),
      howToApply: textFromRich(props["How to apply"]) ?? textFromRich(props["How To Apply"]) ?? textFromRich(props["Application Steps"]),
      offerType: selectName(props["Offer Type"]) ?? textFromRich(props["Offer Type"]),
      valueUsdEst: number(props["Value (USD est.)"]) ?? number(props["Value"]),
      eligibilitySummary: textFromRich(props["Eligibility Summary"]) ?? textFromRich(props["Eligibility"]),
      requiresReferral: checkbox(props["Requires VC/Accelerator Referral"]) ?? checkbox(props["Requires Referral"]),
      geo: selectName(props["Geo Restrictions"]) ?? textFromRich(props["Geo"]),
      stage,
      applyUrl: url(props["Apply URL"]) ?? url(props["Application Link"]) ?? url(props["Program URL"]),
      sourceUrl: url(props["Source URL"]) ?? url(props["Source"]),
      finalUrl: url(props["Final URL"]) ?? textFromRich(props["Final URL"]),
      sourceType: selectName(props["Source Type"]) ?? textFromRich(props["Source Type"]),
      sourceSummary: textFromRich(props["Source Summary"]) ?? textFromRich(props["Summary"]) ?? textFromRich(props["Description"]),
      autoSummary: textFromRich(props["Auto summary"]) ?? textFromRich(props["Auto Summary"]),
      notes: textFromRich(props["Notes"]),
      linkStatus:
        selectName(props["Link Status"]) ??
        statusName(props["Link Status"]) ??
        textFromRich(props["Link Status"]),
      httpStatus: number(props["HTTP Status"]) ?? numberFromRich(props["HTTP Status"]),
      status: statusName(props["Status"]),
      confidence:
        selectName(props["Extraction confidence"]) ??
        selectName(props["Confidence"]) ??
        textFromRich(props["Extraction confidence"]) ??
        textFromRich(props["Confidence"]),
      lastVerifiedAt: date(props["Last Verified"]) ?? date(props["Last Verified At"]),
      needsReview: checkbox(props["Needs review"]),
    };
  } catch {
    return null;
  }
}

export async function createSuggestion(input: SuggestionInput): Promise<string> {
  const notion = notionClient();
  if (!NOTION_TOKEN) throw new Error("Missing NOTION_TOKEN");
  if (!NOTION_SUGGESTIONS_DB_ID) throw new Error("Missing NOTION_SUGGESTIONS_DB_ID");

  const properties: Record<string, any> = {
    Title: {
      title: [{ text: { content: input.title.slice(0, 2000) } }],
    },
    "Suggestion Type": {
      select: { name: input.suggestionType },
    },
    Status: {
      select: { name: "Pending" },
    },
    ...(input.relatedProgramId
      ? { "Related Program ID": { rich_text: [{ text: { content: input.relatedProgramId.slice(0, 2000) } }] } }
      : {}),
    ...(input.programUrl ? { "Program URL": { url: input.programUrl } } : {}),
    ...(input.provider
      ? { Provider: { rich_text: [{ text: { content: input.provider.slice(0, 2000) } }] } }
      : {}),
    ...(Array.isArray(input.category) && input.category.length
      ? { Category: { multi_select: input.category.map((c) => ({ name: c })) } }
      : {}),
    ...(Array.isArray(input.stage) && input.stage.length
      ? { Stage: { multi_select: input.stage.map((s) => ({ name: s })) } }
      : {}),
    ...(input.whatYouGet
      ? { "What you get": { rich_text: [{ text: { content: input.whatYouGet.slice(0, 2000) } }] } }
      : {}),
    ...(input.eligibility
      ? { Eligibility: { rich_text: [{ text: { content: input.eligibility.slice(0, 2000) } }] } }
      : {}),
    ...(input.proposedChange
      ? { "Proposed change": { rich_text: [{ text: { content: input.proposedChange.slice(0, 2000) } }] } }
      : {}),
    ...(input.evidenceUrl ? { "Evidence / Source URL": { url: input.evidenceUrl } } : {}),
    ...(input.submitterEmail ? { "Submitter email": { email: input.submitterEmail } } : {}),
    ...(input.programId
      ? { "Program ID": { rich_text: [{ text: { content: input.programId.slice(0, 2000) } }] } }
      : {}),
    ...(input.notes ? { Notes: { rich_text: [{ text: { content: input.notes.slice(0, 2000) } }] } } : {}),
  };

  const page: any = await notion.pages.create({
    parent: { database_id: NOTION_SUGGESTIONS_DB_ID },
    properties,
  });
  return page.id;
}

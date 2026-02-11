import { Client } from "@notionhq/client";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_PROGRAMS_DB_ID = process.env.NOTION_PROGRAMS_DB_ID;
const NOTION_SUGGESTIONS_DB_ID = process.env.NOTION_SUGGESTIONS_DB_ID;

export type Program = {
  id: string;
  name: string;
  provider: string;
  category: string[];
  offerType?: string;
  valueUsdEst?: number;
  eligibilitySummary?: string;
  requiresReferral?: boolean;
  geo?: string;
  stage?: string[];
  applyUrl?: string;
  sourceUrl?: string;
  sourceType?: string;
  status?: string;
  confidence?: string;
  lastVerifiedAt?: string;
  needsReview?: boolean;
};

export type SuggestionInput = {
  title: string;
  suggestionType: string;
  relatedProgramId?: string;
  programUrl?: string;
  provider?: string;
  category?: string[];
  stage?: string[];
  whatYouGet?: string;
  eligibility?: string;
  proposedChange?: string;
  submitterEmail?: string;
  evidenceUrl?: string;
  notes?: string;
};

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

  const dbSchema: any = await notion.databases.retrieve({ database_id: dbId });
  const schemaProps = dbSchema?.properties ?? {};

  const statusProp =
    pickExistingProperty(schemaProps, ["Status"], "status") ??
    pickExistingProperty(schemaProps, ["Status"], "select");
  const statusType = statusProp ? schemaProps[statusProp]?.type : undefined;
  const reviewProp = pickExistingProperty(schemaProps, [
    "Needs Review",
    "Needs review",
    "NeedsReview",
    "Review Needed",
    "Needs QA",
  ], "checkbox");

  const filters: any[] = [];
  if (statusProp && statusType === "status") {
    filters.push({
      property: statusProp,
      status: { equals: "Active" },
    });
  } else if (statusProp && statusType === "select") {
    filters.push({
      property: statusProp,
      select: { equals: "Active" },
    });
  }
  if (reviewProp) {
    filters.push({
      property: reviewProp,
      checkbox: { equals: false },
    });
  }

  const resp = await notion.databases.query({
    database_id: dbId,
    page_size: 200,
    ...(filters.length === 0
      ? {}
      : filters.length === 1
        ? { filter: filters[0] }
        : { filter: { and: filters } }),
  });

  return resp.results.map((page: any) => {
    const props = page.properties ?? {};
    // Match these property names to your Notion database fields
    const name = textFromTitle(props["Program Name"] ?? props["Name"] ?? props["Program"]);
    const provider = selectName(props["Provider"]) ?? textFromRich(props["Provider"]) ?? "Unknown";
    const category = multiSelectNames(props["Category"]);
    const stage = multiSelectNames(props["Best For Stage"]) || multiSelectNames(props["Stage"]);
    return {
      id: page.id,
      name,
      provider,
      category,
      offerType: selectName(props["Offer Type"]) ?? textFromRich(props["Offer Type"]),
      valueUsdEst: number(props["Value (USD est.)"]) ?? number(props["Value"]),
      eligibilitySummary: textFromRich(props["Eligibility Summary"]) ?? textFromRich(props["Eligibility"]),
      requiresReferral: checkbox(props["Requires VC/Accelerator Referral"]) ?? checkbox(props["Requires Referral"]),
      geo: selectName(props["Geo Restrictions"]) ?? textFromRich(props["Geo"]),
      stage,
      applyUrl: url(props["Application Link"]) ?? url(props["Apply URL"]),
      sourceUrl: url(props["Source URL"]) ?? url(props["Source"]),
      sourceType: selectName(props["Source Type"]) ?? textFromRich(props["Source Type"]),
      status: statusName(props["Status"]) ?? selectName(props["Status"]) ?? textFromRich(props["Status"]),
      confidence: selectName(props["Confidence"]) ?? textFromRich(props["Confidence"]),
      lastVerifiedAt: date(props["Last Verified"]) ?? date(props["Last Verified At"]),
      needsReview:
        checkbox(props["Needs Review"]) ??
        checkbox(props["Needs review"]) ??
        checkbox(props["NeedsReview"]) ??
        checkbox(props["Review Needed"]) ??
        checkbox(props["Needs QA"]),
    };
  });
}

export async function getProgram(programId: string): Promise<Program | null> {
  const notion = notionClient();
  try {
    const page: any = await notion.pages.retrieve({ page_id: programId });
    const props = page.properties ?? {};
    const name = textFromTitle(props["Program Name"] ?? props["Name"] ?? props["Program"]);
    const provider = selectName(props["Provider"]) ?? textFromRich(props["Provider"]) ?? "Unknown";
    const category = multiSelectNames(props["Category"]);
    const stage = multiSelectNames(props["Best For Stage"]) || multiSelectNames(props["Stage"]);
    return {
      id: page.id,
      name,
      provider,
      category,
      offerType: selectName(props["Offer Type"]) ?? textFromRich(props["Offer Type"]),
      valueUsdEst: number(props["Value (USD est.)"]) ?? number(props["Value"]),
      eligibilitySummary: textFromRich(props["Eligibility Summary"]) ?? textFromRich(props["Eligibility"]),
      requiresReferral: checkbox(props["Requires VC/Accelerator Referral"]) ?? checkbox(props["Requires Referral"]),
      geo: selectName(props["Geo Restrictions"]) ?? textFromRich(props["Geo"]),
      stage,
      applyUrl: url(props["Application Link"]) ?? url(props["Apply URL"]),
      sourceUrl: url(props["Source URL"]) ?? url(props["Source"]),
      sourceType: selectName(props["Source Type"]) ?? textFromRich(props["Source Type"]),
      status: statusName(props["Status"]) ?? selectName(props["Status"]) ?? textFromRich(props["Status"]),
      confidence: selectName(props["Confidence"]) ?? textFromRich(props["Confidence"]),
      lastVerifiedAt: date(props["Last Verified"]) ?? date(props["Last Verified At"]),
      needsReview:
        checkbox(props["Needs Review"]) ??
        checkbox(props["Needs review"]) ??
        checkbox(props["NeedsReview"]) ??
        checkbox(props["Review Needed"]) ??
        checkbox(props["Needs QA"]),
    };
  } catch {
    return null;
  }
}

export async function createSuggestion(input: SuggestionInput): Promise<void> {
  const notion = notionClient();
  const dbId = reqEnv("NOTION_SUGGESTIONS_DB_ID", NOTION_SUGGESTIONS_DB_ID);
  const dbSchema: any = await notion.databases.retrieve({ database_id: dbId });
  const schemaProps = dbSchema?.properties ?? {};
  const props: Record<string, any> = {};

  const titleProp = pickExistingProperty(schemaProps, ["Title"], "title") ?? pickByType(schemaProps, "title");
  if (titleProp) {
    props[titleProp] = {
      title: [{ type: "text", text: { content: input.title.slice(0, 1900) } }],
    };
  }

  setSchemaValue(props, schemaProps, ["Suggestion Type", "Type"], input.suggestionType, ["select", "status"]);
  setSchemaValue(props, schemaProps, ["Related Program ID", "Program ID"], input.relatedProgramId, ["rich_text"]);
  setSchemaValue(props, schemaProps, ["Program URL", "URL", "Program Link"], input.programUrl, ["url", "rich_text"]);
  setSchemaValue(props, schemaProps, ["Provider"], input.provider, ["rich_text"]);
  setSchemaValue(props, schemaProps, ["Category"], input.category ?? [], ["multi_select"]);
  setSchemaValue(props, schemaProps, ["Stage"], input.stage ?? [], ["multi_select"]);
  setSchemaValue(props, schemaProps, ["What you get", "What You Get"], input.whatYouGet, ["rich_text"]);
  setSchemaValue(props, schemaProps, ["Eligibility"], input.eligibility, ["rich_text"]);
  setSchemaValue(props, schemaProps, ["Proposed change", "Proposed Change"], input.proposedChange, ["rich_text"]);
  setSchemaValue(props, schemaProps, ["Submitter email", "Email"], input.submitterEmail, ["rich_text", "email"]);
  setSchemaValue(props, schemaProps, ["Evidence / Source URL", "Evidence URL", "Source URL"], input.evidenceUrl, ["url", "rich_text"]);
  setSchemaValue(props, schemaProps, ["Notes"], input.notes, ["rich_text"]);

  const statusProp =
    pickExistingProperty(schemaProps, ["Status"], "status") ??
    pickExistingProperty(schemaProps, ["Status"], "select");
  if (statusProp && optionExists(schemaProps[statusProp], "Pending")) {
    if (schemaProps[statusProp].type === "status") {
      props[statusProp] = { status: { name: "Pending" } };
    } else {
      props[statusProp] = { select: { name: "Pending" } };
    }
  }

  await notion.pages.create({
    parent: { database_id: dbId },
    properties: props,
  });
}

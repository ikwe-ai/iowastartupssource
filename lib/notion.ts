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

export async function listPrograms(): Promise<Program[]> {
  const notion = notionClient();
  const dbId = reqEnv("NOTION_PROGRAMS_DB_ID", NOTION_PROGRAMS_DB_ID);

  const baseQuery = {
    database_id: dbId,
    page_size: 200 as const,
  };

  let resp: any;
  try {
    resp = await notion.databases.query({
      ...baseQuery,
      filter: {
        and: [
          {
            property: "Status",
            status: { equals: "Active" },
          },
          {
            property: "Needs Review",
            checkbox: { equals: false },
          },
        ],
      },
    });
  } catch (err: any) {
    const message = String(err?.message || "");
    const isStatusTypeMismatch = message.includes("database property status does not match filter status");
    if (!isStatusTypeMismatch) throw err;

    resp = await notion.databases.query({
      ...baseQuery,
      filter: {
        and: [
          {
            property: "Status",
            select: { equals: "Active" },
          },
          {
            property: "Needs Review",
            checkbox: { equals: false },
          },
        ],
      },
    });
  }

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
      status: selectName(props["Status"]) ?? textFromRich(props["Status"]),
      confidence: selectName(props["Confidence"]) ?? textFromRich(props["Confidence"]),
      lastVerifiedAt: date(props["Last Verified"]) ?? date(props["Last Verified At"]),
      needsReview: checkbox(props["Needs Review"]),
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
      status: selectName(props["Status"]) ?? textFromRich(props["Status"]),
      confidence: selectName(props["Confidence"]) ?? textFromRich(props["Confidence"]),
      lastVerifiedAt: date(props["Last Verified"]) ?? date(props["Last Verified At"]),
      needsReview: checkbox(props["Needs Review"]),
    };
  } catch {
    return null;
  }
}

export async function createSuggestion(input: {
  programId?: string;
  notes: string;
  submitterEmail?: string;
}): Promise<void> {
  const notion = notionClient();
  const dbId = reqEnv("NOTION_SUGGESTIONS_DB_ID", NOTION_SUGGESTIONS_DB_ID);

  await notion.pages.create({
    parent: { database_id: dbId },
    properties: {
      "Title": {
        title: [{ type: "text", text: { content: input.programId ? `Update: ${input.programId}` : "New Suggestion" } }],
      },
      "Program ID": input.programId
        ? { rich_text: [{ type: "text", text: { content: input.programId } }] }
        : { rich_text: [] },
      "Notes": { rich_text: [{ type: "text", text: { content: input.notes } }] },
      "Email": input.submitterEmail
        ? { rich_text: [{ type: "text", text: { content: input.submitterEmail } }] }
        : { rich_text: [] },
      "Status": { select: { name: "Pending" } }
    },
  });
}

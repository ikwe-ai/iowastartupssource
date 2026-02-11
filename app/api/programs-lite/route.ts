import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const PROGRAMS_DB_ID = process.env.NOTION_PROGRAMS_DB_ID!;

export async function GET() {
  try {
    if (!process.env.NOTION_TOKEN) throw new Error("Missing NOTION_TOKEN");
    if (!PROGRAMS_DB_ID) throw new Error("Missing NOTION_PROGRAMS_DB_ID");

    const res = await notion.databases.query({
      database_id: PROGRAMS_DB_ID,
      page_size: 200,
      filter: {
        and: [
          { property: "Status", status: { equals: "Active" } },
          { property: "Needs review", checkbox: { equals: false } },
        ],
      },
      sorts: [{ property: "Name", direction: "ascending" }],
    });

    const items = res.results.map((r: any) => {
      const title = r.properties?.Name?.title?.[0]?.plain_text || "Untitled";

      const provider =
        r.properties?.Provider?.rich_text?.[0]?.plain_text ||
        r.properties?.Provider?.title?.[0]?.plain_text ||
        r.properties?.Provider?.select?.name ||
        "";

      const url =
        r.properties?.["Apply URL"]?.url ||
        r.properties?.["Application Link"]?.url ||
        r.properties?.URL?.url ||
        r.properties?.Link?.url ||
        r.properties?.["Program URL"]?.url ||
        "";

      return { id: r.id, title, provider, url };
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}

import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const suggestionsDbId = process.env.NOTION_SUGGESTIONS_DB_ID;

const dryRun = String(process.env.SUGGESTIONS_CHECK_DRY_RUN ?? "false").toLowerCase() === "true";
const maxItems = Number(process.env.SUGGESTIONS_CHECK_MAX ?? "200");

if (!process.env.NOTION_TOKEN) throw new Error("Missing env var: NOTION_TOKEN");
if (!suggestionsDbId) throw new Error("Missing env var: NOTION_SUGGESTIONS_DB_ID");

function compact(value, max = 1700) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function notesFromProp(prop) {
  return (prop?.rich_text || []).map((x) => x?.plain_text || "").join(" ").trim();
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

async function fetchPending() {
  const out = [];
  let cursor = undefined;

  while (out.length < maxItems) {
    const resp = await notion.databases.query({
      database_id: suggestionsDbId,
      page_size: Math.min(100, maxItems - out.length),
      start_cursor: cursor,
      filter: {
        property: "Status",
        select: { equals: "Pending" },
      },
    });
    out.push(...resp.results);
    if (!resp.has_more || !resp.next_cursor) break;
    cursor = resp.next_cursor;
  }
  return out;
}

async function main() {
  const rows = await fetchPending();
  let checked = 0;
  let flagged = 0;

  for (const row of rows) {
    const props = row.properties || {};
    const title = props?.Title?.title?.[0]?.plain_text || row.id;
    const programUrl = props?.["Program URL"]?.url || "";
    if (!programUrl) continue;

    const result = await checkUrl(programUrl);
    checked += 1;

    const statusLabel =
      result.status >= 200 && result.status < 300
        ? "OK"
        : result.status >= 300 && result.status < 400
          ? "Redirect"
          : "Broken";

    if (statusLabel !== "OK") flagged += 1;

    const oldNotes = notesFromProp(props.Notes);
    const merged = compact(
      [
        oldNotes,
        `Pending check: ${statusLabel} (${result.status})`,
        result.finalUrl ? `Final URL: ${result.finalUrl}` : "",
        result.error ? `Error: ${result.error}` : "",
      ]
        .filter(Boolean)
        .join(" | "),
    );

    const updateProps = {
      Notes: {
        rich_text: [{ text: { content: merged } }],
      },
      ...(statusLabel === "Broken"
        ? {
            "Proposed change": {
              rich_text: [{ text: { content: "Auto-check flagged this suggestion URL as broken. Verify source before approval." } }],
            },
          }
        : {}),
    };

    if (!dryRun) {
      await notion.pages.update({
        page_id: row.id,
        properties: updateProps,
      });
    }

    console.log(`[${dryRun ? "DRY" : "OK"}] ${title}: ${statusLabel} (${result.status})`);
  }

  console.log(`\nDone. checked=${checked}, flagged=${flagged}, dryRun=${dryRun}`);
}

main().catch((err) => {
  console.error("checkPendingSuggestions failed:", err?.message || err);
  process.exit(1);
});

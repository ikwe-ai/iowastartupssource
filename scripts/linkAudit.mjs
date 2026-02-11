import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_PROGRAMS_DB_ID;

const dryRun = String(process.env.LINK_AUDIT_DRY_RUN ?? "false").toLowerCase() === "true";
const activeStatusValue = process.env.LINK_AUDIT_ACTIVE_VALUE ?? "Active";
const setStatusOnBroken = String(process.env.LINK_AUDIT_SET_STATUS_ON_BROKEN ?? "true").toLowerCase() === "true";
const brokenStatusValue = process.env.LINK_AUDIT_BROKEN_STATUS_VALUE ?? "Needs Review";
const flagRedirectForReview = String(process.env.LINK_AUDIT_FLAG_REDIRECT_REVIEW ?? "true").toLowerCase() === "true";

if (!process.env.NOTION_TOKEN) {
  throw new Error("Missing env var: NOTION_TOKEN");
}
if (!databaseId) {
  throw new Error("Missing env var: NOTION_PROGRAMS_DB_ID");
}

function normalize(s) {
  return String(s || "").trim().toLowerCase();
}

function resolveProperty(schemaProps, candidates, expectedTypes = []) {
  const candidateSet = new Set(candidates.map(normalize));
  for (const [name, spec] of Object.entries(schemaProps)) {
    if (!candidateSet.has(normalize(name))) continue;
    if (expectedTypes.length === 0 || expectedTypes.includes(spec?.type)) {
      return { name, type: spec?.type };
    }
  }
  return null;
}

function getUrlFromProperty(prop) {
  if (!prop) return "";
  if (typeof prop.url === "string" && prop.url.trim()) return prop.url.trim();
  const rich = prop.rich_text || [];
  const text = rich.map((x) => x?.plain_text || "").join("").trim();
  return text;
}

async function checkUrl(url) {
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (res.status === 403 || res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: "GET", redirect: "follow" });
    }

    const finalUrl = res.url || url;
    const redirected = normalize(finalUrl) !== normalize(url);

    let linkStatus = "Unknown";
    if (res.status >= 200 && res.status < 300) {
      linkStatus = redirected ? "Redirect" : "OK";
    } else if (res.status >= 400) {
      linkStatus = "Broken";
    }

    return {
      ok: linkStatus !== "Broken",
      linkStatus,
      httpStatus: res.status,
      finalUrl,
      error: "",
    };
  } catch (err) {
    return {
      ok: false,
      linkStatus: "Broken",
      httpStatus: 0,
      finalUrl: url,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function buildPropertyValue(type, value) {
  if (value == null || value === "") return null;
  if (type === "select") return { select: { name: String(value) } };
  if (type === "status") return { status: { name: String(value) } };
  if (type === "checkbox") return { checkbox: Boolean(value) };
  if (type === "number") return { number: Number(value) };
  if (type === "url") return { url: String(value) };
  if (type === "rich_text") {
    return {
      rich_text: [{ type: "text", text: { content: String(value).slice(0, 1900) } }],
    };
  }
  if (type === "date") return { date: { start: String(value) } };
  return null;
}

function statusOptionExists(schemaSpec, value) {
  const options = schemaSpec?.select?.options || schemaSpec?.status?.options || [];
  const optionSet = new Set(options.map((o) => normalize(o?.name)));
  return optionSet.has(normalize(value));
}

async function fetchPages(query) {
  const out = [];
  let cursor = undefined;
  while (true) {
    const resp = await notion.databases.query({ ...query, start_cursor: cursor });
    out.push(...resp.results);
    if (!resp.has_more || !resp.next_cursor) break;
    cursor = resp.next_cursor;
  }
  return out;
}

async function main() {
  const db = await notion.databases.retrieve({ database_id: databaseId });
  const schemaProps = db.properties || {};

  const urlProp = resolveProperty(
    schemaProps,
    [
      process.env.LINK_AUDIT_URL_PROP || "Application Link",
      "Apply URL",
      "URL",
      "Website",
      "Canonical URL",
      "Canonical Link",
    ],
    ["url", "rich_text"],
  );

  const statusProp =
    resolveProperty(schemaProps, [process.env.LINK_AUDIT_STATUS_PROP || "Status"], ["status"]) ||
    resolveProperty(schemaProps, [process.env.LINK_AUDIT_STATUS_PROP || "Status"], ["select"]);

  const reviewProp = resolveProperty(
    schemaProps,
    [
      process.env.LINK_AUDIT_REVIEW_PROP || "Needs Review",
      "Needs review",
      "NeedsReview",
      "Review Needed",
      "Needs QA",
    ],
    ["checkbox"],
  );

  const linkStatusProp = resolveProperty(
    schemaProps,
    [process.env.LINK_AUDIT_LINK_STATUS_PROP || "Link Status"],
    ["select", "status"],
  );

  const httpStatusProp = resolveProperty(
    schemaProps,
    [process.env.LINK_AUDIT_HTTP_STATUS_PROP || "HTTP Status"],
    ["number", "rich_text"],
  );

  const finalUrlProp = resolveProperty(
    schemaProps,
    [process.env.LINK_AUDIT_FINAL_URL_PROP || "Final URL"],
    ["url", "rich_text"],
  );

  const lastVerifiedProp =
    resolveProperty(schemaProps, ["Last Verified", "Last Verified At"], ["date"]);

  if (!urlProp) {
    throw new Error("No link property found. Set LINK_AUDIT_URL_PROP to your canonical URL property name.");
  }

  const filters = [];
  if (statusProp) {
    if (statusProp.type === "status") {
      filters.push({ property: statusProp.name, status: { equals: activeStatusValue } });
    } else {
      filters.push({ property: statusProp.name, select: { equals: activeStatusValue } });
    }
  }
  if (reviewProp) {
    filters.push({ property: reviewProp.name, checkbox: { equals: false } });
  }

  const query = {
    database_id: databaseId,
    page_size: 100,
    ...(filters.length === 0 ? {} : filters.length === 1 ? { filter: filters[0] } : { filter: { and: filters } }),
  };

  const pages = await fetchPages(query);
  const today = new Date().toISOString().slice(0, 10);

  let processed = 0;
  let broken = 0;

  for (const page of pages) {
    const props = page.properties || {};
    const programName =
      props["Program Name"]?.title?.[0]?.plain_text ||
      props["Name"]?.title?.[0]?.plain_text ||
      page.id;

    const inputUrl = getUrlFromProperty(props[urlProp.name]);
    if (!inputUrl) {
      processed += 1;
      broken += 1;
      const updateProps = {};
      if (reviewProp) updateProps[reviewProp.name] = { checkbox: true };
      if (linkStatusProp) {
        const v = buildPropertyValue(linkStatusProp.type, "Broken");
        if (v) updateProps[linkStatusProp.name] = v;
      }
      if (httpStatusProp) {
        const v = buildPropertyValue(httpStatusProp.type, "0");
        if (v) updateProps[httpStatusProp.name] = v;
      }
      if (lastVerifiedProp) {
        const v = buildPropertyValue(lastVerifiedProp.type, today);
        if (v) updateProps[lastVerifiedProp.name] = v;
      }
      if (!dryRun && Object.keys(updateProps).length > 0) {
        await notion.pages.update({ page_id: page.id, properties: updateProps });
      }
      console.log(`[${dryRun ? "DRY" : "OK"}] ${programName}: missing URL -> Broken`);
      continue;
    }

    const result = await checkUrl(inputUrl);
    processed += 1;
    if (!result.ok) broken += 1;

    const updateProps = {};

    if (linkStatusProp) {
      const statusValue = result.linkStatus;
      if (statusOptionExists(schemaProps[linkStatusProp.name], statusValue)) {
        const v = buildPropertyValue(linkStatusProp.type, statusValue);
        if (v) updateProps[linkStatusProp.name] = v;
      }
    }

    if (httpStatusProp) {
      const v = buildPropertyValue(httpStatusProp.type, result.httpStatus);
      if (v) updateProps[httpStatusProp.name] = v;
    }

    if (finalUrlProp) {
      const v = buildPropertyValue(finalUrlProp.type, result.finalUrl);
      if (v) updateProps[finalUrlProp.name] = v;
    }

    if (lastVerifiedProp) {
      const v = buildPropertyValue(lastVerifiedProp.type, today);
      if (v) updateProps[lastVerifiedProp.name] = v;
    }

    if (!result.ok && reviewProp) {
      updateProps[reviewProp.name] = { checkbox: true };
    }
    if (result.linkStatus === "Redirect" && flagRedirectForReview && reviewProp) {
      updateProps[reviewProp.name] = { checkbox: true };
    }

    if (!result.ok && setStatusOnBroken && statusProp) {
      if (statusOptionExists(schemaProps[statusProp.name], brokenStatusValue)) {
        const v = buildPropertyValue(statusProp.type, brokenStatusValue);
        if (v) updateProps[statusProp.name] = v;
      }
    }

    if (!dryRun && Object.keys(updateProps).length > 0) {
      await notion.pages.update({ page_id: page.id, properties: updateProps });
    }

    const marker = result.ok ? "OK" : "BROKEN";
    const errInfo = result.error ? ` (${result.error})` : "";
    console.log(`[${dryRun ? "DRY" : marker}] ${programName}: ${result.httpStatus} ${result.finalUrl}${errInfo}`);
  }

  console.log(`\nDone. Processed: ${processed}, broken: ${broken}, dryRun: ${dryRun}`);
}

main().catch((err) => {
  console.error("Link audit failed:", err?.message || err);
  process.exit(1);
});

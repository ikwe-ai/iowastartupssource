import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.NOTION_SUGGESTIONS_DB_ID;

if (!process.env.NOTION_TOKEN) {
  throw new Error("Missing env var: NOTION_TOKEN");
}
if (!dbId) {
  throw new Error("Missing env var: NOTION_SUGGESTIONS_DB_ID");
}

const res = await notion.databases.retrieve({ database_id: dbId });
console.log("\nSuggestions DB:", res.title?.[0]?.plain_text || "(untitled)");
console.log("ID:", dbId);
console.log("\nProperties:");
for (const [name, meta] of Object.entries(res.properties)) {
  console.log(`- ${name} (${meta.type})`);
}
console.log("");

console.log(
  [
    "Use the new automation scripts instead:",
    "  npm run auto:add-suggestions   # seed/ingest candidates into Suggestions DB (Pending)",
    "  npm run auto:check-pending     # health-check pending suggestion URLs and annotate Notes",
    "Human gate remains required before publish: move only verified items to Programs DB Active + Needs review unchecked.",
  ].join("\n"),
);

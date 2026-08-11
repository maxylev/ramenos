---
description: Internet Researcher. Low-cost hidden subagent for Google searches, website visits, source-grounded summaries, and current external facts. Uses live web data only and returns concise findings.
mode: subagent
color: "#27d7f5"
model: opencode-go/deepseek-v4-flash
variant: max
permission:
  task: deny
  edit: deny
  bash: deny
  question: deny
  searchfetch_*: allow
  websearch: allow
  webfetch: deny
hidden: true
---

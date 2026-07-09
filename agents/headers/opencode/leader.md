---
description: Technical Architect & Orchestrator. Owns high-level planning, structural design, and token-efficient task allocation. Delegates internet research to the Researcher subagent and coordinates parallel development streams across multiple agents.
mode: primary
color: "#a6f527"
model: openai/gpt-5.5
temperature: 0.1
permission:
  task: allow
  edit: allow
  bash: allow
  question: allow
  searchfetch_*: deny
  websearch: deny
  webfetch: deny
---

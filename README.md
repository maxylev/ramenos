# 🤖 Ramenos CLI

[![npm version](https://img.shields.io/npm/v/ramenos.svg?style=flat-square)](https://www.npmjs.com/package/ramenos)
[![0 dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg?style=flat-square)](https://www.npmjs.com/package/ramenos)
[![CI Tests](https://img.shields.io/github/actions/workflow/status/maxylev/ramenos/ci.yml?style=flat-square)](https://github.com/maxylev/ramenos/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

A lightning-fast, **zero-dependency** CLI to share and install AI multi-agent orchestration configurations directly from GitHub into your local workspace.

Designed for modern AI coding assistants like [OpenCode](https://opencode.ai/), [Gemini CLI](https://github.com/google-gemini/gemini-cli), [Claude Code](https://code.claude.com/), and [Codex](https://developers.openai.com/codex/). Bootstrapping a focused multi-agent AI team is one command away.

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [📖 Usage Guide](#-usage-guide)
  - [Commands](#commands)
  - [Options](#options)
  - [Examples](#examples)
- [🎯 Target Frameworks](#-target-frameworks)
- [📋 Presets](#-presets)
- [🔗 Supported Repository Formats](#-supported-repository-formats)
- [🛠️ Creating Your Own Agent Repo](#-creating-your-own-agent-repo)
- [🏗️ How It Works](#-how-it-works)
- [🧠 Advanced: OpenCode & 9router Setup](#-advanced-opencode--9router-setup)

---

## ✨ Features

- 🚀 **Zero Dependencies**: Built with native Node.js. Incredibly fast execution.
- 🔗 **Smart Caching**: Uses local caching to safely manage agent files without cluttering your project.
- 🐙 **Flexible Git Support**: Supports GitHub shorthand, raw HTTPS, SSH, and deep folder trees.
- 🎯 **Multi-Framework**: Install to `.opencode/agents/`, `.gemini/agents/`, `.claude/agents/`, `.codex/agents/`, or any custom structure — all from a single command.
- 📋 **Presets**: Choose between `new` (full startup pipeline) and `continue` (task delegation for existing projects).
- 🧩 **Header + Prompt Architecture**: Framework-specific headers are combined with shared prompts at install time — no duplication.
- 🗑️ **Clean Uninstall**: Remove agents with `ramenos del` using the same options.

---

## 🚀 Quick Start

No global installation is required! Run it directly via `npx` inside your project directory:

```bash
# Add agents for an existing project (defaults: opencode + continue preset)
npx ramenos add maxylev/ramenos

# Add agents for all supported frameworks
npx ramenos add maxylev/ramenos -a opencode gemini claude codex

# Add agents for a new startup project
npx ramenos add maxylev/ramenos -p new

# Add agents globally
npx ramenos add maxylev/ramenos --global
```

To remove agents later:

```bash
# Remove the same agents you installed
npx ramenos del maxylev/ramenos

# Remove from all frameworks
npx ramenos del maxylev/ramenos -a opencode gemini claude codex

# Remove from global directory
npx ramenos del maxylev/ramenos -g
```

---

## 📖 Usage Guide

### Commands

| Command            | Description                             |
| :----------------- | :-------------------------------------- |
| `add <repository>` | Install agent files into your project   |
| `del <repository>` | Remove previously installed agent files |

### Options

```text
Usage: ramenos <add|del> <repository> [options]

Options:
  -g, --global              Target the framework's global agent directory
  -a, --agent <agents...>   Target frameworks. Defaults to 'opencode'.
                            Supported: opencode, gemini, claude, codex, or any custom name.
  -p, --preset <preset>     Prompt preset: 'new' or 'continue'. Defaults to 'continue'.
                            new      — Full startup pipeline (ideation → deployment)
                            continue — Task delegation for existing projects
  --copy                    Copy files instead of symlinking (legacy mode only)
  -y, --yes                 Skip all confirmation prompts
  -h, --help                Display help message
```

### Examples

**Install for all supported frameworks at once:**

```bash
npx ramenos add maxylev/ramenos -a opencode gemini claude codex
```

**Start a new startup project from scratch:**

```bash
npx ramenos add maxylev/ramenos -p new
```

**Install for Gemini CLI with the continue preset:**

```bash
npx ramenos add maxylev/ramenos -a gemini -p continue
```

**Remove agents from a specific framework:**

```bash
npx ramenos del maxylev/ramenos -a gemini
```

**Remove all agents and clean up:**

```bash
npx ramenos del maxylev/ramenos -a opencode gemini claude codex
```

**CI/CD or Automated Scripting:**

```bash
npx ramenos add maxylev/ramenos --yes -a opencode gemini claude codex
```

---

## 🎯 Target Frameworks

Ramenos knows the correct directory structure for popular AI tools:

| Framework    | Local Path          | Global Path (`-g`)           |
| :----------- | :------------------ | :--------------------------- |
| `opencode`   | `.opencode/agents/` | `~/.config/opencode/agents/` |
| `gemini`     | `.gemini/agents/`   | `~/.gemini/agents/`          |
| `claude`     | `.claude/agents/`   | `~/.claude/agents/`          |
| `codex`      | `.codex/agents/`    | `~/.codex/agents/`           |
| _any custom_ | `.<name>/agents/`   | `~/.config/<name>/agents/`   |

---

## 📋 Presets

Presets control the system prompt that gets combined with the framework-specific header at install time.

### `continue` (default)

For **existing projects** that need a leader/developer hierarchy. The developer reports to the leader until the user's assigned task is complete. No planning files, no phases — just task delegation and verification.

### `new`

For **starting from scratch** — a full startup pipeline with phases: Ideation → Validation → Architecture → Planning → Implementation → Testing → Deployment. Uses `IMPLEMENTATION_PLAN.md` for state tracking.

---

## 🔗 Supported Repository Formats

Ramenos looks for an `agents/` folder by default in the root of the repository, but supports deep links if you want to pull a specific sub-folder.

**1. GitHub Shorthand**:

```bash
npx ramenos add my-labs/my-awesome-agents
```

**2. Direct Sub-folder Links**:

```bash
npx ramenos add https://github.com/ai-labs/my-agents/tree/main/agents/orchestration
```

**3. SSH Formats**:

```bash
npx ramenos add git@github.com:my-company/internal-agents.git
```

---

## 🛠️ Creating Your Own Agent Repo

Want to share your own agents via `ramenos`? Use the structured format with separate headers and prompts:

```text
my-awesome-agents/
├── README.md
└── agents/
    ├── headers/
    │   ├── opencode/
    │   │   ├── leader.md      # Frontmatter for opencode
    │   │   ├── developer.md
    │   │   └── researcher.md  # Web-only research subagent
    │   ├── gemini/
    │   │   ├── leader.md      # Frontmatter for gemini
    │   │   ├── developer.md
    │   │   └── researcher.md
    │   ├── claude/
    │   │   ├── leader.md      # Frontmatter for claude
    │   │   ├── developer.md
    │   │   └── researcher.md
    │   └── codex/
    │       ├── leader.toml    # Base Codex custom-agent config
    │       ├── developer.toml
    │       └── researcher.toml
    └── prompts/
        ├── new/
        │   ├── leader.md      # Prompt body for "new" preset
        │   ├── developer.md
        │   └── researcher.md
        └── continue/
            ├── leader.md      # Prompt body for "continue" preset
            ├── developer.md
            └── researcher.md
```

Then anyone can install your setup using:
`npx ramenos add your-username/my-awesome-agents`

### Header Files

Header files contain only framework-specific configuration. OpenCode, Gemini, and Claude use YAML frontmatter with `---` delimiters. Codex uses a TOML base configuration; Ramenos adds the selected prompt as the required top-level `developer_instructions` field.

**opencode** (`headers/opencode/leader.md`):

```yaml
---
description: My leader agent description
mode: primary
model: router/leader
temperature: 0.1
---
```

**gemini** (`headers/gemini/leader.md`):

```yaml
---
name: leader
description: My leader agent description
tools:
  - read_file
  - write_file
  - grep_search
---
```

**claude** (`headers/claude/leader.md`):

```yaml
---
name: leader
description: My leader agent description
tools: Agent(developer), Read, Glob, Grep, Bash
model: inherit
permissionMode: auto
---
```

**codex** (`headers/codex/developer.toml`):

```toml
name = "developer"
description = "Implementation-focused engineer for targeted code changes and tests."
nickname_candidates = ["Builder", "Forge"]
model = "gpt-5.6-terra"
model_reasoning_effort = "medium"
sandbox_mode = "workspace-write"
```

Do not add `developer_instructions` to a Codex header. Ramenos generates it from `prompts/<preset>/<agent>.md`. Codex custom agents inherit omitted configuration from the parent session, so model, reasoning, sandbox, MCP, and skill settings can be left out when inheritance is preferred.

### Prompt Files

Prompt files contain **only the markdown body** (no frontmatter). They are shared across all frameworks:

```markdown
You are the Leader agent. Your job is to orchestrate the development workflow...

**RULES:**

- Rule 1
- Rule 2
```

### Researcher Subagent

Ramenos includes a focused `researcher` subagent for internet work. The leader and developer prompts delegate live web searches, documentation checks, and market facts to the researcher instead of filling their own context with web pages. Framework headers limit the researcher to read-only or web-focused capabilities where supported.

The researcher prompt requires visited-source verification, concise citations, dates for time-sensitive claims, and clear disclosure when evidence cannot be verified.

For Codex, custom agents are spawned agents rather than primary personas. If you spawn `leader` and expect it to delegate to `developer` or `researcher`, configure `agents.max_depth = 2` in Codex. Keep the default depth of `1` when the root session delegates directly to the developer and researcher agents.

---

## 🏗️ How It Works

### `add`

1. **Fetch**: The repository is cloned (or updated) into `~/.ramenos/cache/`.
2. **Detect**: If the source has `headers/` and `prompts/` subdirectories, structured mode is used.
3. **Combine**: For each target framework, matching header and prompt files are combined. Markdown/YAML targets produce `.md` files; Codex TOML headers produce `.toml` files with generated `developer_instructions`.
4. **Install**: Final agent files are written to the framework's project or global agent directory.

### `del`

1. **Fetch**: The repository is fetched (same as `add`) to determine which files were installed.
2. **Remove**: For each target framework, matching agent files are deleted from its selected project or global agent directory.
3. **Cleanup**: If the agents directory is empty after removal, it is deleted automatically.

---

## 🧠 Advanced: OpenCode & 9router Setup (for custom model)

For users setting up an advanced local agent workflow with fallback models and delegated web research, follow these steps to integrate OpenCode, `9router`, and the `searchfetch` MCP server.

### 1. Model Routing with 9router

Run the following command to install and start the `9router`:

```bash
npm install -g 9router
9router
```

_Configure `9router` via the UI at `http://localhost:20128` to create model combos with fallback support (e.g., configuring `leader` and `developer` endpoints)._

### 2. OpenCode Configuration

Update your `opencode.json` file to point to your local 9router instance:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "router": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "router",
      "options": {
        "baseURL": "http://localhost:20128/v1"
      },
      "models": {
        "leader": {
          "name": "leader"
        },
        "developer": {
          "name": "developer"
        },
        "researcher": {
          "name": "researcher"
        }
      }
    }
  }
}
```

Configure the `researcher` route to use a lower-cost model, then set `model: router/researcher` in `agents/headers/opencode/researcher.md` if you want installed researcher agents to use that route.

### 3. Web Research Subagent (MCP)

Equip only the hidden `researcher` subagent with web search and website-fetching capability. The leader and developer agent files deny direct `searchfetch` access and instruct agents to delegate current internet facts to `@researcher`.

Add the MCP servers to `opencode.json`; access is controlled per agent by the installed agent permissions.

**MCP `searchfetch`**:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "searchfetch": {
      "type": "local",
      "command": ["npx", "-y", "searchfetch"],
      "enabled": true
    }
  }
}
```

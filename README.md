# 🤖 Ramenos CLI

[![npm version](https://img.shields.io/npm/v/ramenos.svg?style=flat-square)](https://www.npmjs.com/package/ramenos)
[![0 dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg?style=flat-square)](https://www.npmjs.com/package/ramenos)
[![CI Tests](https://img.shields.io/github/actions/workflow/status/maxylev/ramenos/ci.yml?style=flat-square)](https://github.com/maxylev/ramenos/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

A lightning-fast, **zero-dependency** CLI to share and install AI multi-agent orchestration configurations directly from GitHub into your local workspace.

Designed for modern AI coding assistants like [OpenCode](https://opencode.ai/), [Gemini CLI](https://github.com/google-gemini/gemini-cli), and [Claude Code](https://code.claude.com/). Bootstrapping an elite multi-agent AI team is now just one command away.

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
- 🎯 **Multi-Framework**: Install to `.opencode/agents/`, `.gemini/agents/`, `.claude/agents/`, or any custom structure — all from a single command.
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
npx ramenos add maxylev/ramenos -a opencode gemini claude

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
npx ramenos del maxylev/ramenos -a opencode gemini claude

# Remove from global directory
npx ramenos del maxylev/ramenos -g
```

---

## 📖 Usage Guide

### Commands

| Command | Description |
| :--- | :--- |
| `add <repository>` | Install agent files into your project |
| `del <repository>` | Remove previously installed agent files |

### Options

```text
Usage: ramenos <add|del> <repository> [options]

Options:
  -g, --global              Target global (~/.config/) instead of local project
  -a, --agent <agents...>   Target frameworks. Defaults to 'opencode'.
                            Supported: opencode, gemini, claude, or any custom name.
  -p, --preset <preset>     Prompt preset: 'new' or 'continue'. Defaults to 'continue'.
                            new      — Full startup pipeline (ideation → deployment)
                            continue — Task delegation for existing projects
  --copy                    Copy files instead of symlinking (legacy mode only)
  -y, --yes                 Skip all confirmation prompts
  -h, --help                Display help message
```

### Examples

**Install for all three frameworks at once:**
```bash
npx ramenos add maxylev/ramenos -a opencode gemini claude
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
npx ramenos del maxylev/ramenos -a opencode gemini claude
```

**CI/CD or Automated Scripting:**
```bash
npx ramenos add maxylev/ramenos --yes -a opencode gemini claude
```

---

## 🎯 Target Frameworks

Ramenos knows the correct directory structure for popular AI tools:

| Framework | Local Path | Global Path (`-g`) |
| :--- | :--- | :--- |
| `opencode` | `.opencode/agents/` | `~/.config/opencode/agents/` |
| `gemini` | `.gemini/agents/` | `~/.gemini/agents/` |
| `claude` | `.claude/agents/` | `~/.claude/agents/` |
| *any custom* | `.<name>/agents/` | `~/.config/<name>/agents/` |

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
    │   │   └── developer.md
    │   ├── gemini/
    │   │   ├── leader.md      # Frontmatter for gemini
    │   │   └── developer.md
    │   └── claude/
    │       ├── leader.md      # Frontmatter for claude
    │       └── developer.md
    └── prompts/
        ├── new/
        │   ├── leader.md      # Prompt body for "new" preset
        │   └── developer.md
        └── continue/
            ├── leader.md      # Prompt body for "continue" preset
            └── developer.md
```

Then anyone can install your setup using:
`npx ramenos add your-username/my-awesome-agents`

### Header Files

Header files contain **only the YAML frontmatter** (including `---` delimiters). Each framework has its own format:

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

### Prompt Files

Prompt files contain **only the markdown body** (no frontmatter). They are shared across all frameworks:

```markdown
You are the Leader agent. Your job is to orchestrate the development workflow...

**RULES:**
- Rule 1
- Rule 2
```

---

## 🏗️ How It Works

### `add`
1. **Fetch**: The repository is cloned (or updated) into `~/.ramenos/cache/`.
2. **Detect**: If the source has `headers/` and `prompts/` subdirectories, structured mode is used.
3. **Combine**: For each target framework, matching header and prompt files are combined:
   - Header from `agents/headers/{framework}/{file}.md`
   - Prompt from `agents/prompts/{preset}/{file}.md`
   - Combined into a single `.md` file written to the target directory.
4. **Install**: The final agent files are written to `.{framework}/agents/` in your project.

### `del`
1. **Fetch**: The repository is fetched (same as `add`) to determine which files were installed.
2. **Remove**: For each target framework, the matching agent files are deleted from `.{framework}/agents/`.
3. **Cleanup**: If the agents directory is empty after removal, it is deleted automatically.

---

## 🧠 Advanced: OpenCode & 9router Setup (for custom model)

For users setting up an advanced local agent workflow with fallback models and web search capabilities, follow these steps to integrate OpenCode, `9router`, and MCP servers.

### 1. Model Routing with 9router

Run the following command to install and start the `9router`:

```bash
npm install -g 9router
9router
```

*Configure `9router` via the UI at `http://localhost:20128` to create model combos with fallback support (e.g., configuring `leader` and `developer` endpoints).*

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
        }
      }
    }
  }
}
```

### 3. Web Search & Context (MCP)

Equip your agents with web search and up-to-date documentation scraping. Add the desired tools to your `opencode.json`.

**MCP `searchfetch` & `context7`**:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "searchfetch": {
      "type": "local",
      "command": ["npx", "-y", "searchfetch"],
      "enabled": true
    },
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "your_api_key_here"
      },
      "enabled": true
    }
  }
}
```

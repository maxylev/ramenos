# 🤖 Ramenos CLI

[![npm version](https://img.shields.io/npm/v/ramenos.svg?style=flat-square)](https://www.npmjs.com/package/ramenos)
[![0 dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg?style=flat-square)](https://www.npmjs.com/package/ramenos)
[![CI Tests](https://img.shields.io/github/actions/workflow/status/maxylev/ramenos/ci.yml?style=flat-square)](https://github.com/maxylev/ramenos/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

A lightning-fast, **zero-dependency** CLI to share and install AI multi-agent orchestration configurations directly from GitHub into your local workspace.

Designed for modern AI coding assistants like [OpenCode](https://opencode.ai/). Bootstrapping an elite multi-agent AI team is now just one command away.

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [📖 Usage Guide](#-usage-guide)
  - [Options](#options)
  - [Examples](#examples)
- [🔗 Supported Repository Formats](#-supported-repository-formats)
- [🎯 Dynamic Target Paths](#-dynamic-target-paths)
- [🛠️ Creating Your Own Agent Repo](#-creating-your-own-agent-repo)
- [🧠 Advanced: OpenCode & 9router Setup](#-advanced-opencode--9router-setup)
  - [1. Model Routing (9router)](#1-model-routing-with-9router)
  - [2. OpenCode Configuration](#2-opencode-configuration)
  - [3. Web Search & Context (MCP)](#3-web-search--context-mcp)

---

## ✨ Features

- 🚀 **Zero Dependencies**: Built with native Node.js. Incredibly fast execution.
- 🔗 **Smart Caching**: Uses local caching to safely symlink agent files without cluttering your project.
- 🐙 **Flexible Git Support**: Supports GitHub shorthand, raw HTTPS, SSH, and deep folder trees.
- 🎯 **Dynamic Frameworks**: By default targets `opencode`, but supports dynamic path generation for *any* agent framework you provide.

---

## 🚀 Quick Start

No global installation is required! Run it directly via `npx` inside your project directory:

```bash
# Add an AI agent team to your current project (defaults to OpenCode)
npx ramenos add maxylev/ramenos

# Add agents globally to your machine
npx ramenos add maxylev/ramenos --global
```

---

## 📖 Usage Guide

### Options

```text
Usage: ramenos add <repository> [options]

Options:
  -g, --global              Install to user directory instead of project workspace
  -a, --agent <agents...>   Target specific agent frameworks (defaults to 'opencode')
  --copy                    Copy files instead of symlinking (useful to modify them locally)
  -y, --yes                 Skip all confirmation prompts
  -h, --help                Display help message
```

### Examples

**Install to multiple AI assistant structures at once:**
```bash
npx ramenos add maxylev/ramenos -a opencode codex
```

**Copy files instead of symlinking (so you can edit the prompts):**
```bash
npx ramenos add maxylev/ramenos --copy
```

**CI/CD or Automated Scripting (Skip all prompts):**
```bash
npx ramenos add maxylev/ramenos --yes
```

---

## 🔗 Supported Repository Formats

Ramenos looks for an `agents/` folder by default in the root of the repository, but supports deep links if you want to pull a specific sub-folder.

**1. GitHub Shorthand**:
```bash
npx ramenos add my-labs/my-awesome-agents
```

**2. Direct Sub-folder Links** (Grab specific agents from a larger monorepo):
```bash
npx ramenos add https://github.com/ai-labs/my-agents/tree/main/agents/orchestration
```

**3. SSH Formats** (For private repositories, assuming SSH keys are configured):
```bash
npx ramenos add git@github.com:my-company/internal-agents.git
```

---

## 🎯 Dynamic Target Paths

`ramenos` dynamically generates file paths based on the `--agent` parameter you pass. If omitted, it gracefully defaults to `opencode`.

| Command | Local Path Generated | Global Path Generated (`-g`) |
| :--- | :--- | :--- |
| `ramenos add repo` | `.opencode/agents/` | `~/.config/opencode/agents/` |
| `ramenos add repo -a myapp` | `.myapp/agents/` | `~/.config/myapp/agents/` |
| `ramenos add repo -a foo bar` | `.foo/agents/` & `.bar/agents/` | `~/.config/foo/agents/` & `~/.config/bar/agents/` |

---

## 🛠️ Creating Your Own Agent Repo

Want to share your own agents via `ramenos`? Just create a public GitHub repository and place your markdown (`.md`) or JSON config files inside an `agents/` directory at the root.

```text
my-awesome-agents/
├── README.md
└── agents/
    ├── leader.md
    └── developer.md
```

Then anyone can install your setup using: 
`npx ramenos add your-username/my-awesome-agents`

---

## 🧠 Advanced: OpenCode & 9router Setup

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

Equip your OpenCode agents with web search and up-to-date documentation scraping. Add the desired tools to your `opencode.json`.

**Option A: Default Exa Search** (May occasionally be blocked by bot-protection)
```bash
OPENCODE_ENABLE_EXA=1 opencode
```

**Option B: MCP `searchfetch` & `context7`** (Recommended for human-like scraping and latest docs)
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
*Note: `context7` is highly recommended for querying the absolute latest version documentation directly into your agent's context.*

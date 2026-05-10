# 🤖 Ramenos CLI

[![npm version](https://img.shields.io/npm/v/ramenos.svg?style=flat-square)](https://www.npmjs.com/package/ramenos)
[![0 dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg?style=flat-square)](https://www.npmjs.com/package/ramenos)
[![CI Tests](https://img.shields.io/github/actions/workflow/status/maxylev/ramenos/ci.yml?style=flat-square)](https://github.com/maxylev/ramenos/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

A lightning-fast, **zero-dependency** CLI to share and install AI multi-agent orchestration configurations directly from GitHub into your local workspace.

Designed for modern AI coding assistants like [OpenCode](https://opencode.ai/). Bootstrapping an elite multi-agent AI team is now just one command away.

---

## ✨ Features

- 🚀 **Zero Dependencies**: Built with native Node.js. Incredibly fast execution.
- 🔗 **Smart Caching**: Uses local caching to safely symlink agent files without cluttering your project.
- 🐙 **Flexible Git Support**: Supports GitHub shorthand, raw HTTPS, SSH, and deep folder trees.
- 🎯 **Dynamic Frameworks**: By default targets `opencode`, but supports dynamic path generation for *any* agent framework you provide.

## 🚀 Quick Start

No global install required! Just run it via `npx` inside your project directory:

```bash
# Add an AI agent team to your current project (defaults to OpenCode)
npx ramenos add maxylev/ramenos

# Add agents globally to your machine
npx ramenos add maxylev/ramenos --global
```

## 📖 Usage Options

```text
Usage: ramenos add <repository> [options]

Options:
  -g, --global              Install to user directory instead of project workspace
  -a, --agent <agents...>   Target specific agent frameworks (defaults to 'opencode')
  --copy                    Copy files instead of symlinking (useful to modify them locally)
  -y, --yes                 Skip all confirmation prompts
  -h, --help                Display help message
```

## 🎯 Dynamic Target Paths

`ramenos` dynamically generates file paths based on the `--agent` parameter you pass. If omitted, it gracefully defaults to `opencode`.

| Command | Local Path Generated | Global Path Generated (`-g`) |
| :--- | :--- | :--- |
| `ramenos add repo` | `.opencode/agents/` | `~/.config/opencode/agents/` |
| `ramenos add repo -a myapp` | `.myapp/agents/` | `~/.config/myapp/agents/` |
| `ramenos add repo -a foo bar` | `.foo/agents/` & `.bar/agents/` | `~/.config/foo/agents/` & `~/.config/bar/agents/` |

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

## 💡 Examples

**Install to multiple AI assistant structures at once:**
```bash
npx ramenos add maxylev/ramenos -a opencode claude-code codex
```

**Copy files instead of symlinking (so you can edit the prompts):**
```bash
npx ramenos add maxylev/ramenos --copy
```

**CI/CD or Automated Scripting (Skip all prompts):**
```bash
npx ramenos add maxylev/ramenos --yes
```

## 🛠️ Creating Your Own Agent Repo

Want to share your own agents via `ramenos`? Just create a public GitHub repository and place your markdown (`.md`) or JSON config files inside an `agents/` directory at the root.

```text
my-awesome-agents/
├── README.md
└── agents/
    ├── orchestrator.md
    ├── developer.md
    └── tester.md
```

Then anyone can install your setup using: `npx ramenos add your-username/my-awesome-agents`

## Use 9router

Run the following command to start the 9router:

```bash
npm install -g 9router
9router
```

- Configure 9router:

`http://localhost:20128`

Create model combos with fallback support:
- chef
- cook
- coordinator
- critic
- innovator
- logistician
- master
- taster

- Configure opencode:

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
        "chef": {
          "name": "chef"
        },
        "cook": {
          "name": "cook"
        },
        "coordinator": {
          "name": "coordinator"
        },
        "critic": {
          "name": "critic"
        },
        "innovator": {
          "name": "innovator"
        },
        "logistician": {
          "name": "logistician"
        },
        "master": {
          "name": "master"
        },
        "taster": {
          "name": "taster"
        }
      }
    }
  }
}
```

Run opencode with websearch:

```bash
OPENCODE_ENABLE_EXA=1 opencode
```

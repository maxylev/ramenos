#!/usr/bin/env node

import {
  parseArgs,
  parseInput,
  fetchRepo,
  installAgents,
  VALID_PRESETS,
  colorize,
} from "../src/index.js";

function printHelp() {
  console.log(`
${colorize("cyan", "🤖 Ramenos CLI")}
A fast, zero-dependency CLI to share and install AI multi-agent orchestration files.

${colorize("yellow", "Usage:")}
  ramenos add <repository> [options]

${colorize("yellow", "Options:")}
  -g, --global              Install globally to user directory instead of local project
  -a, --agent <agents...>   Target frameworks. Defaults to 'opencode' if omitted.
                            Supported: opencode, gemini, claude, or any custom name.
  -p, --preset <preset>     Prompt preset: 'new' or 'continue'. Defaults to 'continue'.
                            new      — Full startup pipeline (ideation → deployment)
                            continue — Task delegation for existing projects
  --copy                    Copy files completely instead of creating symlinks
  -y, --yes                 Skip all confirmation prompts
  -h, --help                Display this help message

${colorize("yellow", "Examples:")}
  ramenos add ai-labs/my-agents
  ramenos add maxylev/ramenos --agent opencode gemini claude
  ramenos add maxylev/ramenos -p new
  ramenos add ./my-labs/my-awesome-agents
  ramenos add ai-labs/my-agents -g --copy -p new
  ramenos add https://github.com/ai-labs/my-agents/tree/main/agents/my
`);
}

async function run() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help || !options.command) {
    printHelp();
    process.exit(0);
  }

  if (options.command === "add") {
    if (!options.repository) {
      console.error(
        colorize("red", "\n❌ Error: Repository argument is required."),
      );
      console.log(colorize("gray", "   Try: ramenos add user/repo\n"));
      process.exit(1);
    }

    if (!VALID_PRESETS.includes(options.preset)) {
      console.error(
        colorize(
          "red",
          `\n❌ Error: Invalid preset '${options.preset}'. Valid: ${VALID_PRESETS.join(", ")}`,
        ),
      );
      process.exit(1);
    }

    try {
      const repoConfig = parseInput(options.repository);
      if (!repoConfig) throw new Error("Invalid repository format provided.");

      const sourcePath = fetchRepo(repoConfig);
      await installAgents(sourcePath, options);

      console.log(
        colorize("green", "\n✨ Done! Agent files successfully installed.\n"),
      );
    } catch (err) {
      console.error(colorize("red", `\n❌ Fatal Error: ${err.message}\n`));
      process.exit(1);
    }
  } else {
    console.error(
      colorize("red", `\n❌ Error: Unknown command '${options.command}'\n`),
    );
    process.exit(1);
  }
}

run();

#!/usr/bin/env node

import {
  parseArgs,
  parseInput,
  fetchRepo,
  installAgents,
  removeAgents,
  VALID_PRESETS,
  colorize,
} from "../src/index.js";

function printHelp() {
  console.log(`
${colorize("cyan", "🤖 Ramenos CLI")}
A fast, zero-dependency CLI to share and install AI multi-agent orchestration files.

${colorize("yellow", "Usage:")}
  ramenos add <repository> [options]
  ramenos del <repository> [options]

${colorize("yellow", "Commands:")}
  add                       Install agent files into your project
  del                       Remove previously installed agent files

${colorize("yellow", "Options:")}
  -g, --global              Target the framework's global agent directory
  -a, --agent <agents...>   Target frameworks. Defaults to 'opencode' if omitted.
                            Supported: opencode, gemini, claude, codex, or any custom name.
  -p, --preset <preset>     Prompt preset: 'new' or 'continue'. Defaults to 'continue'.
                            new      — Full startup pipeline (ideation → deployment)
                            continue — Task delegation for existing projects
  --copy                    Copy files completely instead of creating symlinks
  -y, --yes                 Skip all confirmation prompts
  -h, --help                Display this help message

${colorize("yellow", "Examples:")}
  ramenos add ai-labs/my-agents
  ramenos add maxylev/ramenos --agent opencode gemini claude codex
  ramenos add maxylev/ramenos -p new
  ramenos del maxylev/ramenos
  ramenos del maxylev/ramenos -a opencode gemini claude codex
  ramenos del maxylev/ramenos -g
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
  } else if (options.command === "del") {
    if (!options.repository) {
      console.error(
        colorize("red", "\n❌ Error: Repository argument is required."),
      );
      console.log(colorize("gray", "   Try: ramenos del user/repo\n"));
      process.exit(1);
    }

    try {
      const repoConfig = parseInput(options.repository);
      if (!repoConfig) throw new Error("Invalid repository format provided.");

      const sourcePath = fetchRepo(repoConfig);
      await removeAgents(sourcePath, options);

      console.log(
        colorize("green", "\n✨ Done! Agent files successfully removed.\n"),
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

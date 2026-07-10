import fs from "fs";
import path from "path";
import os from "os";
import { execFileSync } from "child_process";
import readline from "readline";

export const RAMENOS_CACHE_DIR = path.join(os.homedir(), ".ramenos", "cache");

export const VALID_PRESETS = ["new", "continue"];

export const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

const FRAMEWORK_PATHS = {
  opencode: { global: ".config/opencode", local: ".opencode" },
  gemini: { global: ".gemini", local: ".gemini" },
  claude: { global: ".claude", local: ".claude" },
  codex: { global: ".codex", local: ".codex" },
};

const FRAMEWORK_HEADER_EXTENSIONS = {
  codex: ".toml",
};

export function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

export function getTargetPaths(framework) {
  const safeName = framework.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const config = FRAMEWORK_PATHS[safeName];

  if (config) {
    return {
      global: path.join(os.homedir(), config.global, "agents"),
      local: path.join(process.cwd(), config.local, "agents"),
    };
  }

  return {
    global: path.join(os.homedir(), ".config", safeName, "agents"),
    local: path.join(process.cwd(), `.${safeName}`, "agents"),
  };
}

export function parseArgs(args) {
  const options = {
    global: false,
    agent: [],
    preset: "continue",
    copy: false,
    yes: false,
    command: null,
    repository: null,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      options.help = true;
    } else if ((arg === "add" || arg === "del") && !options.command) {
      options.command = arg;
      if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        options.repository = args[++i];
      }
    } else if (arg === "-g" || arg === "--global") {
      options.global = true;
    } else if (arg === "-y" || arg === "--yes") {
      options.yes = true;
    } else if (arg === "--copy") {
      options.copy = true;
    } else if (arg === "-a" || arg === "--agent") {
      while (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        options.agent.push(args[++i]);
      }
    } else if (arg === "-p" || arg === "--preset") {
      if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        options.preset = args[++i];
      }
    }
  }
  return options;
}

export function parseInput(input) {
  if (!input) return null;

  let resolvedPath = input;
  if (input.startsWith("~/")) {
    resolvedPath = path.join(os.homedir(), input.slice(2));
  } else {
    resolvedPath = path.resolve(input);
  }

  const isExplicitLocal =
    input.startsWith("./") ||
    input.startsWith("../") ||
    input.startsWith("/") ||
    input.startsWith("~/") ||
    input.startsWith(".\\") ||
    input.startsWith("..\\") ||
    /^[A-Za-z]:[\\/]/.test(input);

  if (
    isExplicitLocal ||
    (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory())
  ) {
    const agentsSubdir = path.join(resolvedPath, "agents");
    if (
      fs.existsSync(agentsSubdir) &&
      fs.statSync(agentsSubdir).isDirectory()
    ) {
      resolvedPath = agentsSubdir;
    }

    return {
      isLocal: true,
      sourcePath: resolvedPath,
    };
  }

  const treeMatch = input.match(
    /github\.com\/([^/]+\/[^/]+)\/tree\/([^/]+)\/(.+)/,
  );
  if (treeMatch) {
    return {
      url: `https://github.com/${treeMatch[1]}.git`,
      branch: treeMatch[2],
      subpath: treeMatch[3],
      id: treeMatch[1].replace("/", "_"),
    };
  }

  if (input.startsWith("git@") || input.startsWith("http")) {
    const idMatch = input.match(/([^/:]+\/[^/.]+)(\.git)?$/);
    return {
      url: input,
      branch: null,
      subpath: "agents",
      id: idMatch
        ? idMatch[1].replace("/", "_").replace(".git", "")
        : "custom_repo",
    };
  }

  return {
    url: `https://github.com/${input}.git`,
    branch: null,
    subpath: "agents",
    id: input.replace("/", "_"),
  };
}

export function askConfirm(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(`${question} (Y/n) `, (answer) => {
      rl.close();
      const clean = answer.trim().toLowerCase();
      resolve(clean === "" || clean === "y" || clean === "yes");
    });
  });
}

export function fetchRepo(repoConfig) {
  if (repoConfig.isLocal) {
    if (!fs.existsSync(repoConfig.sourcePath)) {
      throw new Error(`Local path does not exist: ${repoConfig.sourcePath}`);
    }
    console.log(
      colorize("cyan", `\n📁 Using local directory: ${repoConfig.sourcePath}`),
    );
    return repoConfig.sourcePath;
  }

  if (!fs.existsSync(RAMENOS_CACHE_DIR)) {
    fs.mkdirSync(RAMENOS_CACHE_DIR, { recursive: true });
  }

  const targetDir = path.join(RAMENOS_CACHE_DIR, repoConfig.id);
  console.log(
    colorize("cyan", `\n📥 Fetching repository: ${repoConfig.url}...`),
  );

  try {
    if (fs.existsSync(targetDir)) {
      execFileSync("git", ["fetch", "--all"], {
        cwd: targetDir,
        stdio: "ignore",
      });
      if (repoConfig.branch) {
        execFileSync(
          "git",
          ["reset", "--hard", `origin/${repoConfig.branch}`],
          {
            cwd: targetDir,
            stdio: "ignore",
          },
        );
      } else {
        execFileSync("git", ["reset", "--hard", "HEAD"], {
          cwd: targetDir,
          stdio: "ignore",
        });
        execFileSync("git", ["pull"], { cwd: targetDir, stdio: "ignore" });
      }
    } else {
      const cloneArgs = ["clone"];
      if (repoConfig.branch) cloneArgs.push("-b", repoConfig.branch);
      cloneArgs.push(repoConfig.url, targetDir);
      execFileSync("git", cloneArgs, {
        stdio: "ignore",
      });
    }
  } catch (error) {
    throw new Error(
      "Failed to fetch repository. Ensure it exists, is public/accessible, and git is installed.",
    );
  }

  const sourcePath = path.join(targetDir, repoConfig.subpath);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(
      `Could not find path '${repoConfig.subpath}' inside the repository.`,
    );
  }

  return sourcePath;
}

function unlinkIfExists(filePath) {
  if (fs.lstatSync(filePath, { throwIfNoEntry: false })) {
    fs.unlinkSync(filePath);
  }
}

export function isStructuredSource(sourcePath) {
  const headersDir = path.join(sourcePath, "headers");
  const promptsDir = path.join(sourcePath, "prompts");
  return (
    fs.existsSync(headersDir) &&
    fs.statSync(headersDir).isDirectory() &&
    fs.existsSync(promptsDir) &&
    fs.statSync(promptsDir).isDirectory()
  );
}

export function combineAgentFile(headerContent, promptContent) {
  const header = headerContent.trimEnd();
  const prompt = promptContent.trim();
  if (!prompt) return header + "\n";
  return header + "\n\n" + prompt + "\n";
}

export function combineCodexAgentFile(headerContent, promptContent) {
  const header = headerContent.trimEnd();
  const prompt = promptContent.trim();
  if (!prompt) {
    throw new Error("Codex agents require a non-empty developer prompt.");
  }
  const instructions = JSON.stringify(prompt).replaceAll("\u007f", "\\u007F");
  return `developer_instructions = ${instructions}\n\n${header}\n`;
}

function getFrameworkHeaderFiles(headersDir, framework) {
  const extension = FRAMEWORK_HEADER_EXTENSIONS[framework] || ".md";
  return fs
    .readdirSync(headersDir)
    .filter((file) => file.endsWith(extension) && !file.startsWith("."));
}

function installStructured(sourcePath, destDir, framework, preset) {
  const headersDir = path.join(sourcePath, "headers", framework);
  const promptsDir = path.join(sourcePath, "prompts", preset);

  if (!fs.existsSync(headersDir)) {
    console.log(
      colorize(
        "yellow",
        `  ⚠️  No headers found for '${framework}'. Skipping.`,
      ),
    );
    return 0;
  }

  if (!fs.existsSync(promptsDir)) {
    console.log(
      colorize(
        "yellow",
        `  ⚠️  No prompts found for preset '${preset}'. Skipping.`,
      ),
    );
    return 0;
  }

  const headerFiles = getFrameworkHeaderFiles(headersDir, framework);

  let installedCount = 0;

  for (const file of headerFiles) {
    const headerContent = fs.readFileSync(path.join(headersDir, file), "utf-8");
    const promptFile = path.join(
      promptsDir,
      `${path.basename(file, path.extname(file))}.md`,
    );

    let promptContent = "";
    if (fs.existsSync(promptFile)) {
      promptContent = fs.readFileSync(promptFile, "utf-8");
    }

    const finalContent =
      framework === "codex"
        ? combineCodexAgentFile(headerContent, promptContent)
        : combineAgentFile(headerContent, promptContent);
    const destFile = path.join(destDir, file);

    unlinkIfExists(destFile);

    fs.writeFileSync(destFile, finalContent);
    console.log(colorize("green", `  ✓ Installed: ${file}`));
    installedCount++;
  }

  return installedCount;
}

function installLegacy(sourcePath, destDir, options) {
  const files = fs.readdirSync(sourcePath);
  let installedCount = 0;

  for (const file of files) {
    if (file.startsWith(".")) continue;
    if (file === "headers" || file === "prompts") continue;

    const srcFile = path.join(sourcePath, file);
    if (fs.statSync(srcFile).isDirectory()) continue;

    const destFile = path.join(destDir, file);

    unlinkIfExists(destFile);

    try {
      if (options.copy) {
        fs.cpSync(srcFile, destFile, { recursive: true });
        console.log(colorize("green", `  ✓ Copied: ${file}`));
      } else {
        fs.symlinkSync(srcFile, destFile);
        console.log(colorize("green", `  ✓ Symlinked: ${file}`));
      }
      installedCount++;
    } catch (err) {
      if (err.code === "EPERM" && !options.copy) {
        fs.cpSync(srcFile, destFile, { recursive: true });
        console.log(
          colorize("green", `  ✓ Copied (Symlink fallback): ${file}`),
        );
        installedCount++;
      } else {
        console.error(
          colorize("red", `  ❌ Failed to install ${file}: ${err.message}`),
        );
      }
    }
  }

  return installedCount;
}

export async function installAgents(sourcePath, options) {
  const targetFrameworks =
    options.agent.length > 0 ? options.agent : ["opencode"];
  const scopeName = options.global ? "Global" : "Project Local";
  const structured = isStructuredSource(sourcePath);

  if (!VALID_PRESETS.includes(options.preset)) {
    throw new Error(
      `Invalid preset '${options.preset}'. Valid presets: ${VALID_PRESETS.join(", ")}`,
    );
  }

  if (structured) {
    console.log(colorize("cyan", `📋 Preset: ${options.preset}`));
  }

  for (const framework of targetFrameworks) {
    const paths = getTargetPaths(framework);
    const destDir =
      options.destOverride || (options.global ? paths.global : paths.local);

    console.log(colorize("blue", `\n🚀 Target: [${framework}] -> ${destDir}`));

    if (!options.yes) {
      const isConfirmed = await askConfirm(
        `Install agents to ${scopeName} ${framework} directory?`,
      );
      if (!isConfirmed) {
        console.log(colorize("gray", "  Skipped."));
        continue;
      }
    }

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    let installedCount;

    if (structured) {
      installedCount = installStructured(
        sourcePath,
        destDir,
        framework,
        options.preset,
      );
    } else {
      installedCount = installLegacy(sourcePath, destDir, options);
    }

    if (installedCount === 0) {
      console.log(
        colorize(
          "yellow",
          `  ⚠️  No agent files generated for '${framework}'.`,
        ),
      );
    }
  }
}

function getAgentFileNames(sourcePath, framework, preset) {
  if (isStructuredSource(sourcePath)) {
    const headersDir = path.join(sourcePath, "headers", framework);
    if (!fs.existsSync(headersDir)) return [];
    return getFrameworkHeaderFiles(headersDir, framework);
  }

  return fs
    .readdirSync(sourcePath)
    .filter((f) => !f.startsWith(".") && f !== "headers" && f !== "prompts")
    .filter((f) => {
      const p = path.join(sourcePath, f);
      return fs.existsSync(p) && !fs.statSync(p).isDirectory();
    });
}

export async function removeAgents(sourcePath, options) {
  const targetFrameworks =
    options.agent.length > 0 ? options.agent : ["opencode"];
  const scopeName = options.global ? "Global" : "Project Local";

  for (const framework of targetFrameworks) {
    const paths = getTargetPaths(framework);
    const destDir =
      options.destOverride || (options.global ? paths.global : paths.local);

    console.log(colorize("blue", `\n🗑️  Target: [${framework}] -> ${destDir}`));

    if (!fs.existsSync(destDir)) {
      console.log(colorize("gray", `  Directory does not exist. Skipping.`));
      continue;
    }

    const fileNames = getAgentFileNames(sourcePath, framework, options.preset);

    if (fileNames.length === 0) {
      console.log(
        colorize("gray", `  No agent files found in source. Skipping.`),
      );
      continue;
    }

    if (!options.yes) {
      const isConfirmed = await askConfirm(
        `Remove agents from ${scopeName} ${framework} directory?`,
      );
      if (!isConfirmed) {
        console.log(colorize("gray", "  Skipped."));
        continue;
      }
    }

    let removedCount = 0;

    for (const file of fileNames) {
      const destFile = path.join(destDir, file);
      const stat = fs.lstatSync(destFile, { throwIfNoEntry: false });

      if (!stat && !fs.existsSync(destFile)) {
        console.log(colorize("gray", `  Not found: ${file}`));
        continue;
      }

      fs.unlinkSync(destFile);
      console.log(colorize("green", `  ✓ Removed: ${file}`));
      removedCount++;
    }

    const remaining = fs.readdirSync(destDir).filter((f) => !f.startsWith("."));
    if (remaining.length === 0) {
      fs.rmSync(destDir, { recursive: true });
      console.log(colorize("gray", `  Removed empty directory.`));
    }

    if (removedCount === 0) {
      console.log(
        colorize("yellow", `  ⚠️  No agent files removed for '${framework}'.`),
      );
    }
  }
}

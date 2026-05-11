import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
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
    } else if (arg === "add" && !options.command) {
      options.command = "add";
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
      execSync(`git fetch --all`, { cwd: targetDir, stdio: "ignore" });
      if (repoConfig.branch) {
        execSync(`git reset --hard origin/${repoConfig.branch}`, {
          cwd: targetDir,
          stdio: "ignore",
        });
      } else {
        execSync(`git reset --hard HEAD`, { cwd: targetDir, stdio: "ignore" });
        execSync(`git pull`, { cwd: targetDir, stdio: "ignore" });
      }
    } else {
      const branchFlag = repoConfig.branch ? `-b ${repoConfig.branch}` : "";
      execSync(`git clone ${branchFlag} ${repoConfig.url} ${targetDir}`, {
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

  const headerFiles = fs
    .readdirSync(headersDir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("."));

  let installedCount = 0;

  for (const file of headerFiles) {
    const headerContent = fs.readFileSync(
      path.join(headersDir, file),
      "utf-8",
    );
    const promptFile = path.join(promptsDir, file);

    let promptContent = "";
    if (fs.existsSync(promptFile)) {
      promptContent = fs.readFileSync(promptFile, "utf-8");
    }

    const finalContent = combineAgentFile(headerContent, promptContent);
    const destFile = path.join(destDir, file);

    if (
      fs.existsSync(destFile) ||
      fs.lstatSync(destFile, { throwIfNoEntry: false })
    ) {
      fs.unlinkSync(destFile);
    }

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

    if (
      fs.existsSync(destFile) ||
      fs.lstatSync(destFile, { throwIfNoEntry: false })
    ) {
      fs.unlinkSync(destFile);
    }

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
    console.log(
      colorize("cyan", `📋 Preset: ${options.preset}`),
    );
  }

  for (const framework of targetFrameworks) {
    const paths = getTargetPaths(framework);
    const destDir =
      options.destOverride ||
      (options.global ? paths.global : paths.local);

    console.log(
      colorize("blue", `\n🚀 Target: [${framework}] -> ${destDir}`),
    );

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
        colorize("yellow", `  ⚠️  No agent files generated for '${framework}'.`),
      );
    }
  }
}

import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import readline from "readline";

export const RAMENOS_CACHE_DIR = path.join(os.homedir(), ".ramenos", "cache");

export const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

/**
 * Applies terminal colors to text
 */
export function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Dynamically resolves global and local paths based on the agent/framework name
 * @param {string} framework - The framework name (e.g., 'opencode', 'claude')
 * @returns {{ global: string, local: string }}
 */
export function getTargetPaths(framework) {
  // Sanitize to prevent directory traversal (e.g., ../)
  const safeName = framework.toLowerCase().replace(/[^a-z0-9-]/g, "");

  return {
    global: path.join(os.homedir(), ".config", safeName, "agents"),
    local: path.join(process.cwd(), `.${safeName}`, "agents"),
  };
}

/**
 * Parses CLI arguments manually to keep the CLI zero-dependency
 */
export function parseArgs(args) {
  const options = {
    global: false,
    agent: [],
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
    }
  }
  return options;
}

/**
 * Extracts URL, branch, and subpaths from Git input, OR resolves local directories
 */
export function parseInput(input) {
  if (!input) return null;

  // 1. Resolve local path
  let resolvedPath = input;
  if (input.startsWith("~/")) {
    resolvedPath = path.join(os.homedir(), input.slice(2));
  } else {
    resolvedPath = path.resolve(input);
  }

  // 2. Check if it's explicitly a local path OR if the directory actually exists
  const isExplicitLocal =
    input.startsWith("./") ||
    input.startsWith("../") ||
    input.startsWith("/") ||
    input.startsWith("~/") ||
    input.startsWith(".\\") || // Windows relative
    input.startsWith("..\\") || // Windows relative
    /^[A-Za-z]:[\\/]/.test(input); // Windows absolute (e.g. C:\)

  if (
    isExplicitLocal ||
    (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory())
  ) {
    // If the folder contains an "agents" subdirectory, use it automatically!
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

  // 3. Matches: https://github.com/user/repo/tree/branch/path
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

  // 4. Matches SSH or raw HTTPs
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

  // 5. Matches shorthand: user/repo
  return {
    url: `https://github.com/${input}.git`,
    branch: null,
    subpath: "agents",
    id: input.replace("/", "_"),
  };
}

/**
 * Creates an interactive Yes/No prompt
 */
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

/**
 * Clones the repository into cache, OR returns the local directory path
 */
export function fetchRepo(repoConfig) {
  // If it's a local directory, bypass git and cache entirely
  if (repoConfig.isLocal) {
    if (!fs.existsSync(repoConfig.sourcePath)) {
      throw new Error(`Local path does not exist: ${repoConfig.sourcePath}`);
    }
    console.log(
      colorize("cyan", `\n📁 Using local directory: ${repoConfig.sourcePath}`),
    );
    return repoConfig.sourcePath;
  }

  // Otherwise, handle remote git repository
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

/**
 * Installs (symlinks or copies) the agents to the specified target directories
 */
export async function installAgents(sourcePath, options) {
  // Default strictly to "opencode" if no explicit agents provided
  const targetFrameworks =
    options.agent.length > 0 ? options.agent : ["opencode"];
  const scopeName = options.global ? "Global" : "Project Local";

  for (const framework of targetFrameworks) {
    const paths = getTargetPaths(framework);
    const destDir = options.global ? paths.global : paths.local;

    console.log(
      colorize("blue", `\n🚀 Target Framework: [${framework}] -> ${destDir}`),
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

    const files = fs.readdirSync(sourcePath);
    let installedCount = 0;

    for (const file of files) {
      // Ignore hidden files like .git
      if (file.startsWith(".")) continue;

      const srcFile = path.join(sourcePath, file);
      const destFile = path.join(destDir, file);

      // Clean existing target files/symlinks
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
        // Handle Windows permission issues with symlinks gracefully
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

    if (installedCount === 0) {
      console.log(
        colorize("yellow", `  ⚠️ No valid files found in source directory.`),
      );
    }
  }
}

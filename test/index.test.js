import { createRequire } from "node:module";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const test = require("node:test");
const assert = require("node:assert");
import {
  parseInput,
  parseArgs,
  getTargetPaths,
  installAgents,
  removeAgents,
  isStructuredSource,
  combineAgentFile,
  VALID_PRESETS,
} from "../src/index.js";

test("getTargetPaths: opencode uses known paths", () => {
  const paths = getTargetPaths("opencode");
  assert.strictEqual(
    paths.global,
    path.join(os.homedir(), ".config", "opencode", "agents"),
  );
  assert.strictEqual(
    paths.local,
    path.join(process.cwd(), ".opencode", "agents"),
  );
});

test("getTargetPaths: gemini uses known paths", () => {
  const paths = getTargetPaths("gemini");
  assert.strictEqual(
    paths.global,
    path.join(os.homedir(), ".gemini", "agents"),
  );
  assert.strictEqual(
    paths.local,
    path.join(process.cwd(), ".gemini", "agents"),
  );
});

test("getTargetPaths: claude uses known paths", () => {
  const paths = getTargetPaths("claude");
  assert.strictEqual(
    paths.global,
    path.join(os.homedir(), ".claude", "agents"),
  );
  assert.strictEqual(
    paths.local,
    path.join(process.cwd(), ".claude", "agents"),
  );
});

test("getTargetPaths: unknown framework falls back to generic", () => {
  const paths = getTargetPaths("my-custom-tool");
  assert.strictEqual(
    paths.global,
    path.join(os.homedir(), ".config", "my-custom-tool", "agents"),
  );
  assert.strictEqual(
    paths.local,
    path.join(process.cwd(), ".my-custom-tool", "agents"),
  );
});

test("getTargetPaths: Dynamic sanitized names", () => {
  const paths = getTargetPaths("My-Agent_123!");
  assert.strictEqual(
    paths.local,
    path.join(process.cwd(), ".my-agent123", "agents"),
  );
});

test("parseInput: Shorthand syntax", () => {
  const res = parseInput("maxylev/ramenos");
  assert.strictEqual(res.url, "https://github.com/maxylev/ramenos.git");
  assert.strictEqual(res.id, "maxylev_ramenos");
  assert.strictEqual(res.subpath, "agents");
});

test("parseInput: Full HTTPS syntax", () => {
  const res = parseInput("https://github.com/my-labs/agent.git");
  assert.strictEqual(res.url, "https://github.com/my-labs/agent.git");
  assert.strictEqual(res.id, "my-labs_agent");
  assert.strictEqual(res.subpath, "agents");
});

test("parseInput: SSH syntax", () => {
  const res = parseInput("git@github.com:ai-labs/my-agents.git");
  assert.strictEqual(res.url, "git@github.com:ai-labs/my-agents.git");
  assert.strictEqual(res.id, "ai-labs_my-agents");
  assert.strictEqual(res.subpath, "agents");
});

test("parseInput: Deep tree path", () => {
  const res = parseInput(
    "https://github.com/ai-labs/my-agents/tree/main/agents/my",
  );
  assert.strictEqual(res.url, "https://github.com/ai-labs/my-agents.git");
  assert.strictEqual(res.branch, "main");
  assert.strictEqual(res.subpath, "agents/my");
  assert.strictEqual(res.id, "ai-labs_my-agents");
});

test("parseArgs: Basic add command with defaults", () => {
  const opts = parseArgs(["add", "maxylev/ramenos"]);
  assert.strictEqual(opts.command, "add");
  assert.strictEqual(opts.repository, "maxylev/ramenos");
  assert.strictEqual(opts.global, false);
  assert.strictEqual(opts.preset, "continue");
  assert.deepStrictEqual(opts.agent, []);
});

test("parseArgs: del command", () => {
  const opts = parseArgs(["del", "maxylev/ramenos"]);
  assert.strictEqual(opts.command, "del");
  assert.strictEqual(opts.repository, "maxylev/ramenos");
});

test("parseArgs: del with flags", () => {
  const opts = parseArgs(["del", "maxylev/ramenos", "-g", "-a", "gemini", "claude"]);
  assert.strictEqual(opts.command, "del");
  assert.strictEqual(opts.global, true);
  assert.deepStrictEqual(opts.agent, ["gemini", "claude"]);
});

test("parseArgs: Multiple flags and agents", () => {
  const opts = parseArgs([
    "add",
    "maxylev/ramenos",
    "-g",
    "-y",
    "-a",
    "opencode",
    "gemini",
    "claude",
    "--copy",
  ]);
  assert.strictEqual(opts.command, "add");
  assert.strictEqual(opts.global, true);
  assert.strictEqual(opts.yes, true);
  assert.strictEqual(opts.copy, true);
  assert.deepStrictEqual(opts.agent, ["opencode", "gemini", "claude"]);
});

test("parseArgs: Preset flag", () => {
  const opts = parseArgs(["add", "maxylev/ramenos", "-p", "new"]);
  assert.strictEqual(opts.preset, "new");
});

test("parseArgs: Preset defaults to continue", () => {
  const opts = parseArgs(["add", "maxylev/ramenos"]);
  assert.strictEqual(opts.preset, "continue");
});

test("parseArgs: Help flag", () => {
  const opts1 = parseArgs(["-h"]);
  const opts2 = parseArgs(["--help"]);
  assert.strictEqual(opts1.help, true);
  assert.strictEqual(opts2.help, true);
});

test("parseInput: Explicit local relative path", () => {
  const res = parseInput("./my-labs/my-awesome-agents");
  assert.strictEqual(res.isLocal, true);
  assert.strictEqual(
    res.sourcePath,
    path.resolve("./my-labs/my-awesome-agents"),
  );
});

test("parseInput: Explicit local absolute path", () => {
  const res = parseInput("/usr/local/agents");
  assert.strictEqual(res.isLocal, true);
  assert.strictEqual(res.sourcePath, path.resolve("/usr/local/agents"));
});

test("VALID_PRESETS contains expected values", () => {
  assert.deepStrictEqual(VALID_PRESETS, ["new", "continue"]);
});

test("combineAgentFile: combines header and prompt", () => {
  const header = "---\nname: test\n---";
  const prompt = "You are a test agent.";
  const result = combineAgentFile(header, prompt);
  assert.strictEqual(result, "---\nname: test\n---\n\nYou are a test agent.\n");
});

test("combineAgentFile: header only when no prompt", () => {
  const header = "---\nname: test\n---";
  const result = combineAgentFile(header, "");
  assert.strictEqual(result, "---\nname: test\n---\n");
});

test("isStructuredSource: detects structured directory", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ramenos-test-"));
  fs.mkdirSync(path.join(tmpDir, "headers"));
  fs.mkdirSync(path.join(tmpDir, "prompts"));
  assert.strictEqual(isStructuredSource(tmpDir), true);
  fs.rmSync(tmpDir, { recursive: true });
});

test("isStructuredSource: returns false for flat directory", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ramenos-test-"));
  fs.writeFileSync(path.join(tmpDir, "leader.md"), "---\n---\nbody");
  assert.strictEqual(isStructuredSource(tmpDir), false);
  fs.rmSync(tmpDir, { recursive: true });
});

test("installAgents: structured mode generates combined files", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ramenos-test-"));

  const sourcePath = path.join(tmpDir, "source", "agents");
  const headersDir = path.join(sourcePath, "headers", "opencode");
  const promptsDir = path.join(sourcePath, "prompts", "continue");
  fs.mkdirSync(headersDir, { recursive: true });
  fs.mkdirSync(promptsDir, { recursive: true });

  fs.writeFileSync(
    path.join(headersDir, "leader.md"),
    "---\ndescription: Test Leader\n---",
  );
  fs.writeFileSync(
    path.join(promptsDir, "leader.md"),
    "You are the leader.",
  );

  const destDir = path.join(tmpDir, "dest", ".opencode", "agents");

  await installAgents(sourcePath, {
    agent: ["opencode"],
    preset: "continue",
    global: false,
    yes: true,
    copy: false,
    destOverride: destDir,
  });

  const installedFile = path.join(destDir, "leader.md");
  assert.ok(fs.existsSync(installedFile));

  const content = fs.readFileSync(installedFile, "utf-8");
  assert.ok(content.startsWith("---\ndescription: Test Leader\n---"));
  assert.ok(content.includes("You are the leader."));

  fs.rmSync(tmpDir, { recursive: true });
});

test("installAgents: rejects invalid preset", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ramenos-test-"));
  const sourcePath = path.join(tmpDir, "source");
  fs.mkdirSync(sourcePath);

  await assert.rejects(
    () =>
      installAgents(sourcePath, {
        agent: ["opencode"],
        preset: "invalid",
        global: false,
        yes: true,
        copy: false,
      }),
    { message: /Invalid preset 'invalid'/ },
  );

  fs.rmSync(tmpDir, { recursive: true });
});

test("removeAgents: structured mode removes installed files", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ramenos-test-"));

  const sourcePath = path.join(tmpDir, "source", "agents");
  const headersDir = path.join(sourcePath, "headers", "opencode");
  const promptsDir = path.join(sourcePath, "prompts", "continue");
  fs.mkdirSync(headersDir, { recursive: true });
  fs.mkdirSync(promptsDir, { recursive: true });

  fs.writeFileSync(path.join(headersDir, "leader.md"), "---\n---");
  fs.writeFileSync(path.join(headersDir, "developer.md"), "---\n---");
  fs.writeFileSync(path.join(promptsDir, "leader.md"), "prompt");
  fs.writeFileSync(path.join(promptsDir, "developer.md"), "prompt");

  const destDir = path.join(tmpDir, "dest", ".opencode", "agents");

  await installAgents(sourcePath, {
    agent: ["opencode"],
    preset: "continue",
    global: false,
    yes: true,
    copy: false,
    destOverride: destDir,
  });

  assert.ok(fs.existsSync(path.join(destDir, "leader.md")));
  assert.ok(fs.existsSync(path.join(destDir, "developer.md")));

  await removeAgents(sourcePath, {
    agent: ["opencode"],
    preset: "continue",
    global: false,
    yes: true,
    destOverride: destDir,
  });

  assert.ok(!fs.existsSync(path.join(destDir, "leader.md")));
  assert.ok(!fs.existsSync(path.join(destDir, "developer.md")));
  assert.ok(!fs.existsSync(destDir));

  fs.rmSync(tmpDir, { recursive: true });
});

test("removeAgents: skips missing directory", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ramenos-test-"));

  const sourcePath = path.join(tmpDir, "source", "agents");
  const headersDir = path.join(sourcePath, "headers", "opencode");
  fs.mkdirSync(headersDir, { recursive: true });
  fs.writeFileSync(path.join(headersDir, "leader.md"), "---\n---");

  const destDir = path.join(tmpDir, "nonexistent");

  await removeAgents(sourcePath, {
    agent: ["opencode"],
    preset: "continue",
    global: false,
    yes: true,
    destOverride: destDir,
  });

  assert.ok(!fs.existsSync(destDir));
  fs.rmSync(tmpDir, { recursive: true });
});

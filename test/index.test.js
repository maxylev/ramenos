import test from "node:test";
import assert from "node:assert";
import path from "path";
import os from "os";
import { parseInput, parseArgs, getTargetPaths } from "../src/index.js";

test("getTargetPaths: Default opencode", () => {
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

test("getTargetPaths: Dynamic sanitized names", () => {
  const paths = getTargetPaths("My-Agent_123!");
  // Should lowercase and strip non-alphanumeric (except dashes)
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

test("parseArgs: Basic add command", () => {
  const opts = parseArgs(["add", "maxylev/ramenos"]);
  assert.strictEqual(opts.command, "add");
  assert.strictEqual(opts.repository, "maxylev/ramenos");
  assert.strictEqual(opts.global, false);
  assert.deepStrictEqual(opts.agent, []); // Empty defaults to opencode down the line
});

test("parseArgs: Multiple flags and agents", () => {
  const opts = parseArgs([
    "add",
    "maxylev/ramenos",
    "-g",
    "-y",
    "-a",
    "opencode",
    "codex",
    "--copy",
  ]);
  assert.strictEqual(opts.command, "add");
  assert.strictEqual(opts.global, true);
  assert.strictEqual(opts.yes, true);
  assert.strictEqual(opts.copy, true);
  assert.deepStrictEqual(opts.agent, ["opencode", "codex"]);
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

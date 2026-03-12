#!/usr/bin/env node

/**
 * superpowers-droid installer
 *
 * Interactive, idempotent installer for Factory Droid.
 * Supports user-level (~/.factory/) and project-level (./.factory/) installs.
 *
 * Usage:
 *   node scripts/install.mjs                  # interactive
 *   node scripts/install.mjs --user           # user-level, no prompts
 *   node scripts/install.mjs --project        # project-level, no prompts
 *   node scripts/install.mjs --uninstall      # remove superpowers
 *   node scripts/install.mjs --uninstall --user
 *   node scripts/install.mjs --uninstall --project
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync, chmodSync, readdirSync } from "node:fs";
import { createInterface } from "node:readline";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

// ── constants ──────────────────────────────────────────────────────────────────

const REPO = "https://github.com/yigitkonur/superpowers-droid.git";
const PLUGIN_DIR_NAME = "superpowers-droid";
const USER_BASE = join(homedir(), ".factory");
const AGENTS_FILE = join(homedir(), ".factory", "AGENTS.md");

const SUPERPOWERS_BLOCK_START = "<!-- superpowers:start -->";
const SUPERPOWERS_BLOCK_END = "<!-- superpowers:end -->";

const AGENTS_BLOCK = `${SUPERPOWERS_BLOCK_START}
## Superpowers Workflow

Before responding to ANY task, check for applicable superpowers skills.
Skills auto-activate when your task matches their description, or browse with \`/skills\`.

Pipeline: **brainstorming** → **writing-plans** → **using-git-worktrees** →
**subagent-driven-development** → **test-driven-development** →
**requesting-code-review** → **verification-before-completion** →
**finishing-a-development-branch**
${SUPERPOWERS_BLOCK_END}`;

// ── colors (ANSI, no deps) ────────────────────────────────────────────────────

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

const ok = (msg) => console.log(`  ${c.green}✓${c.reset} ${msg}`);
const warn = (msg) => console.log(`  ${c.yellow}⚠${c.reset} ${msg}`);
const fail = (msg) => console.log(`  ${c.red}✗${c.reset} ${msg}`);
const step = (n, total, msg) =>
  console.log(`\n${c.cyan}[${n}/${total}]${c.reset} ${c.bold}${msg}${c.reset}`);
const banner = (msg) =>
  console.log(`\n${c.magenta}${c.bold}${msg}${c.reset}`);

// ── helpers ────────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: "pipe", ...opts }).trim();
  } catch {
    return null;
  }
}

function which(bin) {
  return run(`which ${bin}`) !== null;
}

function getVersion(cmd) {
  const out = run(cmd);
  if (!out) return null;
  const match = out.match(/(\d+\.\d+[\.\d]*)/);
  return match ? match[1] : out;
}

async function ask(question, choices) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  if (choices && choices.length) {
    console.log();
    choices.forEach((ch, i) => {
      const marker = i === 0 ? `${c.cyan}→${c.reset}` : " ";
      console.log(`  ${marker} ${c.bold}${i + 1}.${c.reset} ${ch.label}`);
      if (ch.desc) console.log(`     ${c.dim}${ch.desc}${c.reset}`);
    });
    console.log();
  }

  return new Promise((resolve) => {
    rl.question(`${c.cyan}?${c.reset} ${question} `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ── prerequisites ──────────────────────────────────────────────────────────────

function checkPrereqs() {
  let pass = true;

  if (which("git")) {
    ok(`git found (${getVersion("git --version")})`);
  } else {
    fail("git not found — install from https://git-scm.com");
    pass = false;
  }

  if (which("node")) {
    const v = getVersion("node --version");
    const major = parseInt(v.split(".")[0], 10);
    if (major >= 18) {
      ok(`node found (${v})`);
    } else {
      fail(`node ${v} is too old — need >=18`);
      pass = false;
    }
  } else {
    fail("node not found");
    pass = false;
  }

  const droidBin = which("droid");
  if (droidBin) {
    ok(`Factory Droid found (${getVersion("droid --version") || "unknown version"})`);
  } else {
    warn("Factory Droid CLI not found — install from https://www.factory.ai/");
    warn("Superpowers will still install, but won't activate until Droid is available.");
  }

  return pass;
}

// ── install ────────────────────────────────────────────────────────────────────

function cloneOrUpdate(targetDir) {
  if (existsSync(join(targetDir, ".git"))) {
    // already cloned — pull
    ok("Existing install detected — pulling latest changes");
    const result = run(`git -C "${targetDir}" pull --ff-only 2>&1`);
    if (result === null) {
      warn("Pull failed — trying fresh clone");
      rmSync(targetDir, { recursive: true, force: true });
      run(`git clone --depth 1 "${REPO}" "${targetDir}"`);
      ok("Fresh clone complete");
    } else {
      ok("Updated to latest");
    }
  } else if (existsSync(targetDir)) {
    // directory exists but not a git repo — back up and clone
    const backup = `${targetDir}.backup-${Date.now()}`;
    warn(`${targetDir} exists but is not a git repo`);
    warn(`Backing up to ${backup}`);
    run(`mv "${targetDir}" "${backup}"`);
    run(`git clone --depth 1 "${REPO}" "${targetDir}"`);
    ok("Cloned fresh (old directory backed up)");
  } else {
    run(`git clone --depth 1 "${REPO}" "${targetDir}"`);
    ok(`Cloned to ${targetDir}`);
  }
}

function setupHooks(targetDir) {
  const hooksDir = join(targetDir, "hooks");
  if (!existsSync(hooksDir)) {
    warn("No hooks directory found (skipping)");
    return;
  }

  for (const file of readdirSync(hooksDir)) {
    const full = join(hooksDir, file);
    if (file === "hooks.json") continue;
    try {
      chmodSync(full, 0o755);
      ok(`${file} — executable`);
    } catch {
      warn(`Could not chmod ${file}`);
    }
  }
}

function verifyPlugin(targetDir) {
  const manifest = join(targetDir, ".factory-plugin", "plugin.json");
  if (existsSync(manifest)) {
    const data = JSON.parse(readFileSync(manifest, "utf8"));
    ok(`Plugin: ${data.name} v${data.version}`);
    return true;
  }
  fail("No .factory-plugin/plugin.json found — plugin may not load");
  return false;
}

function setupAgentsMd() {
  const dir = join(homedir(), ".factory");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  if (existsSync(AGENTS_FILE)) {
    const content = readFileSync(AGENTS_FILE, "utf8");
    if (content.includes(SUPERPOWERS_BLOCK_START)) {
      ok("AGENTS.md already has superpowers block (skipping)");
      return;
    }
    writeFileSync(AGENTS_FILE, content + "\n\n" + AGENTS_BLOCK + "\n");
    ok("Appended superpowers block to AGENTS.md");
  } else {
    writeFileSync(AGENTS_FILE, AGENTS_BLOCK + "\n");
    ok("Created AGENTS.md with superpowers block");
  }
}

async function install(scope) {
  const totalSteps = 5;
  const targetDir =
    scope === "user"
      ? join(USER_BASE, PLUGIN_DIR_NAME)
      : join(process.cwd(), ".factory", PLUGIN_DIR_NAME);

  banner("superpowers-droid installer");
  console.log(`${c.dim}Scope: ${scope}-level → ${targetDir}${c.reset}`);

  // ── already installed? ──
  if (existsSync(join(targetDir, ".factory-plugin", "plugin.json"))) {
    const action = await ask("Superpowers is already installed. What would you like to do?", [
      { label: "Update", desc: "Pull latest changes" },
      { label: "Reinstall", desc: "Remove and install fresh" },
      { label: "Cancel", desc: "Do nothing" },
    ]);
    const choice = action === "1" || action.toLowerCase().startsWith("u")
      ? "update"
      : action === "2" || action.toLowerCase().startsWith("r")
        ? "reinstall"
        : "cancel";

    if (choice === "cancel") {
      console.log("\nCancelled. No changes made.");
      process.exit(0);
    }
    if (choice === "reinstall") {
      rmSync(targetDir, { recursive: true, force: true });
      ok("Removed existing install");
    }
    // update falls through to clone-or-update
  }

  // [1] prereqs
  step(1, totalSteps, "Checking prerequisites...");
  if (!checkPrereqs()) {
    fail("Missing prerequisites. Fix the issues above and retry.");
    process.exit(1);
  }

  // [2] clone
  step(2, totalSteps, "Installing superpowers-droid...");
  const parentDir = resolve(targetDir, "..");
  if (!existsSync(parentDir)) mkdirSync(parentDir, { recursive: true });
  cloneOrUpdate(targetDir);

  // [3] hooks
  step(3, totalSteps, "Setting up hooks...");
  setupHooks(targetDir);

  // [4] verify
  step(4, totalSteps, "Verifying plugin...");
  verifyPlugin(targetDir);

  // [5] AGENTS.md
  step(5, totalSteps, "Configuring AGENTS.md...");
  if (scope === "user") {
    setupAgentsMd();
  } else {
    ok("Project-level install — skipping global AGENTS.md");
  }

  // done
  banner("Done!");
  console.log(`
  Superpowers installed at ${c.cyan}${targetDir}${c.reset}

  Start a new Droid session to activate:
    ${c.bold}droid${c.reset}

  Browse skills:
    ${c.bold}/skills${c.reset}

  Use native worktree isolation:
    ${c.bold}droid --worktree feature-name${c.reset}
`);
}

// ── uninstall ──────────────────────────────────────────────────────────────────

async function uninstall(scope) {
  const totalSteps = 3;
  const targetDir =
    scope === "user"
      ? join(USER_BASE, PLUGIN_DIR_NAME)
      : join(process.cwd(), ".factory", PLUGIN_DIR_NAME);

  banner("superpowers-droid uninstaller");

  if (!existsSync(targetDir)) {
    warn(`Not installed at ${targetDir} — nothing to remove.`);
    process.exit(0);
  }

  const confirm = await ask(
    `Remove superpowers from ${targetDir}? (y/N)`,
    []
  );
  if (!confirm.toLowerCase().startsWith("y")) {
    console.log("\nCancelled. No changes made.");
    process.exit(0);
  }

  // [1] remove dir
  step(1, totalSteps, "Removing plugin directory...");
  rmSync(targetDir, { recursive: true, force: true });
  ok(`Removed ${targetDir}`);

  // [2] clean AGENTS.md
  step(2, totalSteps, "Cleaning AGENTS.md...");
  if (existsSync(AGENTS_FILE)) {
    let content = readFileSync(AGENTS_FILE, "utf8");
    const startIdx = content.indexOf(SUPERPOWERS_BLOCK_START);
    const endIdx = content.indexOf(SUPERPOWERS_BLOCK_END);
    if (startIdx !== -1 && endIdx !== -1) {
      content =
        content.slice(0, startIdx).trimEnd() +
        "\n" +
        content.slice(endIdx + SUPERPOWERS_BLOCK_END.length).trimStart();
      writeFileSync(AGENTS_FILE, content.trim() + "\n");
      ok("Removed superpowers block from AGENTS.md");
    } else {
      ok("No superpowers block found (skipping)");
    }
  } else {
    ok("No AGENTS.md found (skipping)");
  }

  // [3] done
  step(3, totalSteps, "Cleanup complete.");
  console.log(`\n  Superpowers has been removed.\n`);
}

// ── main ───────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const isUninstall = args.includes("--uninstall");
  let scope = args.includes("--user")
    ? "user"
    : args.includes("--project")
      ? "project"
      : null;

  if (!scope) {
    const answer = await ask("Where should superpowers be installed?", [
      {
        label: "User-level (~/.factory/superpowers-droid)",
        desc: "Available in all projects (recommended)",
      },
      {
        label: "Project-level (./.factory/superpowers-droid)",
        desc: "Only this project",
      },
    ]);
    scope =
      answer === "1" || answer.toLowerCase().includes("user")
        ? "user"
        : "project";
  }

  if (isUninstall) {
    await uninstall(scope);
  } else {
    await install(scope);
  }
}

main().catch((err) => {
  fail(err.message);
  process.exit(1);
});

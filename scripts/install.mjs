#!/usr/bin/env node

/**
 * superpowers-droid installer
 *
 * Installs superpowers for Factory Droid using the proper plugin system
 * when available, with manual fallback.
 *
 * Usage:
 *   node scripts/install.mjs                  # interactive
 *   node scripts/install.mjs install          # same as above
 *   node scripts/install.mjs install --user   # user-level, no prompts
 *   node scripts/install.mjs install --project# project-level, no prompts
 *   node scripts/install.mjs uninstall        # remove superpowers
 *   node scripts/install.mjs uninstall --user
 *   node scripts/install.mjs uninstall --project
 *   node scripts/install.mjs status           # show install state
 *   node scripts/install.mjs --status         # same as status
 *   node scripts/install.mjs --uninstall      # same as uninstall
 *   node scripts/install.mjs --help           # show help
 */

import { execSync } from "node:child_process";
import {
  existsSync, mkdirSync, rmSync, readFileSync, writeFileSync,
  chmodSync, readdirSync, statSync,
} from "node:fs";
import { createInterface } from "node:readline";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

// ── constants ──────────────────────────────────────────────────────────────────

const REPO = "https://github.com/yigitkonur/superpowers-droid.git";
const MARKETPLACE_NAME = "superpowers-droid";
const PLUGIN_NAME = "superpowers";

const HOME = homedir();
const FACTORY_DIR = join(HOME, ".factory");
const AGENTS_USER = join(FACTORY_DIR, "AGENTS.md");

// Manual install paths (fallback when droid plugin system unavailable)
const MANUAL_USER_DIR = join(FACTORY_DIR, "superpowers-droid");
const MANUAL_PROJECT_DIR = (cwd) => join(cwd, ".factory", "superpowers-droid");

// Plugin system paths
const PLUGINS_DIR = join(FACTORY_DIR, "plugins");
const INSTALLED_JSON = join(PLUGINS_DIR, "installed_plugins.json");
const MARKETPLACES_JSON = join(PLUGINS_DIR, "known_marketplaces.json");

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

Iron laws (zero exceptions):
1. No production code without a failing test first
2. No fixes without root cause investigation
3. No completion claims without running verification fresh
${SUPERPOWERS_BLOCK_END}`;

// ── colors ─────────────────────────────────────────────────────────────────────

const c = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  green: "\x1b[32m", yellow: "\x1b[33m", red: "\x1b[31m",
  cyan: "\x1b[36m", magenta: "\x1b[35m",
};

const ok   = (msg) => console.log(`  ${c.green}✓${c.reset} ${msg}`);
const warn = (msg) => console.log(`  ${c.yellow}⚠${c.reset} ${msg}`);
const fail = (msg) => console.log(`  ${c.red}✗${c.reset} ${msg}`);
const info = (msg) => console.log(`  ${c.cyan}→${c.reset} ${msg}`);
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

function which(bin) { return run(`which ${bin}`) !== null; }

function getVersion(cmd) {
  const out = run(cmd);
  if (!out) return null;
  const m = out.match(/(\d+\.\d+[\.\d]*)/);
  return m ? m[1] : out;
}

async function ask(question, choices) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  if (choices?.length) {
    console.log();
    choices.forEach((ch, i) => {
      const marker = i === 0 ? `${c.cyan}→${c.reset}` : " ";
      console.log(`  ${marker} ${c.bold}${i + 1}.${c.reset} ${ch.label}`);
      if (ch.desc) console.log(`     ${c.dim}${ch.desc}${c.reset}`);
    });
    console.log();
  }
  return new Promise((res) => {
    rl.question(`${c.cyan}?${c.reset} ${question} `, (a) => { rl.close(); res(a.trim()); });
  });
}

// ── detection ──────────────────────────────────────────────────────────────────

function hasDroid() { return which("droid"); }

function isDroidPluginInstalled() {
  // Check via droid plugin list
  const out = run("droid plugin list 2>&1");
  return out?.includes(`${PLUGIN_NAME}@${MARKETPLACE_NAME}`);
}

function isMarketplaceRegistered() {
  if (!existsSync(MARKETPLACES_JSON)) return false;
  try {
    const data = JSON.parse(readFileSync(MARKETPLACES_JSON, "utf8"));
    return MARKETPLACE_NAME in data;
  } catch { return false; }
}

function findManualInstall(scope) {
  const dir = scope === "user" ? MANUAL_USER_DIR : MANUAL_PROJECT_DIR(process.cwd());
  return existsSync(join(dir, ".factory-plugin", "plugin.json")) ? dir : null;
}

function findAnyInstall(scope) {
  // Check plugin system first
  if (isDroidPluginInstalled()) return { method: "plugin", path: "(managed by droid)" };
  // Check manual
  const manual = findManualInstall(scope);
  if (manual) return { method: "manual", path: manual };
  return null;
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
    if (parseInt(v.split(".")[0], 10) >= 18) {
      ok(`node found (${v})`);
    } else {
      fail(`node ${v} is too old — need >=18`);
      pass = false;
    }
  } else {
    fail("node not found");
    pass = false;
  }

  if (hasDroid()) {
    ok(`Factory Droid found (${getVersion("droid --version") || "unknown"})`);
  } else {
    warn("Factory Droid CLI not found — will use manual install (clone + AGENTS.md)");
    warn("Install Droid from https://www.factory.ai/ for full plugin system support");
  }

  return pass;
}

// ── install via droid plugin system ────────────────────────────────────────────

function installViaPlugin(scope) {
  // Register marketplace if not already
  if (!isMarketplaceRegistered()) {
    ok("Registering superpowers-droid marketplace...");
    const result = run(`droid plugin marketplace add ${REPO} 2>&1`);
    if (result === null) {
      warn("Could not register marketplace — falling back to manual install");
      return false;
    }
    ok("Marketplace registered");
  } else {
    ok("Marketplace already registered");
  }

  // Install plugin
  const scopeFlag = `--scope ${scope}`;
  ok(`Installing via: droid plugin install ${PLUGIN_NAME}@${MARKETPLACE_NAME} ${scopeFlag}`);
  const result = run(`droid plugin install ${PLUGIN_NAME}@${MARKETPLACE_NAME} ${scopeFlag} 2>&1`);
  if (result === null) {
    warn("Plugin install failed — falling back to manual install");
    return false;
  }
  ok("Plugin installed via Droid plugin system");
  return true;
}

function uninstallViaPlugin() {
  const result = run(`droid plugin uninstall ${PLUGIN_NAME}@${MARKETPLACE_NAME} 2>&1`);
  if (result === null) {
    warn("Plugin uninstall via Droid failed");
    return false;
  }
  ok("Plugin removed via Droid plugin system");

  // Also remove marketplace registration
  run(`droid plugin marketplace remove ${MARKETPLACE_NAME} 2>&1`);
  ok("Marketplace registration removed");
  return true;
}

// ── safety ──────────────────────────────────────────────────────────────────

function isSafeToDelete(dir) {
  // Never delete the directory we're running from
  const scriptDir = resolve(import.meta.dirname, "..");
  const absDir = resolve(dir);
  if (absDir === scriptDir || scriptDir.startsWith(absDir + "/")) {
    fail(`Refusing to delete ${absDir} — installer is running from here`);
    return false;
  }
  // Never delete cwd
  if (absDir === resolve(process.cwd())) {
    fail(`Refusing to delete ${absDir} — it is the current working directory`);
    return false;
  }
  return true;
}

// ── plugin registry cleanup ─────────────────────────────────────────────────

function cleanPluginRegistries() {
  // Clean settings.json — remove superpowers from enabledPlugins
  const settingsPath = join(FACTORY_DIR, "settings.json");
  if (existsSync(settingsPath)) {
    try {
      const data = JSON.parse(readFileSync(settingsPath, "utf8"));
      if (data.enabledPlugins && "superpowers@superpowers-droid" in data.enabledPlugins) {
        delete data.enabledPlugins["superpowers@superpowers-droid"];
        writeFileSync(settingsPath, JSON.stringify(data, null, 2) + "\n");
        ok("Removed superpowers from settings.json enabledPlugins");
      }
    } catch { /* ignore parse errors */ }
  }

  // Clean installed_plugins.json — remove superpowers entry
  if (existsSync(INSTALLED_JSON)) {
    try {
      const data = JSON.parse(readFileSync(INSTALLED_JSON, "utf8"));
      if (data.plugins && "superpowers@superpowers-droid" in data.plugins) {
        delete data.plugins["superpowers@superpowers-droid"];
        writeFileSync(INSTALLED_JSON, JSON.stringify(data, null, 2) + "\n");
        ok("Removed superpowers from installed_plugins.json");
      }
    } catch { /* ignore parse errors */ }
  }

  // Clean known_marketplaces.json — remove superpowers marketplace entries
  if (existsSync(MARKETPLACES_JSON)) {
    try {
      const data = JSON.parse(readFileSync(MARKETPLACES_JSON, "utf8"));
      let changed = false;
      for (const key of ["superpowers-marketplace", "superpowers-droid"]) {
        if (key in data) {
          delete data[key];
          changed = true;
        }
      }
      if (changed) {
        writeFileSync(MARKETPLACES_JSON, JSON.stringify(data, null, 2) + "\n");
        ok("Removed superpowers marketplace entries from known_marketplaces.json");
      }
    } catch { /* ignore parse errors */ }
  }

  // Remove plugin cache directory
  const cacheDir = join(PLUGINS_DIR, "cache", "superpowers-droid");
  if (existsSync(cacheDir)) {
    rmSync(cacheDir, { recursive: true, force: true });
    ok("Removed plugin cache");
  }

  // Remove marketplace directories
  for (const dir of ["superpowers-droid", "superpowers-marketplace"]) {
    const mktDir = join(PLUGINS_DIR, "marketplaces", dir);
    if (existsSync(mktDir)) {
      rmSync(mktDir, { recursive: true, force: true });
      ok(`Removed marketplace directory: ${dir}`);
    }
  }
}

// ── manual install (clone) ─────────────────────────────────────────────────────

function manualClone(targetDir) {
  if (existsSync(join(targetDir, ".git"))) {
    ok("Existing install detected — pulling latest");
    const result = run(`git -C "${targetDir}" pull --ff-only 2>&1`);
    if (result === null) {
      warn("Pull failed — will attempt fresh clone");
      if (isSafeToDelete(targetDir)) {
        rmSync(targetDir, { recursive: true, force: true });
        run(`git clone --depth 1 "${REPO}" "${targetDir}"`);
        ok("Fresh clone complete");
      } else {
        fail("Cannot replace directory — try uninstalling first");
      }
    } else {
      ok("Updated to latest");
    }
  } else if (existsSync(targetDir)) {
    const backup = `${targetDir}.backup-${Date.now()}`;
    warn(`Backing up existing ${targetDir}`);
    run(`mv "${targetDir}" "${backup}"`);
    run(`git clone --depth 1 "${REPO}" "${targetDir}"`);
    ok("Cloned fresh (old directory backed up)");
  } else {
    const parent = resolve(targetDir, "..");
    if (!existsSync(parent)) mkdirSync(parent, { recursive: true });
    run(`git clone --depth 1 "${REPO}" "${targetDir}"`);
    ok(`Cloned to ${targetDir}`);
  }
}

function setupHooks(targetDir) {
  const hooksDir = join(targetDir, "hooks");
  if (!existsSync(hooksDir)) return;
  for (const file of readdirSync(hooksDir)) {
    if (file === "hooks.json") continue;
    try {
      chmodSync(join(hooksDir, file), 0o755);
      ok(`${file} — executable`);
    } catch { /* ignore */ }
  }
}

function verifyPlugin(targetDir) {
  const manifest = join(targetDir, ".factory-plugin", "plugin.json");
  if (existsSync(manifest)) {
    const data = JSON.parse(readFileSync(manifest, "utf8"));
    ok(`Plugin manifest: ${data.name} v${data.version || "latest"}`);
    return true;
  }
  fail("No .factory-plugin/plugin.json found");
  return false;
}

// ── AGENTS.md management ───────────────────────────────────────────────────────

function agentsMdPath(scope) {
  return scope === "user" ? AGENTS_USER : join(process.cwd(), "AGENTS.md");
}

function addToAgentsMd(scope) {
  const filePath = agentsMdPath(scope);
  const dir = resolve(filePath, "..");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  if (existsSync(filePath)) {
    const content = readFileSync(filePath, "utf8");
    if (content.includes(SUPERPOWERS_BLOCK_START)) {
      ok("AGENTS.md already has superpowers block");
      return;
    }
    writeFileSync(filePath, content.trimEnd() + "\n\n" + AGENTS_BLOCK + "\n");
    ok(`Appended superpowers block to ${filePath}`);
  } else {
    writeFileSync(filePath, AGENTS_BLOCK + "\n");
    ok(`Created ${filePath} with superpowers block`);
  }
}

function removeFromAgentsMd(scope) {
  const filePath = agentsMdPath(scope);
  if (!existsSync(filePath)) {
    ok("No AGENTS.md found (skipping)");
    return;
  }
  let content = readFileSync(filePath, "utf8");
  const si = content.indexOf(SUPERPOWERS_BLOCK_START);
  const ei = content.indexOf(SUPERPOWERS_BLOCK_END);
  if (si !== -1 && ei !== -1) {
    content = content.slice(0, si).trimEnd() + "\n" +
              content.slice(ei + SUPERPOWERS_BLOCK_END.length).trimStart();
    const cleaned = content.trim();
    if (cleaned.length === 0) {
      // Don't leave empty AGENTS.md — but also don't delete user's file
      // Just remove the block content
      writeFileSync(filePath, "\n");
    } else {
      writeFileSync(filePath, cleaned + "\n");
    }
    ok("Removed superpowers block from AGENTS.md");
  } else {
    ok("No superpowers block in AGENTS.md (skipping)");
  }
}

// ── status ─────────────────────────────────────────────────────────────────────

function status() {
  banner("superpowers-droid — status");

  // droid cli
  if (hasDroid()) {
    ok(`droid cli: ${getVersion("droid --version") || "available"}`);
  } else {
    warn("droid cli: not found");
  }

  // plugin install
  if (isDroidPluginInstalled()) {
    ok("plugin install: superpowers@superpowers-droid (active)");
  } else {
    info("plugin install: not installed");
  }

  // manual install
  const manual = findManualInstall("user");
  if (manual) {
    ok(`manual install: ${manual}`);
  } else {
    info("manual install: not found");
  }

  // AGENTS.md
  const agentsPath = join(HOME, ".factory", "AGENTS.md");
  if (existsSync(agentsPath)) {
    const content = readFileSync(agentsPath, "utf8");
    if (content.includes(SUPERPOWERS_BLOCK_START)) {
      ok("AGENTS.md: superpowers block present");
    } else {
      warn("AGENTS.md: exists but no superpowers block");
    }
  } else {
    info("AGENTS.md: not found");
  }

  console.log();
}

// ── help ───────────────────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
${c.bold}superpowers-droid${c.reset} — structured agentic workflows for Factory Droid

${c.bold}usage:${c.reset}
  npx superpowers-droid install              interactive install
  npx superpowers-droid install --user       user-level, no prompts
  npx superpowers-droid install --project    project-level, no prompts
  npx superpowers-droid uninstall --user     remove user-level install
  npx superpowers-droid uninstall --project  remove project-level install
  npx superpowers-droid status              show current install state

${c.bold}also works with flags:${c.reset}
  node scripts/install.mjs --user           same as install --user
  node scripts/install.mjs --uninstall      same as uninstall
  node scripts/install.mjs --status         same as status

${c.bold}more info:${c.reset}
  https://github.com/yigitkonur/superpowers-droid
`);
}

// ── install flow ───────────────────────────────────────────────────────────────

async function install(scope, nonInteractive = false) {
  banner("superpowers-droid — installer");
  console.log(`${c.dim}Scope: ${scope}-level${nonInteractive ? " (non-interactive)" : ""}${c.reset}`);

  // Check for existing install
  const existing = findAnyInstall(scope);
  if (existing) {
    let choice;
    if (nonInteractive) {
      // Non-interactive: auto-update
      ok("Existing install detected — auto-updating");
      choice = "update";
    } else {
      const action = await ask("Superpowers is already installed. What would you like to do?", [
        { label: "Update", desc: "Pull latest changes" },
        { label: "Reinstall", desc: "Remove and install fresh" },
        { label: "Cancel", desc: "Do nothing" },
      ]);
      choice = action === "1" || action.toLowerCase().startsWith("u")
        ? "update" : action === "2" || action.toLowerCase().startsWith("r")
          ? "reinstall" : "cancel";
    }

    if (choice === "cancel") { console.log("\nCancelled."); process.exit(0); }
    if (choice === "reinstall") {
      if (existing.method === "plugin" && hasDroid()) {
        uninstallViaPlugin();
      } else if (existing.path !== "(managed by droid)" && isSafeToDelete(existing.path)) {
        rmSync(existing.path, { recursive: true, force: true });
        ok("Removed existing install");
      }
    }
    if (choice === "update" && existing.method === "plugin" && hasDroid()) {
      run(`droid plugin update ${PLUGIN_NAME}@${MARKETPLACE_NAME} 2>&1`);
      ok("Updated via plugin system");
      banner("Done!");
      return;
    }
  }

  // [1] Prerequisites
  step(1, 3, "Checking prerequisites...");
  if (!checkPrereqs()) { fail("Fix issues above and retry."); process.exit(1); }

  // [2] Install
  step(2, 3, "Installing superpowers...");

  let installDir;
  let usedPluginSystem = false;
  if (hasDroid()) {
    const pluginOk = installViaPlugin(scope);
    if (pluginOk) {
      installDir = "(managed by droid plugin system)";
      usedPluginSystem = true;
    } else {
      installDir = scope === "user" ? MANUAL_USER_DIR : MANUAL_PROJECT_DIR(process.cwd());
      manualClone(installDir);
      setupHooks(installDir);
      verifyPlugin(installDir);
    }
  } else {
    installDir = scope === "user" ? MANUAL_USER_DIR : MANUAL_PROJECT_DIR(process.cwd());
    manualClone(installDir);
    setupHooks(installDir);
    verifyPlugin(installDir);
  }

  // [3] AGENTS.md
  step(3, 3, "Configuring AGENTS.md...");
  addToAgentsMd(scope);

  // Done
  banner("superpowers installed");
  const installPath = installDir;
  const skillsDir = usedPluginSystem ? null : join(installDir, "skills");
  const skillCount = skillsDir && existsSync(skillsDir)
    ? readdirSync(skillsDir).filter(d => existsSync(join(skillsDir, d, "SKILL.md"))).length
    : 14;
  console.log();
  console.log(`  location:   ${c.cyan}${installPath}${c.reset}`);
  console.log(`  skills:     ${c.cyan}${skillCount}${c.reset} loaded`);
  console.log();
  console.log(`  next steps:`);
  console.log(`    start a new droid session`);
  console.log(`    ask it to build something — brainstorming fires automatically`);
  console.log(`    browse skills with ${c.cyan}/skills${c.reset}`);
  console.log();
}

// ── uninstall flow ─────────────────────────────────────────────────────────────

async function uninstall(scope, nonInteractive = false) {
  banner("superpowers-droid — uninstaller");

  const existing = findAnyInstall(scope);
  // Even if no active install found, still clean registries
  const hasRegistryRemnants = existsSync(join(FACTORY_DIR, "settings.json")) ||
    existsSync(INSTALLED_JSON) || existsSync(MARKETPLACES_JSON);

  if (!existing && !hasRegistryRemnants) {
    warn("Superpowers is not installed — nothing to remove.");
    process.exit(0);
  }

  if (existing) {
    console.log(`  ${c.dim}Found: ${existing.method} install at ${existing.path}${c.reset}`);
  } else {
    console.log(`  ${c.dim}No active install found, but checking for leftover config...${c.reset}`);
  }

  if (!nonInteractive) {
    const confirm = await ask("Remove superpowers? (y/N)", []);
    if (!confirm.toLowerCase().startsWith("y")) {
      console.log("\nCancelled.");
      process.exit(0);
    }
  } else {
    ok("Non-interactive mode — proceeding with removal");
  }

  const totalSteps = 4;

  // [1] Remove plugin / manual install
  step(1, totalSteps, "Removing superpowers...");
  if (existing) {
    if (existing.method === "plugin" && hasDroid()) {
      uninstallViaPlugin();
    } else if (existing.path && existing.path !== "(managed by droid)") {
      if (isSafeToDelete(existing.path)) {
        rmSync(existing.path, { recursive: true, force: true });
        ok(`Removed ${existing.path}`);
      }
    }
  } else {
    info("No active install to remove");
  }

  // [2] Clean AGENTS.md
  step(2, totalSteps, "Cleaning AGENTS.md...");
  removeFromAgentsMd(scope);

  // [3] Clean plugin registries, cache, and marketplace dirs
  step(3, totalSteps, "Cleaning plugin registries...");
  cleanPluginRegistries();

  // [4] Done
  step(4, totalSteps, "Cleanup complete.");
  console.log(`\n  Superpowers has been removed.\n`);
}

// ── main ───────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // Determine command (positional or flag)
  let command = "install"; // default
  if (args[0] === "install" || args[0] === "uninstall" || args[0] === "status" || args[0] === "--help" || args[0] === "-h") {
    command = args[0].replace(/^--?/, "");
    // don't shift — flags still parsed from full args
  }
  if (args.includes("--uninstall")) command = "uninstall";
  if (args.includes("--status")) command = "status";
  if (args.includes("--help") || args.includes("-h")) command = "help";

  const hasExplicitScope = args.includes("--user") || args.includes("--project");
  const nonInteractive = hasExplicitScope;
  let scope = args.includes("--user") ? "user" : args.includes("--project") ? "project" : null;

  if (command === "help") { printHelp(); return; }
  if (command === "status") { status(); return; }

  if (!scope && command !== "status") {
    const answer = await ask("where should superpowers be installed?", [
      { label: "user-level", desc: "available in all sessions (recommended)" },
      { label: "project-level", desc: "only this project" },
    ]);
    scope = answer === "1" || answer.toLowerCase().includes("user") ? "user" : "project";
  }

  if (command === "uninstall") await uninstall(scope, nonInteractive);
  else await install(scope, nonInteractive);
}

main().catch((err) => { fail(err.message); process.exit(1); });

#!/usr/bin/env node
/**
 * AUTO-PUSH
 * ============================================================================
 * Commits whatever changed and pushes it, so the GitHub copy of this project is
 * never more than one turn behind the working copy. Wired to the Stop hook in
 * .claude/settings.json, which fires when Claude finishes responding — one
 * commit per completed piece of work rather than one per file touched.
 *
 * It is deliberately impossible for this to break a session:
 *   · nothing to commit, no remote, no upstream, no network — all exit 0 quietly
 *   · every git call is wrapped; a failure is reported, never thrown
 *   · it only ever adds. It does not pull, rebase, reset, force or amend, so it
 *     cannot lose work or rewrite history that has already been pushed.
 *
 * It reports what it did through the hook's `systemMessage`, so a push that
 * fails is visible rather than silent.
 */

import { execFileSync } from "node:child_process";

/** Run git, returning trimmed stdout. Throws on a non-zero exit. */
const git = (args) =>
  execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  }).trim();

/** Say something in the Claude Code UI and stop. Always a clean exit. */
const done = (message) => {
  if (message) process.stdout.write(JSON.stringify({ systemMessage: message }));
  process.exit(0);
};

try {
  git(["rev-parse", "--is-inside-work-tree"]);
} catch {
  done(); // not a repo — nothing to do, and not worth mentioning
}

let changed;
try {
  changed = git(["status", "--porcelain"]);
} catch {
  done();
}
if (!changed) done(); // the common case: nothing changed this turn

/* ── Commit ──────────────────────────────────────────────────────────────── */
let files = [];
try {
  git(["add", "-A"]);
  files = git(["diff", "--cached", "--name-only"]).split("\n").filter(Boolean);
} catch (error) {
  done(`Auto-push: could not stage changes — ${error.message.split("\n")[0]}`);
}
if (files.length === 0) done(); // everything that changed was ignored

/* A subject line that says what moved, without pretending to know why. The
   detail is in the diff; this just has to be scannable in a list of commits. */
const shown = files.slice(0, 3).map((f) => f.split("/").pop());
const rest = files.length - shown.length;
const subject =
  `Update ${shown.join(", ")}${rest > 0 ? ` and ${rest} more file${rest > 1 ? "s" : ""}` : ""}`
    .slice(0, 72);

const body = [
  subject,
  "",
  `${files.length} file${files.length > 1 ? "s" : ""} changed. Committed automatically at the`,
  "end of a Claude Code turn — see scripts/auto-push.mjs.",
  "",
  "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>",
].join("\n");

try {
  git(["commit", "-m", body]);
} catch (error) {
  done(`Auto-push: commit failed — ${error.message.split("\n")[0]}`);
}

/* ── Push ────────────────────────────────────────────────────────────────── */
let remote = "";
try {
  remote = git(["remote"]).split("\n")[0] ?? "";
} catch {
  /* fall through: no remote configured */
}
if (!remote) {
  done(`Auto-push: committed ${files.length} file(s) locally. No git remote yet, so nothing was pushed.`);
}

let branch = "HEAD";
try {
  branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
  git(["push", "--porcelain", "-u", remote, branch]);
} catch (error) {
  const reason = (error.stderr || error.message || "").split("\n").filter(Boolean).pop() ?? "unknown error";
  done(
    `Auto-push: committed ${files.length} file(s), but the push failed — ${reason}. ` +
      `The commit is safe locally; run "git push" once that is sorted.`
  );
}

done(`Auto-push: ${files.length} file(s) committed and pushed to ${remote}/${branch}.`);

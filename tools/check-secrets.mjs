#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const run = (args) => {
  const result = spawnSync("git", args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(result.stderr || result.error?.message || `git ${args.join(" ")} failed`);
  return result.stdout;
};

const paths = run(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]).split(/\r?\n/).filter(Boolean);
const blockedFiles = /(?:^|\/)(?:\.env(?:\.(?!example(?:\.|$)|sample(?:\.|$)|template(?:\.|$))[^/]*)?|id_(?:rsa|ed25519|ecdsa|dsa)|credentials?\.(?:json|ya?ml)|secrets?\.(?:json|ya?ml)|service-account[^/]*\.json)(?:$)|\.(?:pem|key|der|crt|cer|p7b|p7c|asc|p12|pfx|jks|keystore)$/i;
const findings = paths.filter((path) => blockedFiles.test(path));
const diff = run(["diff", "--cached", "--unified=0", "--"]);
const patterns = [
  ["private key", new RegExp(["-----BEGIN", "(?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----"].join(" "))],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["GitHub token", /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/],
  ["OpenAI-style secret", /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/],
  ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["credential assignment", /\b(?:api[_-]?key|client[_-]?secret|access[_-]?token|secret|token|password|private[_-]?key)\b\s*[:=]\s*["'][^"'\s]{20,}["']/i],
];
let currentPath = "";
for (const line of diff.split(/\r?\n/)) {
  if (line.startsWith("+++ b/")) currentPath = line.slice(6);
  if (!line.startsWith("+") || line.startsWith("+++")) continue;
  for (const [label, pattern] of patterns) if (pattern.test(line.slice(1))) findings.push(`${currentPath}: ${label}`);
}

if (findings.length) {
  console.error("Possible sensitive content in staged changes:");
  for (const finding of new Set(findings)) console.error(`- ${finding}`);
  console.error("Remove the sensitive data, rotate exposed credentials, then stage and scan again.");
  process.exit(1);
}
console.log(`Secret preflight passed (${paths.length} staged paths scanned).`);

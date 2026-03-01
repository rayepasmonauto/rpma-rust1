#!/usr/bin/env node

/**
 * Backend architecture gate for `src-tauri`.
 *
 * Enforces:
 * - No SQL execution patterns in domain IPC handlers
 * - No direct DB access patterns in domain IPC handlers
 * - No cross-domain internal imports across bounded contexts
 *
 * Existing legacy violations can be allowlisted in
 * `scripts/backend-architecture-allowlist.json`.
 */

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const domainsRoot = path.join(repoRoot, "src-tauri", "src", "domains");
const allowlistPath = path.join(
  __dirname,
  "backend-architecture-allowlist.json",
);

function walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".rs")) {
      out.push(fullPath);
    }
  }
  return out;
}

function stripRustComments(contents) {
  return contents
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

function toPosixRelative(from, target) {
  return path.relative(from, target).replace(/\\/g, "/");
}

function loadAllowlist() {
  try {
    const parsed = JSON.parse(fs.readFileSync(allowlistPath, "utf8"));
    return {
      sqlInIpc: new Set(parsed.allow_sql_in_ipc || []),
      ipcDbUsage: new Set(parsed.allow_ipc_db_usage || []),
      crossDomainImports: new Set(parsed.allow_cross_domain_imports || []),
    };
  } catch (error) {
    return {
      sqlInIpc: new Set(),
      ipcDbUsage: new Set(),
      crossDomainImports: new Set(),
    };
  }
}

function isIpcFile(relativePath) {
  return relativePath.includes("/ipc/");
}

function isTestPath(relativePath) {
  return relativePath.includes("/tests/") || relativePath.endsWith("_tests.rs");
}

function main() {
  if (!fs.existsSync(domainsRoot)) {
    console.error(`Domains root not found: ${domainsRoot}`);
    process.exit(1);
  }

  const allowlist = loadAllowlist();
  const files = walkFiles(domainsRoot);
  const violations = [];

  const sqlPatterns = [
    /\.execute\s*\(/g,
    /\.prepare\s*\(/g,
    /\.query_row\s*\(/g,
    /\.query_map\s*\(/g,
    /\.query\s*\(/g,
    /\brusqlite::/g,
  ];

  const ipcDbPatterns = [
    /\bstate\.db\b/g,
    /\bstate\.async_db\b/g,
    /\bget_connection\s*\(/g,
    /\bDatabase::/g,
    /\bAsyncDatabase::/g,
    /\bSqliteConnectionManager\b/g,
  ];

  const crossDomainPattern =
    /crate::domains::([a-zA-Z0-9_]+)::(domain|application|infrastructure|ipc)\b/g;

  for (const file of files) {
    const rel = toPosixRelative(domainsRoot, file);
    const ownerDomain = rel.split("/")[0];
    const contents = stripRustComments(fs.readFileSync(file, "utf8"));

    if (isIpcFile(rel)) {
      for (const pattern of sqlPatterns) {
        pattern.lastIndex = 0;
        if (!pattern.test(contents)) {
          continue;
        }
        const key = rel;
        if (!allowlist.sqlInIpc.has(key)) {
          violations.push({
            kind: "sql-in-ipc",
            file: rel,
            detail: pattern.toString(),
          });
        }
      }

      for (const pattern of ipcDbPatterns) {
        pattern.lastIndex = 0;
        if (!pattern.test(contents)) {
          continue;
        }
        const key = rel;
        if (!allowlist.ipcDbUsage.has(key)) {
          violations.push({
            kind: "ipc-db-usage",
            file: rel,
            detail: pattern.toString(),
          });
        }
      }
    }

    if (isTestPath(rel)) {
      continue;
    }

    for (const match of contents.matchAll(crossDomainPattern)) {
      const targetDomain = match[1];
      const targetLayer = match[2];
      if (targetDomain === ownerDomain) {
        continue;
      }

      const key = `${rel} -> ${targetDomain}::${targetLayer}`;
      if (!allowlist.crossDomainImports.has(key)) {
        violations.push({
          kind: "cross-domain-import",
          file: rel,
          detail: `${targetDomain}::${targetLayer}`,
        });
      }
    }
  }

  if (violations.length > 0) {
    console.error("Backend architecture check failed.");
    for (const violation of violations) {
      console.error(`- [${violation.kind}] ${violation.file} (${violation.detail})`);
    }
    process.exit(1);
  }

  console.log("Backend architecture check passed.");
}

main();

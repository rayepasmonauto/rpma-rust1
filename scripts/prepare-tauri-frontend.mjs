import { cp, mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = path.resolve(import.meta.dirname, "..");
const frontendDir = path.join(rootDir, "frontend");
const tauriDir = path.join(rootDir, "src-tauri");
const outDir = path.join(frontendDir, "out");
const prodDir = path.join(tauriDir, "frontend-prod");
const standaloneDir = path.join(frontendDir, ".next", "standalone");
const staticDir = path.join(frontendDir, ".next", "static");
const publicDir = path.join(frontendDir, "public");
const nodeExecutable = process.execPath;

async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(targetPath) {
  await mkdir(targetPath, { recursive: true });
}

async function copyDirIfExists(source, destination) {
  if (!(await pathExists(source))) {
    return;
  }

  await ensureDir(path.dirname(destination));
  await cp(source, destination, { recursive: true, force: true });
}

async function writeTauriPlaceholder() {
  await rm(outDir, { recursive: true, force: true });
  await ensureDir(outDir);
  await writeFile(
    path.join(outDir, "index.html"),
    "<!doctype html><html><head><meta charset=\"utf-8\"><title>RPMA</title></head><body>Launching RPMA...</body></html>",
  );
}

async function prepareProdRuntime() {
  if (!(await pathExists(standaloneDir))) {
    throw new Error(`Next standalone output not found: ${standaloneDir}`);
  }

  await rm(prodDir, { recursive: true, force: true });
  await ensureDir(prodDir);

  await copyDirIfExists(standaloneDir, path.join(prodDir, "standalone"));
  await copyDirIfExists(staticDir, path.join(prodDir, "standalone", ".next", "static"));
  await copyDirIfExists(publicDir, path.join(prodDir, "standalone", "public"));

  const nodeTargetName = process.platform === "win32" ? "node.exe" : "node";
  const nodeTargetPath = path.join(prodDir, "node", nodeTargetName);
  await ensureDir(path.dirname(nodeTargetPath));
  await cp(nodeExecutable, nodeTargetPath, { force: true });
}

async function main() {
  await writeTauriPlaceholder();
  await prepareProdRuntime();
  console.log(`Prepared Tauri standalone frontend runtime at ${prodDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

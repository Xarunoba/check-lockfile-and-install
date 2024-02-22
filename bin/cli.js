#!/usr/bin/env node

const path = require("node:path");
const fs = require("node:fs");

const execSync = require("node:child_process").execSync;
const process = require("node:process");

const flags = require("yargs/yargs")(process.argv.slice(2)).parse();
const cwd = process.cwd();
const lockfileRegex = /^(pnpm-lock\.yaml|package-lock\.json|yarn\.lock)/gm;

const installCommands = {
  "package-lock.json": `npm ${flags.ci ? "ci" : "install"}`,
  "pnpm-lock.yaml": `pnpm ${flags.ci ? "install --frozen-lockfile" : "install"}`,
  "yarn.lock": `yarn ${flags.ci ? "install --frozen-lockfile" : "install"}`,
};

function checkFlags() {
  let enabledFlags = [];
  if (flags.ci) enabledFlags.push("ci");
  if (flags.strict) enabledFlags.push("strict");
  if (enabledFlags.length)
    console.log(`◼ Enabled flags: \n    ❯ ${enabledFlags.join("\n    ❯ ")}`);
}

function checkGit() {
  console.log("❯ Performing git checks...");
  try {
    execSync("git --version", { stdio: "ignore" });
  } catch (error) {
    console.error("✘ No git version found!");
    console.log("✔ Finished clai!");
    process.exit(flags.strict ? 1 : 0);
  }
  try {
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
  } catch (error) {
    console.error("✘ No git repository found!");
    console.log("✔ Finished clai!");
    process.exit(flags.strict ? 1 : 0);
  }
  try {
    execSync("git rev-parse --verify HEAD~1", { stdio: "ignore" });
  } catch (error) {
    console.error("✘ No HEAD~1 found! You probably only have one commit.");
    console.log("✔ Finished clai!");
    process.exit(flags.strict ? 1 : 0);
  }
  console.log("✔ No git issues found!");
}

function installInDirs(dirPaths) {
  dirPaths.forEach((dirPath) => {
    const detectedLockFiles = Object.keys(installCommands).filter(
      (lockFile) => {
        const lockfilePath = path.posix.join(dirPath, lockFile);
        console.log(`❯ Checking for "${lockFile}" in "${dirPath}"`);
        return fs.existsSync(lockfilePath);
      },
    );

    if (detectedLockFiles.length === 0)
      console.error(`   ✘ No lockfiles found in "${dirPath}"`);
    else {
      if (detectedLockFiles.length > 1) {
        if (flags.strict) {
          console.error(
            `   ✘ Multiple lockfiles found in "${dirPath}" skipping install...`,
          );
          return;
        } else console.warn(`   ⚠ Multiple lockfiles found in "${dirPath}"`);
      }

      detectedLockFiles.forEach((detectedLockFile) => {
        const installCommand = installCommands[detectedLockFile];
        console.log(`◼ "${detectedLockFile}" found in "${dirPath}"`);
        console.log(`   ❯ Running "${installCommand}" in ${dirPath}`);

        try {
          process.chdir(dirPath);
          execSync(installCommand);
          process.chdir(cwd);
          console.log(
            `   ✔ Successfully ran "${installCommand}" in "${dirPath}"`,
          );
        } catch (error) {
          console.error(
            `   ✘ Failed to run "${installCommand}" in "${dirPath}":`,
            error,
          );
          process.chdir(cwd);
        }
      });
    }
  });
}

function performClai() {
  console.log("❯ Checking for lockfile changes...");
  const gitDiffCommand = "git diff --name-only HEAD~1 HEAD";
  const gitDiffOutput = execSync(gitDiffCommand).toString();
  const modifiedFiles = gitDiffOutput
    .split("\n")
    .filter((fileName) => fileName.match(lockfileRegex))
    .map((fileName) => path.posix.join(...fileName.split("/").slice(2)));

  console.log(
    `◼ Modified files: \n    ❯ ${gitDiffOutput
      .split("\n")
      .filter(Boolean)
      .join("\n    ❯ ")}`,
  );

  if (modifiedFiles.length > 0) {
    console.log(
      `◼ Found ${modifiedFiles.length} modified file/s in the following directories:`,
    );
    console.log(`    ❯ ${modifiedFiles.join(",\n    ❯ ")}`);

    const dirPaths = Array.from(
      new Set(
        modifiedFiles.map((pkgLockFilePath) => path.dirname(pkgLockFilePath)),
      ),
    );

    installInDirs(dirPaths);
    console.log(
      `✔ Successfully ran install command in ${dirPaths.length} directories`,
    );
  } else console.log("✘ No lockfile changes found!");
}

function main() {
  try {
    console.log("❯ Preparing clai...");
    checkFlags();
    checkGit();
    performClai();
    console.log("✔ Finished clai!");
    process.exit(0);
  } catch (err) {
    console.error("✘ ", err.message);
    process.exit(1);
  }
}

main();

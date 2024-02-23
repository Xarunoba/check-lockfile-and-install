#!/usr/bin/env node

const path = require("node:path");
const fs = require("node:fs");
const process = require("node:process");
const execSync = require("node:child_process").execSync;
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const cwd = process.cwd();
const lockfileRegex = /^(pnpm-lock\.yaml|package-lock\.json|yarn\.lock)/gm;

const flagsDescription = {
  strict: "Will immediately exit if any issues are found.",
  ci: "Will do a clean install or install --frozen-lockfile.",
};

const flags = yargs(hideBin(process.argv))
  .strict()
  .usage("Usage: $0 [options]")
  .options({
    strict: {
      describe: flagsDescription.strict,
      type: "boolean",
    },
    ci: {
      describe: flagsDescription.ci,
      type: "boolean",
    },
  })
  .help().argv;

const installCommands = {
  "package-lock.json": `npm ${flags.ci ? "ci" : "install"}`,
  "pnpm-lock.yaml": `pnpm ${flags.ci ? "install --frozen-lockfile" : "install"}`,
  "yarn.lock": `yarn ${flags.ci ? "install --frozen-lockfile" : "install"}`,
};

/**
 * Check the enabled flags and log them to the console.
 */
function checkFlags() {
  let enabledFlags = Object.keys(flagsDescription).filter(
    (flag) => flags[flag],
  );
  if (enabledFlags.length) {
    console.log("◼ Enabled flags:");
    enabledFlags.forEach((flag) => {
      console.log(`    ❯ ${flag}`);
    });
  }
}

/**
 * Function to check if git is installed and if the current directory is a git repository.
 * If any of the checks fail, it logs an error and exits the process.
 */
function checkGit() {
  console.log("❯ Performing git checks...");
  try {
    // Check if git is installed
    execSync("git --version", { stdio: "ignore" });
  } catch (error) {
    console.error("✘ No git version found!");
    console.log("✔ Finished clai!");
    process.exit(flags.strict ? 1 : 0);
  }
  try {
    // Check if the current directory is a git repository
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
  } catch (error) {
    console.error("✘ No git repository found!");
    console.log("✔ Finished clai!");
    process.exit(flags.strict ? 1 : 0);
  }
  try {
    // Check if HEAD~1 exists (checking for at least 2 commits in the repository)
    execSync("git rev-parse --verify HEAD~1", { stdio: "ignore" });
  } catch (error) {
    console.error("✘ No HEAD~1 found! You probably only have one commit.");
    console.log("✔ Finished clai!");
    process.exit(flags.strict ? 1 : 0);
  }
  console.log("✔ No git issues found!");
}

/**
 * Installs dependencies in the specified directories.
 * @param {string[]} dirPaths - Array of directory paths to install dependencies in.
 */
function installInDirs(dirPaths) {
  dirPaths.forEach((dirPath) => {
    // Detect lock files in the directory
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
      // Handle multiple lock files
      if (detectedLockFiles.length > 1) {
        if (flags.strict) {
          console.error(
            `   ✘ Multiple lockfiles found in "${dirPath}" skipping install...`,
          );
          return;
        } else console.warn(`   ⚠ Multiple lockfiles found in "${dirPath}"`);
      }

      // Install dependencies
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

/**
 * Perform CLAI (Check Lockfiles and Install) process
 */
function performClai() {
  console.log("❯ Checking for lockfile changes...");

  // Command to get the names of files changed between HEAD~1 and HEAD
  const gitDiffCommand = "git diff --name-only HEAD~1 HEAD";

  // Execute the git diff command and store the output
  const gitDiffOutput = execSync(gitDiffCommand).toString();

  // Filter and map the modified files from git diff output
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

  // Check if there are modified files
  if (modifiedFiles.length > 0) {
    console.log(
      `◼ Found ${modifiedFiles.length} modified file/s in the following directories:`,
    );
    console.log(`    ❯ "${modifiedFiles.join(`"\n    ❯ "`)}"`);

    // Get unique directory paths from the modified file paths
    const dirPaths = Array.from(
      new Set(
        modifiedFiles.map((pkgLockFilePath) => path.dirname(pkgLockFilePath)),
      ),
    );

    // Call installInDirs function with the directory paths
    installInDirs(dirPaths);

    console.log(
      `✔ Successfully ran install command in ${dirPaths.length} directories`,
    );
  } else console.log("✘ No lockfile changes found!");
}

/**
 * Main function to execute the CLAI
 */
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

#!/usr/bin/env node

import { posix, dirname } from "node:path";
import { existsSync } from "node:fs";
import { argv, exit } from "node:process";
import { promisify } from "node:util";
import { exec } from "node:child_process";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

const execAsync = promisify(exec);

const lockfileRegex = /^(pnpm-lock\.yaml|package-lock\.json|yarn\.lock)/gm;
const flagsDescription = {
  strict: "Will immediately exit if issues are found",
  cleaninstall: "Will do a clean install",
  quiet: "Will not log anything to the console",
};

const flagsAlias = {
  v: "version",
  h: "help",
  s: "strict",
  c: "cleaninstall",
  q: "quiet",
};

const flags = yargs(hideBin(argv))
  .strict()
  .alias(flagsAlias)
  .options({
    strict: {
      describe: flagsDescription.strict,
      type: "boolean",
    },
    cleaninstall: {
      describe: flagsDescription.cleaninstall,
      type: "boolean",
    },
    quiet: {
      describe: flagsDescription.quiet,
      type: "boolean",
    },
  })
  .help().argv;

const installCommands = {
  "package-lock.json": `npm ${flags.cleaninstall ? "ci" : "install"}`,
  "pnpm-lock.yaml": `pnpm ${flags.cleaninstall ? "install --frozen-lockfile" : "install"}`,
  "yarn.lock": `yarn ${flags.cleaninstall ? "install --frozen-lockfile" : "install"}`,
};

/**
 * Check the enabled flags and log them to the console.
 */
const checkFlags = () => {
  let enabledFlags = Object.keys(flagsDescription).filter(
    (flag) => flags[flag],
  );
  if (enabledFlags.length) {
    if (!flags.q) console.log("◼ Enabled flag/s:");
    enabledFlags.forEach((flag) => {
      if (!flags.q) console.log(`    ❯ ${flag}`);
    });
  }
};

/**
 * Check if git is installed.
 */
const checkGitVersion = async () => {
  if (!flags.q) console.log("❯ Checking if git is installed...");
  try {
    await execAsync("git --version");
    if (!flags.q) console.log("✔ Git is installed!");
  } catch (err) {
    console.error("✘ Git is not installed!");
    exit(1);
  }
};

/**
 * Check if the current directory is a git repository and if HEAD~1 exists.
 */
const checkGitRepo = async () => {
  if (!flags.q)
    console.log("❯ Checking if the current directory is a git repository...");
  try {
    await execAsync("git rev-parse --is-inside-work-tree");
    await execAsync("git rev-parse --verify HEAD~1");
    if (!flags.q)
      console.log(
        "✔ Current directory is a git repository and HEAD~1 exists!",
      );
  } catch (err) {
    console.error("✘ Not a git repository or HEAD~1 does not exist!");
    exit(1);
  }
};

/**
 * Gets and checks lockfile changes
 * @returns {Promise<Array>}- Array of changed files
 */
const getAndCheckLockfileChanges = async () => {
  return new Promise(async (resolve) => {
    if (!flags.q) console.log("❯ Getting and checking lockfile changes...");
    const gitDiffCommand = "git diff --name-only HEAD~1 HEAD";
    const { stdout: gitDiffOutput } = await execAsync(gitDiffCommand);

    // Filter and map the changed files from git diff output
    const changedFiles = gitDiffOutput
      .split("\n")
      .filter((fileName) => fileName.match(lockfileRegex))
      .map((fileName) => posix.join(...fileName.split("/").slice(2)));

    if (changedFiles.length === 0) {
      if (!flags.q) console.log("✘ No lockfile changes found!");
      if (!flags.q) console.log("✔ Finished clai!");
      exit(0);
    } else {
      if (!flags.q)
        console.log(`✔ Found ${changedFiles.length} changed lockfile/s!`);
    }

    resolve(changedFiles);
  });
};

/**
 * Get the lockfile type (npm, pnpm, or yarn) for a directory.
 * @param {string} dirPath - Directory path.
 */
const getLockfileType = (dirPath) => {
  if (!flags.q) console.log(`❯ Getting lockfile type for "${dirPath}"`);
  const detectedLockFiles = Object.keys(installCommands).filter((lockFile) => {
    const lockfilePath = posix.join(dirPath, lockFile);
    return existsSync(lockfilePath);
  });

  if (detectedLockFiles.length === 0) {
    return null;
  } else if (detectedLockFiles.length > 1) {
    return "multiple";
  } else {
    return detectedLockFiles[0];
  }
};

/**
 * Install dependencies in the specified directories.
 * @param {string[]} dirPaths - Array of directory paths to install dependencies in.
 */
const installInDirs = async (dirPaths) => {
  if (!flags.q) console.log("❯ Installing dependencies...");

  // Create the installPromises array inside an IIFE to prevent it from running before the await statement
  const installPromises = (function () {
    return dirPaths.map(async (dirPath) => {
      const lockfileType = getLockfileType(dirPath);

      if (!lockfileType) {
        return;
      }

      if (lockfileType === "multiple") {
        if (flags.strict) {
          console.error(
            `✘ Multiple lockfiles found in "${dirPath}" skipping install...`,
          );
          return;
        } else {
          console.warn(`⚠ Multiple lockfiles found in "${dirPath}"`);
        }
      }

      const installCommand = installCommands[lockfileType];
      if (!flags.q) console.log(`◼ ${lockfileType} found in "${dirPath}"`);
      if (!flags.q)
        console.log(`   ❯ Running "${installCommand}" in "${dirPath}"`);

      try {
        await execAsync(installCommand, { cwd: dirPath });
        if (!flags.q)
          console.log(
            `   ✔ Successfully ran "${installCommand}" in "${dirPath}"`,
          );
      } catch (err) {
        console.error(
          `   ✘ Failed to run "${installCommand}" in "${dirPath}":`,
          err,
        );
      }
    });
  })();

  try {
    await Promise.all(installPromises);
  } catch (err) {
    console.error("✘ ", err.message);
    exit(1);
  }
};

/**
 * Main function to execute the clai.
 */
const main = async () => {
  const startTime = Date.now();
  if (!flags.q) console.log("❯ Preparing clai...");

  checkFlags();

  // Check if git is installed
  await checkGitVersion();

  // Check if the current directory is a git repository and if HEAD~1 exists
  await checkGitRepo();

  // Get and check lockfile changes
  const changedFiles = await getAndCheckLockfileChanges();

  // Get unique directory paths from the changed file paths
  const dirPaths = Array.from(
    new Set(changedFiles.map((lockfilePath) => dirname(lockfilePath))),
  );

  // Install dependencies in the specified directories
  await installInDirs(dirPaths);

  if (!flags.q) console.log("✔ Finished clai!");
  const endTime = Date.now();
  const elapsedTime = (endTime - startTime) / 1000;
  if (!flags.q) console.log(`Total time elapsed: ${elapsedTime} seconds`);
  exit(0);
};

main();

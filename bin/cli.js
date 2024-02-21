#!/usr/bin/env node

const path = require('node:path')
const fs = require('node:fs')
const execSync = require('node:child_process').execSync
const process = require('node:process')

const lockfileRegex = /^(pnpm-lock\.yaml|package-lock\.json|yarn\.lock)/gm // regex pattern for finding lockfiles
const installCommands = {
  'pnpm-lock.yaml': 'pnpm install',
  'package-lock.json': 'npm install',
  'yarn.lock': 'yarn install',
}

function runInstallCommandInDirs(dirPaths) {
  const lockFiles = Object.keys(installCommands)
  dirPaths.forEach((dirPath) => {
    let detectedLockFile = lockFiles.find((lockFile) => {
      const lockfilePath = path.posix.join(dirPath, lockFile)
      console.log(`❯ Checking for "${lockFile}" in "${dirPath}"`)
      if (fs.existsSync(lockfilePath)) {
        return lockFile
      } else {
        console.error(`❯ Could not find "${lockFile}" in "${dirPath}"\n`)
      }
    })

    const installCommand = detectedLockFile
      ? installCommands[detectedLockFile]
      : null

    if (installCommand == null) {
      throw new Error(`No lockfile found in "${dirPath}"`)
    } else {
      console.log(`◼ "${detectedLockFile}" found in "${dirPath}"`)
      console.log(`   ❯ Running ${installCommand} in ${dirPath}`)
    }

    try {
      process.chdir(dirPath)
      execSync(installCommand)
      console.log(`   ✔ Successfully ran ${installCommand} in ${dirPath}`)
    } catch (error) {
      throw new Error(`Failed to run ${installCommand} in "${dirPath}":`, error)
    }
  })
}

try {
  console.log('✔ Preparing clai...')
  console.log('❯ Checking for lockfile changes...')
  const gitDiffCommand = 'git diff --name-only HEAD~1 HEAD'
  const gitDiffOutput = execSync(gitDiffCommand).toString()
  const modifiedFiles = gitDiffOutput
    .split('\n')
    .filter((fileName) => fileName.match(lockfileRegex))
    .map((fileName) => path.posix.join(...fileName.split('/').slice(2)))

  console.log(
    `❯ Modified files: \n    ❯ ${gitDiffOutput
      .split('\n')
      .filter(Boolean)
      .join('\n    ❯ ')}`
  )

  if (modifiedFiles.length > 0) {
    console.log(
      `❯ Found ${modifiedFiles.length} modified file/s in the following directories:`
    )
    console.log(`    ❯ ${modifiedFiles.join(',\n    ❯ ')}\n`)
  }

  if (modifiedFiles.length > 0) {
    const dirPaths = Array.from(
      new Set(
        modifiedFiles.map((pkgLockFilePath) => path.dirname(pkgLockFilePath))
      )
    )

    runInstallCommandInDirs(dirPaths)
    console.log(
      `✔ Successfully ran install command in ${dirPaths.length} directories`
    )
  } else {
    console.log('✘ No lockfile changes found!')
  }

  console.log('✔ Finished clai!')
  process.exit(0)
} catch (err) {
  console.error('✘ An error has occured:\n   ❯ ', err.message)
  process.exit(1)
}

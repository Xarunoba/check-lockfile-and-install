#!/usr/bin/env node

const path = require('node:path')
const execSync = require('node:child_process').execSync
const process = require('node:process')

const lockfileRegex = /^(pnpm-lock\.yaml|package-lock\.json|yarn\.lock)/gm // regex pattern for finding lockfiles
const installCommands = {
  'pnpm-lock.yaml': 'pnpm install',
  'package-lock.json': 'npm install',
  'yarn.lock': 'yarn install',
}

function runInstallCommandInDirs(dirPaths) {
  dirPaths.forEach((dirPath) => {
    const lockFiles = ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock']
    let detectedLockFile = lockFiles.find((lockFile) => {
      try {
        return fs.existsSync(path.join(dirPath, lockFile))
      } catch {
        return false
      }
    })

    const installCommand = detectedLockFile
      ? installCommands[detectedLockFile]
      : 'npm install'

    try {
      process.chdir(dirPath)
      execSync(installCommand)
      console.log(`✅ Successfully ran ${installCommand} in ${dirPath}`)
    } catch (error) {
      console.error(`❌ Failed to run ${installCommand} in ${dirPath}:`, error)
    }
  })
}

try {
  const gitDiffCommand = 'git diff --name-only HEAD~1 HEAD'
  const modifiedFiles = execSync(gitDiffCommand)
    .toString()
    .split('\n')
    .filter((fileName) => fileName.match(lockfileRegex))
    .map((fileName) => path.posix.join(...fileName.split('/').slice(2)))

  if (modifiedFiles.length > 0) {
    const dirPaths = Array.from(
      new Set(
        modifiedFiles.map((pkgLockFilePath) => path.dirname(pkgLockFilePath))
      )
    )
    runInstallCommandInDirs(dirPaths)
    console.log(
      `📦 ${modifiedFiles.join(
        ', '
      )} were changed. Running install script to update your dependencies...`
    )
  } else {
    console.log('No changes found.')
  }
} catch (err) {
  console.error('Error running CLAI:\n', err)
}

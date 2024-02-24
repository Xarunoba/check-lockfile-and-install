# @xarunoba/clai ⬆️

![Static Badge](https://img.shields.io/badge/Made_with-%E2%9D%A4%EF%B8%8F-red?style=for-the-badge) ![NPM License](https://img.shields.io/npm/l/%40xarunoba%2Fclai?style=for-the-badge)
![GitHub package.json version](https://img.shields.io/github/package-json/v/xarunoba/clai?style=for-the-badge&logo=npm)

**`clai`** — check lockfiles and install

Run package installation after checking for lockfile updates. Integrate with git hooks. Supports `npm`, `pnpm`, and `yarn`. Uses `git` and any of the supported package managers under the hood.

## Why

Using a bot to update dependencies is becoming widespread. Installing after pulling from your remote repository is now needed in order to synchronize your local modules. `clai` fixes this issue by checking for lockfile updates and running install.

## Installation

### npm

```bash
npm install -D @xarunoba/clai
# run locally
npx clai
```

### pnpm

```bash
pnpm install -D @xarunoba/clai
# run locally
pnpm clai
```

### yarn

```bash
yarn add --dev @xarunoba/clai
# run locally
yarn run clai
```

## Usage

### npm

```bash
npx @xarunoba/clai
```

### pnpm

```bash
pnpm dlx @xarunoba/clai
```

### yarn

```bash
yarn dlx @xarunoba/clai
```

### flags

You can add the following flags for `clai`:

- `-v, --version` — Show version number
- `-h, --help` — Show help
- `-c, --cleaninstall` — use `ci` (npm) or `--frozen-lockfile` (pnpm, yarn) when installing
- `-s, --strict` — Will immediately exit if any issues are found
- `-q, --quiet` — Will not log anything to the console

## Integrations

### With [`simple-git-hooks`](https://github.com/toplenboren/simple-git-hooks)

Integrating with [`simple-git-hooks`](https://github.com/toplenboren/simple-git-hooks) is easy as a toasted bread:

```json
// package.json
{
  ...
  "simple-git-hooks": {
    // I prefer always using the latest version of clai
    // instead of installing it as a dev dependency.
    // If you have installed it locally, you can use:
    // "post-merge": "npx clai"
    "post-merge": "npx @xarunoba/clai"
  }
  ...
}
```

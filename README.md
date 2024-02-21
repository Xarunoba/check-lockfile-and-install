# ⬆️ @xarunoba/clai
![Static Badge](https://img.shields.io/badge/Made_with-%E2%9D%A4%EF%B8%8F-red?style=for-the-badge) ![NPM License](https://img.shields.io/npm/l/%40xarunoba%2Fclai?style=for-the-badge)
 ![GitHub package.json version](https://img.shields.io/github/package-json/v/xarunoba/clai?style=for-the-badge&logo=npm&color=green) 

**`clai`** — check lockfiles and install

Run package installation after git pull. Supports `npm`, `pnpm`, and `yarn`.

## Why

Automatically updating dependencies through a bot is common nowadays... It's practical to run a local `install` to synchronize local dependencies with the newer versions. This aims to solve that issue.

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
yarn dlx @xarunoba/cai
```

## Integration with [`simple-git-hooks`](https://github.com/toplenboren/simple-git-hooks)

Integrating with [`simple-git-hooks`](https://github.com/toplenboren/simple-git-hooks) is easy as a toasted bread:

```json
// package.json
{
  ...
  "simple-git-hooks": {
    "post-merge": "npx @xarunoba/clai"
  }
  ...
}
```

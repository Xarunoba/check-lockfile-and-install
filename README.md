# ⬆️ @xarunoba/clai

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

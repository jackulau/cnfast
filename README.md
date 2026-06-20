# cnfast

[![version](https://img.shields.io/npm/v/cnfast?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/cnfast)
[![downloads](https://img.shields.io/npm/dt/cnfast.svg?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/cnfast)

Fast drop-in replacement for `cn`.

cnfast runs 3.9x faster than `clsx` + `tailwind-merge` (1.3x on cached re-renders), with byte-identical output. Same API, no code changes.

```ts
import { cn } from "cnfast";

cn("px-2 py-1", isActive && "px-4", { "text-red-500": hasError });
// "py-1 px-4 text-red-500"
```

## Install

```bash
npm install cnfast
```

## Usage

cnfast is a drop-in for the shadcn/ui `cn` helper:

```ts
// before
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

// after
export { cn } from "cnfast";
```

`cn` also works as a tagged template, cached by call-site identity for 3x over the call form:

```ts
cn`px-2 px-4 ${isActive && "bg-blue-500"}`; // "px-4 bg-blue-500"
```

cnfast also exports `clsx`, `twMerge`, and `twJoin`.

## Migrate

Rewrite `clsx`, `classnames`, and `tailwind-merge` imports to cnfast:

```bash
npx cnfast migrate
```

## Benchmarks

2.61x geometric mean across 22 workloads, 0 mismatches over 30,127 real-world call groups, 9.04 KB gzipped. See the [benchmark suite](./packages/fastcn/bench/README.md) for the breakdown, and the [architecture guide](./docs/architecture.md) for how it works.

## Development

```bash
pnpm install
pnpm build
pnpm test
```

## Credits

cnfast adapts MIT-licensed code from [clsx](https://github.com/lukeed/clsx) (Luke Edwards) and [tailwind-merge](https://github.com/dcastil/tailwind-merge) (Dany Castillo). See [LICENSE](./LICENSE).

## License

MIT

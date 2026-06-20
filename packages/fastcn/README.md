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

Migrate an existing `clsx`, `classnames`, or `tailwind-merge` project in one command:

```bash
npx cnfast migrate
```

On a shadcn/ui project, add or replace your `cn` utility through the registry. This rewrites `lib/utils.ts` to re-export cnfast and installs the package:

```bash
npx shadcn@latest add aidenybai/cnfast/cn
```

## Usage

Swap the shadcn/ui `cn` helper for cnfast:

```ts
// before
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

// after
export { cn } from "cnfast";
```

cnfast also exports `clsx`, `twMerge`, and `twJoin`.

## Going even faster

As a tagged template, `cn` caches by call-site identity: a stable call site runs 3.5x faster than the `cn(...)` call form and 7x faster than `clsx` + `tailwind-merge`.

```ts
cn`px-2 px-4 ${isActive && "bg-blue-500"}`; // "px-4 bg-blue-500"
```

## Comparing against cn

Measured against `clsx` + `tailwind-merge` across 22 open-source apps, 59,543 real `cn` call groups, 0 output mismatches. Numbers are operations per second, best-of-3 on Bun:

| Workload                                 | clsx + tailwind-merge | cnfast      | Speedup  |
| ---------------------------------------- | --------------------- | ----------- | -------- |
| Merge engine, cache-missing classes      | 68 ops/s              | 268 ops/s   | **3.9x** |
| Cached re-render, repeated classes       | 2,210 ops/s           | 3,071 ops/s | **1.4x** |
| Live data grid, classes change per frame | 17 ops/s              | 48 ops/s    | **2.8x** |
| Tagged template, stable call site        | 2.2M ops/s            | 15.7M ops/s | **7.2x** |

Geometric mean across 36 workloads: **2.86x**. Bundle size is 9.04 KB gzipped against 8.45 KB for the baseline, a 0.59 KB increase.

`cn` is a small slice of any single render, but two workloads make that slice matter. Server-side rendering of large pages rebuilds every class string per request against a cold cache. Client apps with frequent re-renders, like live grids, virtualized tables, and dashboards, recompute thousands of class names per frame. Both run `cn` in a tight loop on the critical path, where a 3x cut is visible. For static or repeated classes, the cache absorbs the work and both libraries sit within run-to-run noise.

See the [benchmark suite](./bench/README.md) for the full breakdown and the [architecture guide](../../docs/architecture.md) for how it works.

## Credits

cnfast adapts MIT-licensed code from [clsx](https://github.com/lukeed/clsx) (Luke Edwards) and [tailwind-merge](https://github.com/dcastil/tailwind-merge) (Dany Castillo). See [LICENSE](../../LICENSE).

## License

MIT

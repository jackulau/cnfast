# cnfast

[![version](https://img.shields.io/npm/v/cnfast?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/cnfast)
[![downloads](https://img.shields.io/npm/dt/cnfast.svg?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/cnfast)

Fast drop-in replacement for `cn`.

`cn` joins class values and resolves Tailwind conflicts in one call. cnfast keeps that behavior and output, and runs 1.3x to 4.1x faster across real-world workloads. An opt-in tagged-template form runs about 3x faster again. Output is byte-identical to `twMerge(clsx(...))`, verified against both upstream test suites and a differential fuzz harness over 30,127 real-world call groups.

```ts
import { cn } from "cnfast";

cn("px-2 py-1", isActive && "px-4", { "text-red-500": hasError });
// "py-1 px-4 text-red-500"
```

## Install

```bash
npm install cnfast
```

## Join and merge class names

`cn` accepts the same inputs as `clsx` (strings, numbers, arrays, and objects), joins them, then resolves Tailwind conflicts so the last utility in each group wins:

```ts
import { cn } from "cnfast";

cn("p-2", "p-4"); // "p-4"
cn("a", { b: true, c: false }); // "a b"
cn("text-sm", ["font-medium", null]); // "text-sm font-medium"
```

It replaces the common shadcn/ui helper with no behavior change:

```ts
// before
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// after
export { cn } from "cnfast";
```

## Tagged template form

`cn` also works as a tagged template. cnfast caches each call site by the template’s identity, so a re-render with the same interpolated strings returns the cached result without rebuilding or hashing the class string. On a stable call site this runs about 3x faster than the call form:

```ts
const active = true;
cn`px-2 px-4 ${active && "bg-blue-500"}`; // "px-4 bg-blue-500"
```

cnfast caches only string and falsy interpolations, since those cannot change between renders. Object and array interpolations resolve on every call, the same as the call form.

## Migrate an existing codebase

Run the migrate command at your project root to rewrite `clsx`, `classnames`, and `tailwind-merge` imports to cnfast:

```bash
npx cnfast migrate
```

The command prints a diff for every affected file and asks before writing. Useful flags:

- `--dry-run`: print the diffs without changing files
- `--yes`: apply changes without the confirmation prompt
- `--cwd <project_root_path>`: run against a directory other than the current one

## API reference

cnfast exports the full surface of the helper it replaces:

- **`cn(...inputs)`** and **``cn`...` ``**: join class values and resolve Tailwind conflicts
- **`clsx(...inputs)`**: join class values without conflict resolution
- **`twMerge(...classLists)`**: resolve conflicts in already-joined strings; `twMerge.mergeString(string)` skips the join step
- **`twJoin(...classLists)`**: join strings without `clsx`-style object or array handling

Exported types: `ClassValue`, `ClassDictionary`, `ClassNameValue`, and `ClassNameFunction`.

## Performance

cnfast matches `clsx` + `tailwind-merge` byte for byte and runs faster on the `cn` operation. The speedup depends on how often you reuse class tokens:

| Workload                          | cnfast vs clsx + tailwind-merge |
| --------------------------------- | ------------------------------- |
| Cold merge, unique class strings  | 3.2x to 4.1x                    |
| Cached re-render                  | 1.3x                            |
| Tagged template, stable call site | 9.0x                            |

Across 22 workloads the geometric mean is 2.61x. The bundle is 9.04 KB minified and gzipped, against 8.45 KB for `clsx` + `tailwind-merge`, because both ship the same Tailwind class-group data. See the [benchmark suite](./packages/fastcn/bench/README.md) for the full breakdown and how to reproduce it.

## How it works

cnfast caches at two levels (whole strings and individual tokens), interns conflict keys to integers, and tracks claimed groups with a generation-stamped array instead of a per-call allocation. The [architecture guide](./docs/architecture.md) explains each technique and where the speed comes from.

## Development

This is a pnpm monorepo built with [vite-plus](https://github.com/nicolo-ribaudo/vite-plus) and versioned with [changesets](https://github.com/changesets/changesets):

```bash
pnpm install
pnpm build
pnpm test    # parity and behavioral suites
pnpm lint
pnpm format
```

## Credits

cnfast adapts MIT-licensed code from [clsx](https://github.com/lukeed/clsx) (Luke Edwards) and [tailwind-merge](https://github.com/dcastil/tailwind-merge) (Dany Castillo). See [LICENSE](./LICENSE).

## License

MIT

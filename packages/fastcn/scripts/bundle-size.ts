import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const sourceEntry = fileURLToPath(new URL("../src/index.ts", import.meta.url));

interface BundleResult {
  label: string;
  minified: number;
  gzipped: number;
}

const measure = async (label: string, contents: string): Promise<BundleResult> => {
  const result = await build({
    stdin: {
      contents,
      resolveDir: fileURLToPath(new URL("..", import.meta.url)),
      loader: "ts",
    },
    bundle: true,
    minify: true,
    format: "esm",
    platform: "browser",
    write: false,
    legalComments: "none",
    treeShaking: true,
  });

  const code = result.outputFiles[0]!.contents;
  return {
    label,
    minified: code.byteLength,
    gzipped: gzipSync(code).byteLength,
  };
};

const formatBytes = (bytes: number): string => `${(bytes / 1024).toFixed(2)} kB`;

const fastcn = await measure("fastcn (cn)", `export { cn } from ${JSON.stringify(sourceEntry)};`);

const reference = await measure(
  "clsx + tailwind-merge (cn)",
  `import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...inputs) => twMerge(clsx(inputs));`,
);

console.table(
  [fastcn, reference].map((entry) => ({
    bundle: entry.label,
    minified: formatBytes(entry.minified),
    "min+gzip": formatBytes(entry.gzipped),
  })),
);

const gzipRatio = reference.gzipped / fastcn.gzipped;
const savedBytes = reference.gzipped - fastcn.gzipped;
console.log(
  `\nfastcn is ${formatBytes(savedBytes)} smaller gzipped (${gzipRatio.toFixed(1)}x smaller than clsx + tailwind-merge)`,
);

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  corpusWorkloads,
  gridWorkloads,
  microWorkloads,
  pageWorkloads,
} from "../bench/lib/workloads";
import { BEST_OF, TIME_MS, gitSha, runSuite, type WorkloadResult } from "../bench/lib/harness";
import { measureBundles } from "./lib/measure-bundle";
import { renderBenchChart, type BenchChartRow, type BenchReport } from "./lib/render-bench-chart";

const runtime = process.versions.bun
  ? `Bun ${process.versions.bun}`
  : `Node ${process.versions.node}`;

const geomean = (values: number[]): number => {
  if (values.length === 0) return Number.NaN;
  let logSum = 0;
  for (let index = 0; index < values.length; index++) logSum += Math.log(values[index]!);
  return Math.exp(logSum / values.length);
};

const find = (results: WorkloadResult[], group: string, nameIncludes: string): WorkloadResult => {
  const match = results.find(
    (result) => result.group === group && result.name.includes(nameIncludes),
  );
  if (!match) throw new Error(`missing workload: ${group}/${nameIncludes}`);
  return match;
};

const aggregate = (results: WorkloadResult[], group: string): WorkloadResult => {
  const rows = results.filter((result) => result.group === group);
  if (rows.length === 0) throw new Error(`no workloads in group: ${group}`);
  return {
    group,
    name: group,
    fastcn: geomean(rows.map((row) => row.fastcn)),
    reference: geomean(rows.map((row) => row.reference)),
    speedup: geomean(rows.map((row) => row.speedup)),
  };
};

const toRow = (
  result: WorkloadResult,
  label: string,
  detail: string,
  emphasis = false,
): BenchChartRow => ({
  label,
  detail,
  fastcn: result.fastcn,
  reference: result.reference,
  speedup: result.speedup,
  emphasis,
});

const workloads = [
  ...microWorkloads(),
  ...corpusWorkloads(),
  ...pageWorkloads(),
  ...gridWorkloads(),
];

const results = await runSuite(workloads, "chart");
const bundle = await measureBundles();

const overallSpeedup = geomean(
  results.map((result) => result.speedup).filter((value) => Number.isFinite(value)),
);

const rows: BenchChartRow[] = [
  toRow(find(results, "micro", "cached"), "Cached re-render", "repeated class strings, cache hits"),
  toRow(
    find(results, "micro", "merge engine"),
    "Merge engine (cold)",
    "unique strings, every call misses",
  ),
  toRow(aggregate(results, "corpus"), "Component corpus", "harvested app source, geomean"),
  toRow(aggregate(results, "page"), "Page render", "real call sequence, geomean"),
  toRow(find(results, "grid", "dynamic"), "Live data grid", "12K cells, live arbitrary values"),
  toRow(
    {
      group: "overall",
      name: "overall",
      fastcn: geomean(results.map((result) => result.fastcn)),
      reference: geomean(results.map((result) => result.reference)),
      speedup: overallSpeedup,
    },
    "Overall",
    `geometric mean of ${results.length} workloads`,
    true,
  ),
];

const report: BenchReport = {
  generatedAt: new Date().toISOString(),
  gitSha,
  runtime,
  bestOf: BEST_OF,
  timeMs: TIME_MS,
  workloadCount: results.length,
  overallSpeedup,
  bundle: { fastcnGzip: bundle.fastcn.gzipped, referenceGzip: bundle.reference.gzipped },
  rows,
};

const jsonPath = fileURLToPath(new URL("../bench/latest.json", import.meta.url));
const svgPath = fileURLToPath(new URL("../bench/chart.svg", import.meta.url));

writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(svgPath, await renderBenchChart(report));

console.log(`\nwrote ${jsonPath}`);
console.log(`wrote ${svgPath}`);

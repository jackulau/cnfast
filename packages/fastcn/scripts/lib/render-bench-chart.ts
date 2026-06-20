import * as vega from "vega";
import { compile, type TopLevelSpec } from "vega-lite";

export interface BenchChartRow {
  label: string;
  detail: string;
  fastcn: number;
  reference: number;
  speedup: number;
  emphasis?: boolean;
}

export interface BenchReport {
  generatedAt: string;
  gitSha: string;
  runtime: string;
  bestOf: number;
  timeMs: number;
  workloadCount: number;
  overallSpeedup: number;
  bundle: { fastcnGzip: number; referenceGzip: number };
  rows: BenchChartRow[];
}

const COLOR_BACKGROUND = "#000000";
const COLOR_TEXT = "#ffffff";
const COLOR_MUTED = "#8b8b8b";
const COLOR_FASTCN = "#22c55e";
const COLOR_REFERENCE = "#3f3f3f";

const formatKb = (bytes: number): string => `${(bytes / 1024).toFixed(2)} KB`;

const buildSpec = (report: BenchReport): TopLevelSpec => {
  const speedup = report.overallSpeedup;
  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    background: COLOR_BACKGROUND,
    width: 560,
    height: 96,
    padding: 18,
    title: {
      text: `cnfast is ${speedup.toFixed(2)}x faster than clsx + tailwind-merge`,
      subtitle: `geometric mean of ${report.workloadCount} workloads, byte-identical output, ${formatKb(report.bundle.fastcnGzip)} gzipped`,
      color: COLOR_TEXT,
      subtitleColor: COLOR_MUTED,
      fontSize: 17,
      subtitleFontSize: 12,
      anchor: "start",
      offset: 16,
    },
    data: {
      values: [
        { tool: "cnfast", speed: speedup, label: `${speedup.toFixed(2)}x`, color: COLOR_FASTCN },
        { tool: "clsx + tailwind-merge", speed: 1, label: "1.00x", color: COLOR_REFERENCE },
      ],
    },
    encoding: {
      y: {
        field: "tool",
        type: "nominal",
        sort: ["cnfast", "clsx + tailwind-merge"],
        axis: {
          title: null,
          labelColor: COLOR_TEXT,
          labelFontSize: 13,
          labelLimit: 220,
          domain: false,
          ticks: false,
        },
      },
      x: {
        field: "speed",
        type: "quantitative",
        scale: { domain: [0, Math.ceil(speedup * 1.15)] },
        axis: {
          title: "relative throughput (x)",
          titleColor: COLOR_MUTED,
          labelColor: COLOR_MUTED,
          grid: false,
          domainColor: COLOR_REFERENCE,
          tickColor: COLOR_REFERENCE,
        },
      },
    },
    layer: [
      {
        mark: { type: "bar", height: 30, cornerRadiusEnd: 4 },
        encoding: { color: { field: "color", type: "nominal", scale: null, legend: null } },
      },
      {
        mark: {
          type: "text",
          align: "left",
          dx: 8,
          fontSize: 14,
          fontWeight: "bold",
          color: COLOR_TEXT,
        },
        encoding: { text: { field: "label" } },
      },
    ],
    config: { view: { stroke: null } },
  };
};

// Deterministic: identical report -> byte-identical SVG (Vega's SVG renderer is pure, no clock,
// no randomness). CI regenerates and diffs the committed file safely.
export const renderBenchChart = async (report: BenchReport): Promise<string> => {
  const compiled = compile(buildSpec(report)).spec;
  const view = new vega.View(vega.parse(compiled), { renderer: "none" });
  return view.toSVG();
};

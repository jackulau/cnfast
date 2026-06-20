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
  overallSpeedup: number;
  bundle: { fastcnGzip: number; referenceGzip: number };
  rows: BenchChartRow[];
}

const WIDTH_PX = 760;
const PADDING_X_PX = 24;
const HEADER_HEIGHT_PX = 84;
const ROW_HEIGHT_PX = 52;
const BAR_HEIGHT_PX = 14;
const LABEL_WIDTH_PX = 210;
const FOOTER_HEIGHT_PX = 40;

const COLOR_BACKGROUND = "#000000";
const COLOR_TEXT = "#ffffff";
const COLOR_MUTED = "#8b8b8b";
const COLOR_FASTCN = "#22c55e";
const COLOR_REFERENCE = "#3f3f3f";
const COLOR_BASELINE = "#52525b";

const escapeXml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const formatOps = (ops: number): string => {
  if (ops >= 1_000_000) return `${(ops / 1_000_000).toFixed(1)}M ops/s`;
  if (ops >= 1_000) return `${(ops / 1_000).toFixed(0)}K ops/s`;
  return `${Math.round(ops)} ops/s`;
};

const formatKb = (bytes: number): string => `${(bytes / 1024).toFixed(2)} KB`;

// Pure, deterministic: identical report in -> byte-identical SVG out. No randomness, no clock,
// no layout that depends on font metrics. CI can regenerate and diff the file safely.
export const renderBenchChart = (report: BenchReport): string => {
  const rowCount = report.rows.length;
  const chartHeight = HEADER_HEIGHT_PX + rowCount * ROW_HEIGHT_PX + FOOTER_HEIGHT_PX;
  const barAreaX = PADDING_X_PX + LABEL_WIDTH_PX;
  const barAreaWidth = WIDTH_PX - barAreaX - PADDING_X_PX;

  let maxSpeedup = 1;
  for (let index = 0; index < rowCount; index++) {
    if (report.rows[index]!.speedup > maxSpeedup) maxSpeedup = report.rows[index]!.speedup;
  }
  const scale = barAreaWidth / (maxSpeedup * 1.12);

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH_PX}" height="${chartHeight}" viewBox="0 0 ${WIDTH_PX} ${chartHeight}" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif">`,
  );
  parts.push(
    `<rect width="${WIDTH_PX}" height="${chartHeight}" rx="12" fill="${COLOR_BACKGROUND}"/>`,
  );

  parts.push(
    `<text x="${PADDING_X_PX}" y="34" fill="${COLOR_TEXT}" font-size="19" font-weight="700">cnfast vs clsx + tailwind-merge</text>`,
  );
  parts.push(
    `<text x="${PADDING_X_PX}" y="58" fill="${COLOR_MUTED}" font-size="13">${escapeXml(`${report.overallSpeedup.toFixed(2)}x geometric mean speedup, byte-identical output`)}</text>`,
  );

  parts.push(
    `<rect x="${barAreaX}" y="70" width="11" height="11" rx="2" fill="${COLOR_FASTCN}"/>`,
    `<text x="${barAreaX + 17}" y="80" fill="${COLOR_MUTED}" font-size="12">cnfast</text>`,
    `<rect x="${barAreaX + 78}" y="70" width="11" height="11" rx="2" fill="${COLOR_REFERENCE}"/>`,
    `<text x="${barAreaX + 95}" y="80" fill="${COLOR_MUTED}" font-size="12">clsx + tailwind-merge</text>`,
  );

  const baselineX = barAreaX + scale;
  parts.push(
    `<line x1="${baselineX.toFixed(1)}" y1="${HEADER_HEIGHT_PX}" x2="${baselineX.toFixed(1)}" y2="${HEADER_HEIGHT_PX + rowCount * ROW_HEIGHT_PX}" stroke="${COLOR_BASELINE}" stroke-width="1" stroke-dasharray="3 3"/>`,
    `<text x="${baselineX.toFixed(1)}" y="${HEADER_HEIGHT_PX - 6}" fill="${COLOR_MUTED}" font-size="11" text-anchor="middle">1x</text>`,
  );

  for (let index = 0; index < rowCount; index++) {
    const row = report.rows[index]!;
    const rowTop = HEADER_HEIGHT_PX + index * ROW_HEIGHT_PX;
    const labelWeight = row.emphasis ? "700" : "500";
    const labelColor = row.emphasis ? COLOR_TEXT : "#d4d4d4";

    parts.push(
      `<text x="${PADDING_X_PX}" y="${rowTop + 20}" fill="${labelColor}" font-size="13" font-weight="${labelWeight}">${escapeXml(row.label)}</text>`,
      `<text x="${PADDING_X_PX}" y="${rowTop + 37}" fill="${COLOR_MUTED}" font-size="11">${escapeXml(row.detail)}</text>`,
    );

    const referenceWidth = scale;
    const fastcnWidth = row.speedup * scale;
    const barTop = rowTop + 8;
    parts.push(
      `<rect x="${barAreaX}" y="${barTop}" width="${referenceWidth.toFixed(1)}" height="${BAR_HEIGHT_PX}" rx="3" fill="${COLOR_REFERENCE}"/>`,
      `<rect x="${barAreaX}" y="${barTop + BAR_HEIGHT_PX + 4}" width="${fastcnWidth.toFixed(1)}" height="${BAR_HEIGHT_PX}" rx="3" fill="${COLOR_FASTCN}"/>`,
    );

    const speedupX = barAreaX + Math.max(fastcnWidth, referenceWidth) + 10;
    parts.push(
      `<text x="${speedupX.toFixed(1)}" y="${rowTop + 27}" fill="${COLOR_TEXT}" font-size="14" font-weight="700">${escapeXml(`${row.speedup.toFixed(2)}x`)}</text>`,
    );
  }

  const footerY = HEADER_HEIGHT_PX + rowCount * ROW_HEIGHT_PX + 24;
  const footer = `${formatKb(report.bundle.fastcnGzip)} gzipped vs ${formatKb(report.bundle.referenceGzip)} baseline  ·  ${report.runtime} best-of-${report.bestOf}  ·  ${report.gitSha}`;
  parts.push(
    `<text x="${PADDING_X_PX}" y="${footerY}" fill="${COLOR_MUTED}" font-size="11">${escapeXml(footer)}</text>`,
  );

  parts.push("</svg>");
  return `${parts.join("\n")}\n`;
};

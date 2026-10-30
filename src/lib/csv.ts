/**
 * Minimal, safe CSV serialiser for exports.
 * Cells starting with = + - @ are prefixed with an apostrophe to defuse spreadsheet formula injection.
 */
export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | boolean | Date | null | undefined;
}

function escapeCell(raw: string | number | boolean | Date | null | undefined): string {
  if (raw === null || raw === undefined) return "";
  let value = raw instanceof Date ? raw.toISOString() : String(raw);
  if (typeof raw === "string" && /^[=+\-@\t\r]/.test(value) && !/^-?\d+(\.\d+)?$/.test(value)) {
    value = `'${value}`;
  }
  if (/[",\n\r]/.test(value)) value = `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCell(c.header)).join(",");
  const body = rows.map((row) => columns.map((c) => escapeCell(c.value(row))).join(","));
  // BOM so Excel opens UTF-8 (₹, accented names) correctly.
  return `\uFEFF${[header, ...body].join("\r\n")}\r\n`;
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
      "Cache-Control": "no-store",
    },
  });
}

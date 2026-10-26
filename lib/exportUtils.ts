// CSV needs no library — build it directly.
export function exportToCSV(rows: Record<string, any>[], filename: string) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (val: any) => {
    const str = String(val ?? "");
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const csv = [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))].join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`);
}

// XLSX uses the `xlsx` (SheetJS) package — see package.json.
export async function exportToXLSX(rows: Record<string, any>[], filename: string, sheetName = "Sheet1") {
  if (!rows || rows.length === 0) return;
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// One Excel file with several sheets (used by the dashboard's "Download report").
// Each sheet is a list of rows; the first row's keys become the column headings.
export async function exportWorkbook(sheets: { name: string; rows: Record<string, any>[] }[], filename: string) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const rows = sheet.rows.length > 0 ? sheet.rows : [{ Note: "No data for this period." }];
    const ws = XLSX.utils.json_to_sheet(rows);
    // Column widths that fit the longest value in each column (capped).
    const headers = Object.keys(rows[0]);
    ws["!cols"] = headers.map((h) => ({
      wch: Math.min(60, Math.max(h.length, ...rows.map((r) => String(r[h] ?? "").length)) + 2)
    }));
    // Sheet names: max 31 characters, none of : \ / ? * [ ]
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.replace(/[:\\\/?*[\]]/g, " ").slice(0, 31));
  }
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

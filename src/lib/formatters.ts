/**
 * Format number to Indonesian Rupiah string
 * Example: 4800000 -> "Rp 4.800.000" (no unnecessary ,00)
 */
export function formatRupiah(amount: number | undefined | null, withPrefix = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return withPrefix ? "Rp 0" : "0";
  }

  // Rounded to whole rupiah without ,00 as requested
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  const integerPart = absAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  const formatted = `${isNegative ? "-" : ""}${integerPart}`;
  return withPrefix ? `Rp ${formatted}` : formatted;
}

/**
 * Format standard number without Rp
 * Example: 4800000 -> "4.800.000"
 */
export function formatNumberIndo(amount: number | undefined | null): string {
  return formatRupiah(amount, false);
}

/**
 * Parses Indonesian currency string or raw number string to float
 */
export function parseNumberIndo(val: string | number): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  // Strip Rp, spaces, replace '.' with nothing, replace ',' with '.'
  const clean = val
    .replace(/Rp\s?/g, "")
    .replace(/\s+/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Format Date to DD/MM/YYYY (e.g. "07/11/2026")
 */
export function formatDateDDMMYYYY(date: Date | string | undefined | null): string {
  if (!date) return "";

  if (typeof date === "string") {
    const trimmed = date.trim();
    // Case 1: Already DD/MM/YYYY or D/M/YYYY
    const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const day = slashMatch[1].padStart(2, "0");
      const month = slashMatch[2].padStart(2, "0");
      const year = slashMatch[3];
      return `${day}/${month}/${year}`;
    }
    // Case 2: YYYY-MM-DD or YYYY-M-D
    const dashMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (dashMatch) {
      const year = dashMatch[1];
      const month = dashMatch[2].padStart(2, "0");
      const day = dashMatch[3].padStart(2, "0");
      return `${day}/${month}/${year}`;
    }
  }

  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return String(date);
  }
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format DD/MM/YYYY back to YYYY-MM-DD for HTML <input type="date">
 */
export function toInputDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "";
  const trimmed = dateStr.trim();
  // If DD/MM/YYYY or D/M/YYYY -> YYYY-MM-DD
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, "0");
    const month = slashMatch[2].padStart(2, "0");
    const year = slashMatch[3];
    return `${year}-${month}-${day}`;
  }
  // If already YYYY-MM-DD
  const dashMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dashMatch) {
    return `${dashMatch[1]}-${dashMatch[2]}-${dashMatch[3]}`;
  }
  return dateStr;
}

/**
 * Calculate date by adding N days to a DD/MM/YYYY date string
 */
export function addDaysToDDMMYYYY(dateStr: string, days: number): string {
  if (!dateStr) return "";
  const parts = dateStr.trim().split("/");
  let d: Date;
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    d = new Date(year, month, day);
  } else {
    d = new Date(dateStr);
  }
  if (isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + days);
  return formatDateDDMMYYYY(d);
}

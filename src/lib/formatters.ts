/**
 * Format number to Indonesian Rupiah string
 * Example: 4800000 -> "Rp 4.800.000,00"
 */
export function formatRupiah(amount: number | undefined | null, withPrefix = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return withPrefix ? "Rp 0,00" : "0,00";
  }

  const parts = Math.abs(amount).toFixed(2).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const decimalPart = parts[1];

  const formatted = `${amount < 0 ? "-" : ""}${integerPart},${decimalPart}`;
  return withPrefix ? `Rp ${formatted}` : formatted;
}

/**
 * Format standard number without Rp
 * Example: 4800000 -> "4.800.000,00"
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

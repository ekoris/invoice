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
 * Format Date to DD/MM/YYYY
 */
export function formatDateDDMMYYYY(date: Date | string): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    // If it's already in DD/MM/YYYY format
    if (typeof date === "string" && date.includes("/")) return date;
    return "";
  }
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format DD/MM/YYYY back to YYYY-MM-DD for HTML date inputs
 */
export function toInputDate(dateStr: string): string {
  if (!dateStr) return "";
  if (dateStr.includes("-") && dateStr.split("-").length === 3) {
    return dateStr;
  }
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      // parts[0] is day, parts[1] is month, parts[2] is year
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
  }
  return dateStr;
}

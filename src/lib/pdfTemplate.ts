import fs from "fs";
import path from "path";
import { InvoiceData } from "./types";
import { formatNumberIndo, formatRupiah, formatDateDDMMYYYY } from "./formatters";

/**
 * Convert local asset or public path to base64 data URI
 */
function getBase64Image(filePathOrUrl?: string | null): string {
  if (!filePathOrUrl) return "";
  if (filePathOrUrl.startsWith("data:")) return filePathOrUrl;

  try {
    // If it's a relative path in public directory (e.g. /assets/default-logo.png)
    const cleanPath = filePathOrUrl.startsWith("/")
      ? filePathOrUrl.slice(1)
      : filePathOrUrl;
    const fullPath = path.join(process.cwd(), "public", cleanPath);

    if (fs.existsSync(fullPath)) {
      const ext = path.extname(fullPath).slice(1) || "png";
      const buffer = fs.readFileSync(fullPath);
      return `data:image/${ext};base64,${buffer.toString("base64")}`;
    }
  } catch (e) {
    console.error("Error reading image for PDF:", e);
  }

  return filePathOrUrl;
}

export function generateInvoiceHtml(invoice: InvoiceData): string {
  const logoDataUri = getBase64Image(invoice.companyLogo);
  const signatureDataUri = getBase64Image(invoice.signatureImage);

  const itemsHtml = (invoice.items || [])
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 14px 16px; font-weight: 600; color: #0f172a; vertical-align: top; font-size: 13px;">
          ${escapeHtml(item.product)}
        </td>
        <td style="padding: 14px 16px; color: #475569; font-size: 12px; line-height: 1.5; vertical-align: top;">
          ${escapeHtml(item.description || "")}
        </td>
        <td style="padding: 14px 16px; text-align: center; font-weight: 600; color: #0f172a; vertical-align: top; font-size: 13px;">
          ${item.quantity}
        </td>
        <td style="padding: 14px 16px; text-align: right; font-weight: 500; color: #0f172a; vertical-align: top; font-size: 13px; white-space: nowrap;">
          ${formatNumberIndo(item.unitPrice)}
        </td>
        <td style="padding: 14px 16px; text-align: right; font-weight: 700; color: #0f172a; vertical-align: top; font-size: 13px; white-space: nowrap;">
          ${formatNumberIndo(item.amount)}
        </td>
      </tr>
    `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(invoice.title || "Invoice")} - ${escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #0f172a;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.4;
    }
    .invoice-container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
    }
    .logo-container {
      width: 220px;
    }
    .logo-container img {
      max-width: 180px;
      max-height: 65px;
      object-fit: contain;
    }
    .invoice-title-block {
      text-align: right;
    }
    .invoice-title {
      font-size: 38px;
      font-weight: 800;
      color: #5b5bf0;
      margin: 0 0 12px 0;
      letter-spacing: -0.5px;
    }
    .meta-table {
      margin-left: auto;
      border-collapse: collapse;
      font-size: 12.5px;
    }
    .meta-table td {
      padding: 2.5px 0;
    }
    .meta-label {
      color: #475569;
      text-align: right;
      padding-right: 24px !important;
      font-weight: 400;
    }
    .meta-val {
      font-weight: 700;
      color: #0f172a;
      text-align: right;
      min-width: 90px;
    }

    .two-col {
      display: flex;
      justify-content: space-between;
      gap: 30px;
      margin-bottom: 24px;
    }
    .info-box {
      flex: 1;
    }
    .info-title {
      font-size: 13.5px;
      font-weight: 800;
      color: #0f172a;
      padding-bottom: 5px;
      border-bottom: 2px solid #0f172a;
      margin-bottom: 8px;
    }
    .info-name {
      font-size: 14.5px;
      font-weight: 800;
      color: #4338ca;
      margin-bottom: 3px;
    }
    .info-line {
      font-size: 12px;
      color: #334155;
      margin-bottom: 3px;
      line-height: 1.45;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }
    .items-table thead tr {
      background-color: #242b47 !important;
      color: #ffffff !important;
    }
    .items-table th {
      padding: 10px 16px;
      font-size: 12px;
      font-weight: 700;
      text-align: left;
      border: none;
    }

    .bottom-section {
      display: flex;
      justify-content: space-between;
      gap: 30px;
      margin-top: 24px;
    }
    .notes-section {
      flex: 1.3;
    }
    .notes-label {
      font-size: 13px;
      font-weight: 700;
      color: #4338ca;
      margin-bottom: 6px;
    }
    .notes-box {
      border: 1px solid #1e293b;
      padding: 12px 14px;
      min-height: 90px;
      font-size: 12px;
      color: #1e293b;
      line-height: 1.5;
      border-radius: 2px;
      background: #ffffff;
    }

    .totals-section {
      flex: 0.9;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 6px;
      color: #334155;
    }
    .totals-row.total-main {
      border-top: 1px solid #cbd5e1;
      padding-top: 10px;
      margin-top: 6px;
      margin-bottom: 0;
      align-items: baseline;
    }
    .total-label {
      font-size: 22px;
      font-weight: 900;
      text-decoration: underline;
      color: #0f172a;
    }
    .total-val {
      font-size: 24px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
    }

    .signature-row {
      display: flex;
      justify-content: flex-end;
      margin-top: 40px;
    }
    .signature-box {
      width: 200px;
      text-align: right;
    }
    .signature-title {
      font-size: 12.5px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .signature-img {
      max-width: 140px;
      max-height: 60px;
      margin: 4px 0 6px auto;
      display: block;
      object-fit: contain;
    }
    .signer-name {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      border-top: 1px solid #cbd5e1;
      padding-top: 4px;
      display: inline-block;
      width: 100%;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header-row">
      <div class="logo-container">
        ${
          logoDataUri
            ? `<img src="${logoDataUri}" alt="Logo">`
            : `<div style="font-size: 20px; font-weight: 800; color: #4338ca;">${escapeHtml(invoice.companyName)}</div>`
        }
      </div>
      <div class="invoice-title-block">
        <h1 class="invoice-title">${escapeHtml(invoice.title || "Invoice")}</h1>
        <table class="meta-table">
          <tr>
            <td class="meta-label">Referensi</td>
            <td class="meta-val">${escapeHtml(invoice.invoiceNumber)}</td>
          </tr>
          <tr>
            <td class="meta-label">Tanggal</td>
            <td class="meta-val">${escapeHtml(formatDateDDMMYYYY(invoice.issueDate))}</td>
          </tr>
          <tr>
            <td class="meta-label">Tgl. Jatuh Tempo</td>
            <td class="meta-val">${escapeHtml(formatDateDDMMYYYY(invoice.dueDate))}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Two columns info -->
    <div class="two-col">
      <div class="info-box">
        <div class="info-title">Informasi Perusahaan</div>
        <div class="info-name">${escapeHtml(invoice.companyName)}</div>
        ${invoice.companyAddress ? `<div class="info-line">${escapeHtml(invoice.companyAddress)}</div>` : ""}
        ${invoice.companyPhone ? `<div class="info-line"><strong>Telp:</strong> ${escapeHtml(invoice.companyPhone)}</div>` : ""}
        ${invoice.companyEmail ? `<div class="info-line"><strong>Email:</strong> ${escapeHtml(invoice.companyEmail)}</div>` : ""}
      </div>

      <div class="info-box">
        <div class="info-title">Tagihan Kepada</div>
        <div class="info-name">${escapeHtml(invoice.clientName)}</div>
        ${invoice.clientAddress ? `<div class="info-line">${escapeHtml(invoice.clientAddress)}</div>` : ""}
        ${invoice.clientPhone ? `<div class="info-line"><strong>Telp:</strong> ${escapeHtml(invoice.clientPhone)}</div>` : ""}
        ${invoice.clientEmail ? `<div class="info-line"><strong>Email:</strong> ${escapeHtml(invoice.clientEmail)}</div>` : ""}
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 28%;">Produk</th>
          <th style="width: 42%;">Deskripsi</th>
          <th style="width: 10%; text-align: center;">Kuantitas</th>
          <th style="width: 10%; text-align: right;">Harga</th>
          <th style="width: 10%; text-align: right;">Jumlah</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Bottom Section: Notes & Totals -->
    <div class="bottom-section">
      <div class="notes-section">
        <div class="notes-label">Pesan</div>
        <div class="notes-box">
          ${escapeHtml(invoice.notes || "Kirim ke Rekening BCA a.n Eko Rismaryanto no. rek 4560962725")}
        </div>
      </div>

      <div class="totals-section">
        <div class="totals-row">
          <span style="font-weight: 600;">Subtotal</span>
          <span style="font-weight: 600; color: #0f172a;">${formatRupiah(invoice.subtotal)}</span>
        </div>
        ${
          invoice.discount
            ? `<div class="totals-row" style="color: #e11d48;">
                <span>Diskon</span>
                <span>- ${formatRupiah(invoice.discount)}</span>
              </div>`
            : ""
        }
        ${
          invoice.taxAmount
            ? `<div class="totals-row">
                <span>Pajak (${invoice.taxPercent}%)</span>
                <span>+ ${formatRupiah(invoice.taxAmount)}</span>
              </div>`
            : ""
        }
        <div class="totals-row total-main">
          <span class="total-label">Total</span>
          <span class="total-val">${formatRupiah(invoice.total)}</span>
        </div>
      </div>
    </div>

    <!-- Signature -->
    <div class="signature-row">
      <div class="signature-box">
        <div class="signature-title">${escapeHtml(invoice.signatureTitle || "Hormat Kami,")}</div>
        ${
          signatureDataUri
            ? `<img src="${signatureDataUri}" class="signature-img" alt="Tanda Tangan">`
            : `<div style="height: 50px;"></div>`
        }
        ${
          invoice.signatureName
            ? `<div class="signer-name">${escapeHtml(invoice.signatureName)}</div>`
            : ""
        }
      </div>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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
        <td style="padding: 12px 14px; font-weight: 600; color: #0f172a; vertical-align: top; font-size: 12.5px;">
          ${escapeHtml(item.product)}
        </td>
        <td style="padding: 12px 14px; color: #475569; font-size: 11.5px; line-height: 1.45; vertical-align: top;">
          ${escapeHtml(item.description || "")}
        </td>
        <td style="padding: 12px 14px; text-align: center; font-weight: 600; color: #0f172a; vertical-align: top; font-size: 12.5px;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 14px; text-align: right; font-weight: 500; color: #0f172a; vertical-align: top; font-size: 12.5px; white-space: nowrap;">
          ${formatRupiah(item.unitPrice)}
        </td>
        <td style="padding: 12px 14px; text-align: right; font-weight: 700; color: #0f172a; vertical-align: top; font-size: 12.5px; white-space: nowrap;">
          ${formatRupiah(item.amount)}
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
      max-width: 160px;
      max-height: 50px;
      object-fit: contain;
    }
    .invoice-title-block {
      text-align: right;
    }
    .invoice-title {
      font-size: 26px;
      font-weight: 700;
      color: #6348f9;
      margin: 0 0 8px 0;
      letter-spacing: -0.3px;
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

    .contract-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 14px;
      margin-top: 14px;
    }
    .contract-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 6px;
      margin-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11.5px;
      font-weight: 700;
      color: #0f172a;
    }
    .contract-badge {
      background: #eef2ff;
      color: #4338ca;
      border: 1px solid #c7d2fe;
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 10px;
      font-weight: 600;
    }
    .contract-grid {
      display: flex;
      gap: 12px;
    }
    .contract-col {
      flex: 1;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 8px 10px;
    }
    .contract-col-label {
      font-size: 10.5px;
      color: #64748b;
      margin-bottom: 3px;
    }
    .contract-col-val {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
    }
    .contract-col-val.highlight {
      color: #6348f9;
    }

    .bottom-section {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-top: 16px;
    }
    .left-section {
      flex: 1.25;
    }
    .payment-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 14px;
      margin-bottom: 10px;
    }
    .payment-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
    }
    .payment-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      font-size: 11.5px;
    }
    .payment-item {
      width: 46%;
    }
    .payment-item-label {
      font-size: 10px;
      color: #64748b;
    }
    .payment-item-val {
      font-weight: 700;
      color: #0f172a;
    }
    .payment-item-val.acc-num {
      font-family: monospace;
      font-size: 12.5px;
      letter-spacing: 0.5px;
    }
    .payment-subnote {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 6px;
      line-height: 1.35;
    }

    .notes-box {
      border: 1px solid #e2e8f0;
      padding: 10px 12px;
      font-size: 11.5px;
      color: #334155;
      line-height: 1.45;
      border-radius: 6px;
      background: #f8fafc;
    }
    .notes-box-title {
      font-weight: 700;
      font-size: 11px;
      color: #0f172a;
      margin-bottom: 3px;
    }

    .totals-section {
      flex: 0.95;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      background: #fafafa;
      border: 1px solid #f1f5f9;
      border-radius: 6px;
      padding: 12px 14px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 6px;
      color: #475569;
    }
    .totals-row.total-main {
      border-top: 1px solid #cbd5e1;
      padding-top: 8px;
      margin-top: 6px;
      margin-bottom: 0;
      align-items: baseline;
    }
    .total-label {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      text-decoration: none !important;
    }
    .total-val {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.3px;
    }
    .tax-status-note {
      font-size: 9.5px;
      color: #64748b;
      font-style: italic;
      text-align: right;
      margin-top: 6px;
    }

    .signature-row {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
    }
    .signature-box {
      width: 220px;
      text-align: right;
    }
    .signature-title {
      font-size: 12px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 2px;
    }
    .signature-img {
      max-width: 140px;
      max-height: 52px;
      margin: 2px 0 4px auto;
      display: block;
      object-fit: contain;
    }
    .signer-name {
      font-size: 12.5px;
      font-weight: 700;
      color: #0f172a;
      border-top: 1px solid #cbd5e1;
      padding-top: 3px;
      display: inline-block;
      width: 100%;
    }
    .signer-role {
      font-size: 11px;
      color: #475569;
      margin-top: 1px;
    }

    .invoice-footer {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      font-size: 10.5px;
      color: #64748b;
      line-height: 1.45;
    }
    .footer-grid {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 10px;
    }
    .footer-col {
      flex: 1;
    }
    .footer-col-right {
      flex: 1;
      text-align: right;
    }
    .footer-title {
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #334155;
      margin-bottom: 4px;
    }
    .footer-thanks {
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px dashed #cbd5e1;
      font-style: italic;
      color: #6348f9;
      font-weight: 600;
      font-size: 11px;
    }
    .footer-bar {
      border-top: 1px solid #f1f5f9;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      font-size: 9.5px;
      color: #94a3b8;
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
          <th style="width: 8%; text-align: center;">Kuantitas</th>
          <th style="width: 11%; text-align: right;">Harga</th>
          <th style="width: 11%; text-align: right;">Jumlah</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Rincian Kontrak & Termin Pembayaran (Jika Ada) -->
    ${
      invoice.contractTotal && invoice.contractTotal > 0
        ? `
      <div class="contract-box">
        <div class="contract-header">
          <span>Rincian Kontrak & Termin Pembayaran</span>
          <span class="contract-badge">${escapeHtml(invoice.contractTerm || "Termin I (DP 30%)")}</span>
        </div>
        <div class="contract-grid">
          <div class="contract-col">
            <div class="contract-col-label">Total Nilai Kontrak</div>
            <div class="contract-col-val">${formatRupiah(invoice.contractTotal)}</div>
          </div>
          <div class="contract-col">
            <div class="contract-col-label">Tagihan Termin Ini</div>
            <div class="contract-col-val highlight">${formatRupiah(invoice.total)}</div>
          </div>
          <div class="contract-col">
            <div class="contract-col-label">Sisa Pembayaran Kontrak</div>
            <div class="contract-col-val">${formatRupiah(
              invoice.contractRemaining ??
                Math.max(
                  0,
                  (invoice.contractTotal || 0) -
                    ((invoice.contractPaid || 0) + invoice.total)
                )
            )}</div>
          </div>
        </div>
      </div>
    `
        : ""
    }

    <!-- Bottom Section: Payment Info, Notes & Totals -->
    <div class="bottom-section">
      <div class="left-section">
        <!-- Informasi Pembayaran -->
        <div class="payment-box">
          <div class="payment-title">Informasi Pembayaran (Transfer Bank)</div>
          <div class="payment-grid">
            <div class="payment-item">
              <div class="payment-item-label">Bank Tujuan</div>
              <div class="payment-item-val">${escapeHtml(invoice.bankName || "Bank Central Asia (BCA)")}</div>
            </div>
            <div class="payment-item">
              <div class="payment-item-label">Atas Nama</div>
              <div class="payment-item-val">${escapeHtml(invoice.bankHolder || "Eko Rismaryanto")}</div>
            </div>
            <div class="payment-item">
              <div class="payment-item-label">Nomor Rekening</div>
              <div class="payment-item-val acc-num">${escapeHtml(invoice.bankAccount || "4560962725")}</div>
            </div>
            <div class="payment-item">
              <div class="payment-item-label">Berita Transfer</div>
              <div class="payment-item-val">${escapeHtml(invoice.invoiceNumber)}</div>
            </div>
          </div>
          <div class="payment-subnote">
            * Harap cantumkan referensi invoice <strong>${escapeHtml(invoice.invoiceNumber)}</strong> pada keterangan transfer.
          </div>
        </div>

        <!-- Catatan Khusus (Jika Ada) -->
        ${
          invoice.notes
            ? `
          <div class="notes-box">
            <div class="notes-box-title">Catatan Khusus:</div>
            <div>${escapeHtml(invoice.notes)}</div>
          </div>
        `
            : ""
        }
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
        <div class="totals-row">
          <span>Pajak (PPN ${invoice.taxPercent ? invoice.taxPercent + "%" : "0% Non-PKP"})</span>
          <span style="color: #0f172a;">${
            invoice.taxAmount && invoice.taxAmount > 0
              ? `+ ${formatRupiah(invoice.taxAmount)}`
              : "Rp 0"
          }</span>
        </div>
        <div class="totals-row total-main">
          <span class="total-label">Total</span>
          <span class="total-val">${formatRupiah(invoice.total)}</span>
        </div>
        <div class="tax-status-note">
          * ${escapeHtml(invoice.taxNote || "Bukan Pengusaha Kena Pajak (Non-PKP) — Harga tidak dikenakan PPN.")}
        </div>
      </div>
    </div>

    <!-- Signature -->
    <div class="signature-row">
      <div class="signature-box">
        <div class="signature-title">${escapeHtml(invoice.signatureTitle || "Hormat Kami,")}</div>
        ${
          invoice.showSignature !== false && signatureDataUri
            ? `<img src="${signatureDataUri}" class="signature-img" alt="Tanda Tangan">`
            : `<div style="height: 38px;"></div>`
        }
        ${
          invoice.signatureName
            ? `<div class="signer-name">${escapeHtml(invoice.signatureName)}</div>`
            : ""
        }
        <div class="signer-role">${escapeHtml(invoice.signerRole || "Pemilik, Lingkara Labs")}</div>
      </div>
    </div>

    <!-- Footer: Syarat & Ketentuan, Helpdesk, Ucapan Terima Kasih -->
    <div class="invoice-footer">
      <div class="footer-grid">
        <div class="footer-col">
          <div class="footer-title">Syarat & Ketentuan Pembayaran</div>
          <div>
            ${
              invoice.termsConditions
                ? escapeHtml(invoice.termsConditions).replace(/\n/g, "<br>")
                : `1. Pembayaran ditransfer sesuai data rekening di atas.<br>
                   2. Pembayaran dianggap sah jika dana telah masuk ke rekening penyedia jasa.<br>
                   3. Harap konfirmasikan bukti pembayaran ke WhatsApp (${escapeHtml(invoice.companyPhone || "")}).<br>
                   4. Keterlambatan pembayaran termin dapat menangguhkan kelanjutan jadwal pengerjaan sistem.`
            }
          </div>
        </div>
        <div class="footer-col-right">
          <div class="footer-title">Bantuan & Konfirmasi</div>
          <div>
            ${
              invoice.helpContact
                ? escapeHtml(invoice.helpContact).replace(/\n/g, "<br>")
                : `WhatsApp: <strong>${escapeHtml(invoice.companyPhone || "082377673248")}</strong><br>
                   Email: <strong>${escapeHtml(invoice.companyEmail || "eko.rismaryanto15@gmail.com")}</strong>`
            }
          </div>
          <div class="footer-thanks">
            &ldquo;${escapeHtml(
              invoice.thankYouNote ||
                `Terima kasih atas kerja sama dan kepercayaan Anda bersama ${invoice.companyName || "Lingkara Labs"}.`
            )}&rdquo;
          </div>
        </div>
      </div>
      <div class="footer-bar">
        <span>Invoice Ref: ${escapeHtml(invoice.invoiceNumber)}</span>
        <span>Sistem Invoice Digital Lingkara Labs</span>
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

import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import { prisma } from "@/lib/prisma";
import { generateInvoiceHtml } from "@/lib/pdfTemplate";
import { InvoiceData } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
    }

    const html = generateInvoiceHtml(invoice as unknown as InvoiceData);

    const executablePath =
      process.env.CHROME_BIN || "/usr/bin/google-chrome-stable" || "/usr/bin/google-chrome";

    const browser = await puppeteer.launch({
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    await browser.close();

    const safeNumber = (invoice.invoiceNumber || "INVOICE").replace(/[\/\\]/g, "-");
    const filename = `${safeNumber}.pdf`;

    return new Response(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Gagal membuat dokumen PDF: " + String(error) },
      { status: 500 }
    );
  }
}

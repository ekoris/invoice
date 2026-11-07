"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { InvoiceData, InvoiceStatus, ClientData, CompanyProfileData, BankAccountData } from "./types";

export async function getInvoices(filters?: {
  query?: string;
  status?: string;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.status && filters.status !== "ALL") {
    where.status = filters.status;
  }

  if (filters?.query && filters.query.trim() !== "") {
    const q = filters.query.trim();
    where.OR = [
      { invoiceNumber: { contains: q } },
      { clientName: { contains: q } },
      { companyName: { contains: q } },
      { notes: { contains: q } },
    ];
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return invoices;
}

export async function getInvoiceById(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return invoice;
}

export async function getNextInvoiceNumber() {
  const latest = await prisma.invoice.findFirst({
    orderBy: { createdAt: "desc" },
    select: { invoiceNumber: true },
  });

  if (!latest || !latest.invoiceNumber) {
    return "INV/00001";
  }

  const match = latest.invoiceNumber.match(/INV\/(\d+)/i);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `INV/${String(nextNum).padStart(5, "0")}`;
  }

  return `INV/${Date.now().toString().slice(-5)}`;
}

export async function createInvoice(data: InvoiceData) {
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: data.invoiceNumber,
      title: data.title || "Invoice",
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      status: data.status || "DRAFT",
      
      companyName: data.companyName,
      companyAddress: data.companyAddress || null,
      companyPhone: data.companyPhone || null,
      companyEmail: data.companyEmail || null,
      companyLogo: data.companyLogo || null,

      clientId: data.clientId || null,
      clientName: data.clientName,
      clientAddress: data.clientAddress || null,
      clientPhone: data.clientPhone || null,
      clientEmail: data.clientEmail || null,

      subtotal: data.subtotal,
      taxPercent: data.taxPercent || 0,
      taxAmount: data.taxAmount || 0,
      discount: data.discount || 0,
      total: data.total,

      contractTotal: Number(data.contractTotal) || 0,
      contractTerm: data.contractTerm || "Termin I (DP 30%)",
      contractPaid: Number(data.contractPaid) || 0,
      contractRemaining: Number(data.contractRemaining) || 0,

      bankName: data.bankName || "Bank Central Asia (BCA)",
      bankAccount: data.bankAccount || "4560962725",
      bankHolder: data.bankHolder || "Eko Rismaryanto",
      transferNote: data.transferNote || "Cantumkan nomor invoice pada berita transfer",

      taxNote: data.taxNote || "Bukan PKP (Harga tidak dikenakan PPN)",
      termsConditions: data.termsConditions || "1. Pembayaran ditransfer sesuai data rekening di atas.\n2. Harap konfirmasi bukti transfer via WhatsApp/Email resmi.\n3. Keterlambatan termin dapat menunda jadwal pengerjaan sistem.",

      notes: data.notes || null,
      signatureImage: data.signatureImage || null,
      signatureTitle: data.signatureTitle || "Hormat Kami,",
      signatureName: data.signatureName || null,
      signerRole: data.signerRole || "Pemilik, Lingkara Labs",
      showSignature: data.showSignature !== undefined ? data.showSignature : true,

      items: {
        create: data.items.map((item, idx) => ({
          product: item.product,
          description: item.description || null,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          amount: Number(item.amount) || 0,
          sortOrder: idx,
        })),
      },
    },
    include: {
      items: true,
    },
  });

  revalidatePath("/");
  revalidatePath("/invoices");
  return invoice;
}

export async function updateInvoice(id: string, data: InvoiceData) {
  // Delete existing items and recreate
  await prisma.invoiceItem.deleteMany({
    where: { invoiceId: id },
  });

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      invoiceNumber: data.invoiceNumber,
      title: data.title || "Invoice",
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      status: data.status,

      companyName: data.companyName,
      companyAddress: data.companyAddress || null,
      companyPhone: data.companyPhone || null,
      companyEmail: data.companyEmail || null,
      companyLogo: data.companyLogo || null,

      clientId: data.clientId || null,
      clientName: data.clientName,
      clientAddress: data.clientAddress || null,
      clientPhone: data.clientPhone || null,
      clientEmail: data.clientEmail || null,

      subtotal: data.subtotal,
      taxPercent: data.taxPercent || 0,
      taxAmount: data.taxAmount || 0,
      discount: data.discount || 0,
      total: data.total,

      contractTotal: Number(data.contractTotal) || 0,
      contractTerm: data.contractTerm || "Termin I (DP 30%)",
      contractPaid: Number(data.contractPaid) || 0,
      contractRemaining: Number(data.contractRemaining) || 0,

      bankName: data.bankName || "Bank Central Asia (BCA)",
      bankAccount: data.bankAccount || "4560962725",
      bankHolder: data.bankHolder || "Eko Rismaryanto",
      transferNote: data.transferNote || "Cantumkan nomor invoice pada berita transfer",

      taxNote: data.taxNote || "Bukan PKP (Harga tidak dikenakan PPN)",
      termsConditions: data.termsConditions || "1. Pembayaran ditransfer sesuai data rekening di atas.\n2. Harap konfirmasi bukti transfer via WhatsApp/Email resmi.\n3. Keterlambatan termin dapat menunda jadwal pengerjaan sistem.",

      notes: data.notes || null,
      signatureImage: data.signatureImage || null,
      signatureTitle: data.signatureTitle || "Hormat Kami,",
      signatureName: data.signatureName || null,
      signerRole: data.signerRole || "Pemilik, Lingkara Labs",
      showSignature: data.showSignature !== undefined ? data.showSignature : true,

      items: {
        create: data.items.map((item, idx) => ({
          product: item.product,
          description: item.description || null,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          amount: Number(item.amount) || 0,
          sortOrder: idx,
        })),
      },
    },
    include: {
      items: true,
    },
  });

  revalidatePath("/");
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  return invoice;
}

export async function deleteInvoice(id: string) {
  await prisma.invoice.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/invoices");
  return { success: true };
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
  const invoice = await prisma.invoice.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/");
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  return invoice;
}

// Client actions
export async function getClients() {
  return await prisma.client.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createClient(data: ClientData) {
  const client = await prisma.client.create({
    data: {
      name: data.name,
      address: data.address || null,
      phone: data.phone || null,
      email: data.email || null,
    },
  });
  revalidatePath("/clients");
  return client;
}

export async function updateClient(id: string, data: ClientData) {
  const client = await prisma.client.update({
    where: { id },
    data: {
      name: data.name,
      address: data.address || null,
      phone: data.phone || null,
      email: data.email || null,
    },
  });
  revalidatePath("/clients");
  return client;
}

export async function deleteClient(id: string) {
  await prisma.client.delete({
    where: { id },
  });
  revalidatePath("/clients");
  return { success: true };
}

// Company Profile actions
export async function getCompanyProfile(): Promise<CompanyProfileData> {
  let profile = await prisma.companyProfile.findUnique({
    where: { id: "default" },
  });

  if (!profile) {
    profile = await prisma.companyProfile.create({
      data: {
        id: "default",
        name: "Lingkara Labs",
        address: "Dsn Babadan, Bantul, Bantul, DIY",
        phone: "082377673248",
        email: "eko.rismaryanto15@gmail.com",
        logoUrl: "/assets/default-logo.png",
        signatureUrl: "/assets/default-signature.png",
        signerName: "Eko Rismaryanto",
        signerRole: "Pemilik, Lingkara Labs",
        defaultNotes: "Pengerjaan sistem Site VHS tahap berikutnya akan dimulai setelah pembayaran termin I diterima.",
        taxNote: "Bukan PKP (Harga tidak dikenakan PPN)",
        termsConditions: "1. Pembayaran ditransfer sesuai data rekening di atas.\n2. Harap konfirmasi bukti transfer via WhatsApp/Email resmi.\n3. Keterlambatan termin dapat menunda jadwal pengerjaan sistem.",
      },
    });
  }

  return profile as CompanyProfileData;
}

export async function updateCompanyProfile(data: CompanyProfileData) {
  const profile = await prisma.companyProfile.upsert({
    where: { id: "default" },
    update: {
      name: data.name,
      address: data.address,
      phone: data.phone,
      email: data.email,
      logoUrl: data.logoUrl || null,
      signatureUrl: data.signatureUrl || null,
      signerName: data.signerName,
      signerRole: data.signerRole || "Pemilik, Lingkara Labs",
      defaultNotes: data.defaultNotes,
      taxNote: data.taxNote || "Bukan PKP (Harga tidak dikenakan PPN)",
      termsConditions: data.termsConditions || "1. Pembayaran ditransfer sesuai data rekening di atas.\n2. Harap konfirmasi bukti transfer via WhatsApp/Email resmi.\n3. Keterlambatan termin dapat menunda jadwal pengerjaan sistem.",
    },
    create: {
      id: "default",
      name: data.name,
      address: data.address,
      phone: data.phone,
      email: data.email,
      logoUrl: data.logoUrl || null,
      signatureUrl: data.signatureUrl || null,
      signerName: data.signerName,
      signerRole: data.signerRole || "Pemilik, Lingkara Labs",
      defaultNotes: data.defaultNotes,
      taxNote: data.taxNote || "Bukan PKP (Harga tidak dikenakan PPN)",
      termsConditions: data.termsConditions || "1. Pembayaran ditransfer sesuai data rekening di atas.\n2. Harap konfirmasi bukti transfer via WhatsApp/Email resmi.\n3. Keterlambatan termin dapat menunda jadwal pengerjaan sistem.",
    },
  });

  revalidatePath("/settings");
  return profile;
}

// Bank Account actions
export async function getBankAccounts() {
  return await prisma.bankAccount.findMany({
    orderBy: { createdAt: "asc" },
  });
}

export async function createBankAccount(data: BankAccountData) {
  const bank = await prisma.bankAccount.create({
    data: {
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountHolder: data.accountHolder,
      isDefault: data.isDefault || false,
    },
  });
  revalidatePath("/settings");
  return bank;
}

export async function deleteBankAccount(id: string) {
  await prisma.bankAccount.delete({
    where: { id },
  });
  revalidatePath("/settings");
  return { success: true };
}

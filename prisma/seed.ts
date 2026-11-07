import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seeding initial data...");

  // 1. Company Profile
  await prisma.companyProfile.upsert({
    where: { id: "default" },
    update: {
      name: "Lingkara Labs",
      address: "Dsn Babadan, Bantul, Bantul, DIY",
      phone: "082377673248",
      email: "eko.rismaryanto15@gmail.com",
      logoUrl: "/assets/default-logo.png",
      signatureUrl: "/assets/default-signature.png",
      signerName: "Eko Rismaryanto",
      defaultNotes: "Kirim ke Rekening BCA a.n Eko Rismaryanto no. rek 4560962725",
    },
    create: {
      id: "default",
      name: "Lingkara Labs",
      address: "Dsn Babadan, Bantul, Bantul, DIY",
      phone: "082377673248",
      email: "eko.rismaryanto15@gmail.com",
      logoUrl: "/assets/default-logo.png",
      signatureUrl: "/assets/default-signature.png",
      signerName: "Eko Rismaryanto",
      defaultNotes: "Kirim ke Rekening BCA a.n Eko Rismaryanto no. rek 4560962725",
    },
  });

  // 2. Client
  let client = await prisma.client.findFirst({
    where: { name: "PPA-VHS" },
  });
  if (!client) {
    client = await prisma.client.create({
      data: {
        name: "PPA-VHS",
        address: "Mangkalapi, Kec. Kusan Hulu, Tanah Bumbu, Kalimantan Selatan",
        phone: "085335142363",
        email: "email@perusahaan.pelanggan",
      },
    });
  }

  // 3. Bank Account
  const bank = await prisma.bankAccount.findFirst({
    where: { accountNumber: "4560962725" },
  });
  if (!bank) {
    await prisma.bankAccount.create({
      data: {
        bankName: "BCA",
        accountNumber: "4560962725",
        accountHolder: "Eko Rismaryanto",
        isDefault: true,
      },
    });
  }

  // 4. Initial Sample Invoice
  const existingInvoice = await prisma.invoice.findUnique({
    where: { invoiceNumber: "INV/00001" },
  });

  if (!existingInvoice) {
    await prisma.invoice.create({
      data: {
        invoiceNumber: "INV/00001",
        title: "Invoice",
        issueDate: "07/11/2026",
        dueDate: "10/11/2026",
        status: "TERKIRIM",
        companyName: "Lingkara Labs",
        companyAddress: "Dsn Babadan, Bantul, Bantul, DIY",
        companyPhone: "082377673248",
        companyEmail: "eko.rismaryanto15@gmail.com",
        companyLogo: "/assets/default-logo.png",
        clientId: client.id,
        clientName: "PPA-VHS",
        clientAddress: "Mangkalapi, Kec. Kusan Hulu, Tanah Bumbu, Kalimantan Selatan",
        clientPhone: "085335142363",
        clientEmail: "email@perusahaan.pelanggan",
        subtotal: 4800000,
        taxPercent: 0,
        taxAmount: 0,
        discount: 0,
        total: 4800000,
        notes: "Kirim ke Rekening BCA a.n Eko Rismaryanto no. rek 4560962725",
        signatureImage: "/assets/default-signature.png",
        signatureTitle: "Hormat Kami,",
        signatureName: "Eko Rismaryanto",
        items: {
          create: [
            {
              product: "Pembayaran Termin I (DP 30%) - Sistem Site VHS",
              description:
                "Pembayaran uang muka (30%) untuk Lisensi, Kustomisasi, Setup Infrastruktur, Deployment & Maintenance Sistem Site VHS (Ref: Penawaran 001/LNG/XI/2026)",
              quantity: 1,
              unitPrice: 4800000,
              amount: 4800000,
              sortOrder: 0,
            },
          ],
        },
      },
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  });

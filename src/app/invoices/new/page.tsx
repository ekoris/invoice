import {
  getNextInvoiceNumber,
  getCompanyProfile,
  getClients,
  getBankAccounts,
} from "@/lib/actions";
import InvoiceForm from "@/components/InvoiceForm";
import { ClientData, BankAccountData } from "@/lib/types";

export default async function NewInvoicePage() {
  const [nextInvoiceNumber, companyProfile, clients, bankAccounts] =
    await Promise.all([
      getNextInvoiceNumber(),
      getCompanyProfile(),
      getClients(),
      getBankAccounts(),
    ]);

  return (
    <InvoiceForm
      isEdit={false}
      initialInvoice={{
        invoiceNumber: nextInvoiceNumber,
        title: "Invoice",
        issueDate: "",
        dueDate: "",
        status: "DRAFT",
        companyName: companyProfile.name,
        companyAddress: companyProfile.address,
        companyPhone: companyProfile.phone,
        companyEmail: companyProfile.email,
        companyLogo: companyProfile.logoUrl || "/assets/default-logo.png",
        clientName: clients[0]?.name || "",
        clientAddress: clients[0]?.address || "",
        clientPhone: clients[0]?.phone || "",
        clientEmail: clients[0]?.email || "",
        clientId: clients[0]?.id || "",
        items: [
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
        subtotal: 4800000,
        taxPercent: 0,
        taxAmount: 0,
        discount: 0,
        total: 4800000,
        notes: companyProfile.defaultNotes,
        signatureImage: companyProfile.signatureUrl || "/assets/default-signature.png",
        signatureTitle: "Hormat Kami,",
        signatureName: companyProfile.signerName,
      }}
      companyProfile={companyProfile}
      clients={clients as ClientData[]}
      bankAccounts={bankAccounts as BankAccountData[]}
    />
  );
}

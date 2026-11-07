import { notFound } from "next/navigation";
import { getInvoiceById, getCompanyProfile, getClients, getBankAccounts } from "@/lib/actions";
import InvoiceForm from "@/components/InvoiceForm";
import { InvoiceData, ClientData, BankAccountData } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: PageProps) {
  const { id } = await params;
  const [invoice, companyProfile, clients, bankAccounts] = await Promise.all([
    getInvoiceById(id),
    getCompanyProfile(),
    getClients(),
    getBankAccounts(),
  ]);

  if (!invoice) {
    notFound();
  }

  return (
    <InvoiceForm
      isEdit={true}
      initialInvoice={invoice as unknown as InvoiceData}
      companyProfile={companyProfile}
      clients={clients as ClientData[]}
      bankAccounts={bankAccounts as BankAccountData[]}
    />
  );
}

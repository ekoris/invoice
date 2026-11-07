import { getInvoices } from "@/lib/actions";
import InvoiceList from "@/components/InvoiceList";
import { InvoiceData } from "@/lib/types";

export default async function HomePage() {
  const invoices = await getInvoices();

  return (
    <main className="min-h-screen">
      <InvoiceList initialInvoices={invoices as unknown as InvoiceData[]} />
    </main>
  );
}

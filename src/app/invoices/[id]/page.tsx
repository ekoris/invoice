import { notFound } from "next/navigation";
import { getInvoiceById } from "@/lib/actions";
import InvoiceView from "@/components/InvoiceView";
import { InvoiceData } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);

  if (!invoice) {
    notFound();
  }

  return (
    <div className="py-6">
      <InvoiceView invoice={invoice as unknown as InvoiceData} />
    </div>
  );
}

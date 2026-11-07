import { getClients } from "@/lib/actions";
import ClientsManager from "@/components/ClientsManager";
import { ClientData } from "@/lib/types";

export default async function ClientsPage() {
  const clients = await getClients();

  return <ClientsManager initialClients={clients as ClientData[]} />;
}

import { auth } from "@/lib/auth";
import { getAllClients } from "@/lib/sheets/clients";
import { ClientsClient } from "@/components/clients/ClientsClient";
import { redirect } from "next/navigation";

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const clients = await getAllClients();

  return (
    <ClientsClient
      initialClients={clients}
      role={session.user.role}
    />
  );
}

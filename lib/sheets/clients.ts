import { getSheetsClient, SPREADSHEET_ID, ensureHeaders, deleteSheetRow } from "./client";

const SHEET = "Clients";
const HEADERS = [
  "id", "name", "email", "phone", "company",
  "type", "status", "project", "budget", "source",
  "notes", "assigned_to", "created_at", "updated_at",
];
// A=id B=name C=email D=phone E=company F=type G=status H=project I=budget J=source K=notes L=assigned_to M=created_at N=updated_at

export type ClientType = "onboarded" | "lead";
export type ClientStatus =
  | "active" | "paused" | "completed"      // onboarded
  | "new" | "contacted" | "proposal" | "negotiating" | "lost"; // leads

export interface SheetClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  type: ClientType;
  status: ClientStatus;
  project: string;
  budget: string;
  source: string;
  notes: string;
  assigned_to: string;
  created_at: string;
  updated_at: string;
}

function rowToClient(row: string[]): SheetClient | null {
  if (!row[0] || row[0] === "id") return null;
  return {
    id: row[0],
    name: row[1] ?? "",
    email: row[2] ?? "",
    phone: row[3] ?? "",
    company: row[4] ?? "",
    type: (row[5] as ClientType) ?? "lead",
    status: (row[6] as ClientStatus) ?? "new",
    project: row[7] ?? "",
    budget: row[8] ?? "",
    source: row[9] ?? "",
    notes: row[10] ?? "",
    assigned_to: row[11] ?? "",
    created_at: row[12] ?? new Date().toISOString(),
    updated_at: row[13] ?? new Date().toISOString(),
  };
}

export async function getAllClients(): Promise<SheetClient[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A:N`,
  });
  const rows = res.data.values ?? [];
  if (rows.length <= 1) return [];
  return rows.slice(1).map(rowToClient).filter((c): c is SheetClient => c !== null)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getClientById(id: string): Promise<SheetClient | null> {
  const all = await getAllClients();
  return all.find((c) => c.id === id) ?? null;
}

export async function createClient(data: {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  type: ClientType;
  status: ClientStatus;
  project?: string;
  budget?: string;
  source?: string;
  notes?: string;
  assigned_to?: string;
}): Promise<SheetClient> {
  await ensureHeaders(SHEET, HEADERS);
  const sheets = getSheetsClient();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const client: SheetClient = {
    id,
    name: data.name,
    email: data.email ?? "",
    phone: data.phone ?? "",
    company: data.company ?? "",
    type: data.type,
    status: data.status,
    project: data.project ?? "",
    budget: data.budget ?? "",
    source: data.source ?? "",
    notes: data.notes ?? "",
    assigned_to: data.assigned_to ?? "",
    created_at: now,
    updated_at: now,
  };

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A:N`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        id, client.name, client.email, client.phone, client.company,
        client.type, client.status, client.project, client.budget,
        client.source, client.notes, client.assigned_to, now, now,
      ]],
    },
  });

  return client;
}

export async function updateClient(
  id: string,
  updates: Partial<Omit<SheetClient, "id" | "created_at" | "updated_at">>
): Promise<SheetClient | null> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A:N`,
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex((row, i) => i > 0 && row[0] === id);
  if (rowIndex === -1) return null;

  const row = [...rows[rowIndex]];
  if (updates.name !== undefined) row[1] = updates.name;
  if (updates.email !== undefined) row[2] = updates.email;
  if (updates.phone !== undefined) row[3] = updates.phone;
  if (updates.company !== undefined) row[4] = updates.company;
  if (updates.type !== undefined) row[5] = updates.type;
  if (updates.status !== undefined) row[6] = updates.status;
  if (updates.project !== undefined) row[7] = updates.project;
  if (updates.budget !== undefined) row[8] = updates.budget;
  if (updates.source !== undefined) row[9] = updates.source;
  if (updates.notes !== undefined) row[10] = updates.notes;
  if (updates.assigned_to !== undefined) row[11] = updates.assigned_to;
  row[13] = new Date().toISOString();

  const sheetRow = rowIndex + 1;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A${sheetRow}:N${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  });

  return rowToClient(row);
}

export async function deleteClient(id: string): Promise<boolean> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A:N`,
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex((row, i) => i > 0 && row[0] === id);
  if (rowIndex === -1) return false;
  await deleteSheetRow(SHEET, rowIndex);
  return true;
}

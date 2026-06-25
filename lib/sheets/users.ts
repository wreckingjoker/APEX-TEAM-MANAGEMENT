import bcrypt from "bcryptjs";
import { getSheetsClient, SPREADSHEET_ID, ensureHeaders, deleteSheetRow } from "./client";

const SHEET = "Users";
const HEADERS = ["id", "email", "password_hash", "full_name", "role", "avatar_url", "created_at"];
// Columns: A=id B=email C=password_hash D=full_name E=role F=avatar_url G=created_at

export interface SheetUser {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: "admin" | "member";
  avatar_url: string;
  created_at: string;
}

function rowToUser(row: string[]): SheetUser | null {
  if (!row[0] || row[0] === "id") return null;
  return {
    id: row[0],
    email: row[1] ?? "",
    password_hash: row[2] ?? "",
    full_name: row[3] ?? "",
    role: (row[4] as "admin" | "member") ?? "member",
    avatar_url: row[5] ?? "",
    created_at: row[6] ?? new Date().toISOString(),
  };
}

export async function getAllUsers(): Promise<SheetUser[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A:G`,
  });
  const rows = res.data.values ?? [];
  if (rows.length <= 1) return [];
  return rows.slice(1).map(rowToUser).filter((u): u is SheetUser => u !== null);
}

export async function getUserByEmail(email: string): Promise<SheetUser | null> {
  const users = await getAllUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function getUserById(id: string): Promise<SheetUser | null> {
  const users = await getAllUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function createUser(data: {
  email: string;
  password: string;
  full_name: string;
  role: "admin" | "member";
}): Promise<SheetUser> {
  await ensureHeaders(SHEET, HEADERS);

  const existing = await getUserByEmail(data.email);
  if (existing) throw new Error("EMAIL_EXISTS");

  const sheets = getSheetsClient();
  const id = crypto.randomUUID();
  const password_hash = await bcrypt.hash(data.password, 12);
  const now = new Date().toISOString();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A:G`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[id, data.email, password_hash, data.full_name, data.role, "", now]],
    },
  });

  return { id, email: data.email, password_hash, full_name: data.full_name, role: data.role, avatar_url: "", created_at: now };
}

export async function verifyPassword(email: string, password: string): Promise<SheetUser | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.password_hash);
  return valid ? user : null;
}

export async function updateUser(
  id: string,
  updates: Partial<Pick<SheetUser, "full_name" | "avatar_url" | "role" | "password_hash">>
): Promise<boolean> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A:G`,
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex((row, i) => i > 0 && row[0] === id);
  if (rowIndex === -1) return false;

  const row = [...rows[rowIndex]];
  if (updates.full_name !== undefined) row[3] = updates.full_name;
  if (updates.role !== undefined) row[4] = updates.role;
  if (updates.avatar_url !== undefined) row[5] = updates.avatar_url;
  if (updates.password_hash !== undefined) row[2] = updates.password_hash;

  const sheetRow = rowIndex + 1;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A${sheetRow}:G${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  });
  return true;
}

export async function deleteUser(id: string): Promise<boolean> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A:G`,
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex((row, i) => i > 0 && row[0] === id);
  if (rowIndex === -1) return false;
  await deleteSheetRow(SHEET, rowIndex);
  return true;
}

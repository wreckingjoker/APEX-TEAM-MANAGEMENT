import { google, sheets_v4 } from "googleapis";

const googleAuth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export function getSheetsClient(): sheets_v4.Sheets {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return google.sheets({ version: "v4", auth: googleAuth as any });
}

export const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!;

// Cache which sheets have already been verified this server lifetime — avoids repeated API calls
const verifiedSheets = new Set<string>();

export async function ensureHeaders(sheetName: string, headers: string[]): Promise<void> {
  if (verifiedSheets.has(sheetName)) return;

  const sheets = getSheetsClient();

  // Check if tab exists; create it if not
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });
  const tabExists = (meta.data.sheets ?? []).some(
    (s) => s.properties?.title === sheetName
  );
  if (!tabExists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: sheetName } } }],
      },
    });
  }

  // Write headers if row 1 is empty
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
  });
  if (!res.data.values) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
  }

  verifiedSheets.add(sheetName);
}

export async function getSheetId(sheetName: string): Promise<number> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties",
  });
  const sheet = (res.data.sheets ?? []).find(
    (s: sheets_v4.Schema$Sheet) => s.properties?.title === sheetName
  );
  return sheet?.properties?.sheetId ?? 0;
}

export async function deleteSheetRow(sheetName: string, zeroBasedRowIndex: number): Promise<void> {
  const sheets = getSheetsClient();
  const sheetId = await getSheetId(sheetName);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: zeroBasedRowIndex,
              endIndex: zeroBasedRowIndex + 1,
            },
          },
        },
      ],
    },
  });
}

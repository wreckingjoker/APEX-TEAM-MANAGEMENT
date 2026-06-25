import { getSheetsClient, SPREADSHEET_ID, ensureHeaders } from "./client";
import { getAllUsers } from "./users";
import { getAllTasks } from "./tasks";

const SHEET = "ActivityLog";
const HEADERS = ["id", "user_id", "task_id", "action", "old_value", "new_value", "created_at"];
// A=id B=user_id C=task_id D=action E=old_value F=new_value G=created_at

export interface SheetActivity {
  id: string;
  user_id: string;
  task_id: string;
  action: string;
  old_value: string;
  new_value: string;
  created_at: string;
}

export interface ActivityWithMeta extends SheetActivity {
  user: { full_name: string } | null;
  task: { title: string } | null;
}

export async function logActivity(data: {
  user_id: string;
  task_id?: string;
  action: string;
  old_value?: string;
  new_value?: string;
}): Promise<void> {
  await ensureHeaders(SHEET, HEADERS);
  const sheets = getSheetsClient();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A:G`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[id, data.user_id, data.task_id ?? "", data.action, data.old_value ?? "", data.new_value ?? "", now]],
    },
  });
}

export async function getRecentActivity(limit = 10): Promise<ActivityWithMeta[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A:G`,
  });
  const rows = res.data.values ?? [];
  if (rows.length <= 1) return [];

  const activities: SheetActivity[] = rows
    .slice(1)
    .filter((r) => r[0] && r[0] !== "id")
    .map((r) => ({
      id: r[0],
      user_id: r[1] ?? "",
      task_id: r[2] ?? "",
      action: r[3] ?? "",
      old_value: r[4] ?? "",
      new_value: r[5] ?? "",
      created_at: r[6] ?? "",
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);

  const [users, tasks] = await Promise.all([getAllUsers(), getAllTasks()]);
  const userMap = new Map(users.map((u) => [u.id, u]));
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  return activities.map((a) => ({
    ...a,
    user: userMap.get(a.user_id) ? { full_name: userMap.get(a.user_id)!.full_name } : null,
    task: taskMap.get(a.task_id) ? { title: taskMap.get(a.task_id)!.title } : null,
  }));
}

export async function getActivityForUser(userId: string, limit = 10): Promise<ActivityWithMeta[]> {
  const all = await getRecentActivity(100);
  return all.filter((a) => a.user_id === userId).slice(0, limit);
}

import { getSheetsClient, SPREADSHEET_ID, ensureHeaders, deleteSheetRow } from "./client";
import { getAllUsers } from "./users";

const SHEET = "Tasks";
const HEADERS = ["id", "title", "description", "status", "priority", "assigned_to", "created_by", "deadline", "created_at", "updated_at"];
// A=id B=title C=description D=status E=priority F=assigned_to G=created_by H=deadline I=created_at J=updated_at

export interface SheetTask {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assigned_to: string;
  created_by: string;
  deadline: string;
  created_at: string;
  updated_at: string;
}

export interface TaskWithAssignee extends SheetTask {
  assignee: { id: string; full_name: string; avatar_url: string } | null;
}

function rowToTask(row: string[]): SheetTask | null {
  if (!row[0] || row[0] === "id") return null;
  return {
    id: row[0],
    title: row[1] ?? "",
    description: row[2] ?? "",
    status: (row[3] as SheetTask["status"]) ?? "pending",
    priority: (row[4] as SheetTask["priority"]) ?? "medium",
    assigned_to: row[5] ?? "",
    created_by: row[6] ?? "",
    deadline: row[7] ?? "",
    created_at: row[8] ?? new Date().toISOString(),
    updated_at: row[9] ?? new Date().toISOString(),
  };
}

async function getAllRawRows(): Promise<{ rows: string[][]; data: SheetTask[] }> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A:J`,
  });
  const rows = res.data.values ?? [];
  const data = rows.slice(1).map(rowToTask).filter((t): t is SheetTask => t !== null);
  return { rows, data };
}

export async function getAllTasks(): Promise<SheetTask[]> {
  const { data } = await getAllRawRows();
  return data.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getTasksForUser(userId: string): Promise<SheetTask[]> {
  const tasks = await getAllTasks();
  return tasks.filter((t) => t.assigned_to === userId);
}

export async function getTasksWithAssignees(userId?: string): Promise<TaskWithAssignee[]> {
  const [tasks, users] = await Promise.all([getAllTasks(), getAllUsers()]);
  const userMap = new Map(users.map((u) => [u.id, u]));

  const filtered = userId ? tasks.filter((t) => t.assigned_to === userId) : tasks;

  return filtered.map((task) => {
    const u = userMap.get(task.assigned_to);
    return {
      ...task,
      assignee: u ? { id: u.id, full_name: u.full_name, avatar_url: u.avatar_url } : null,
    };
  });
}

export async function getTaskById(id: string): Promise<SheetTask | null> {
  const tasks = await getAllTasks();
  return tasks.find((t) => t.id === id) ?? null;
}

export async function createTask(data: {
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  assigned_to: string;
  created_by: string;
  deadline?: string | null;
}): Promise<SheetTask> {
  await ensureHeaders(SHEET, HEADERS);

  const sheets = getSheetsClient();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const task: SheetTask = {
    id,
    title: data.title,
    description: data.description ?? "",
    status: (data.status as SheetTask["status"]) ?? "pending",
    priority: (data.priority as SheetTask["priority"]) ?? "medium",
    assigned_to: data.assigned_to,
    created_by: data.created_by,
    deadline: data.deadline ?? "",
    created_at: now,
    updated_at: now,
  };

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A:J`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[id, task.title, task.description, task.status, task.priority,
        task.assigned_to, task.created_by, task.deadline, now, now]],
    },
  });

  return task;
}

export async function updateTask(
  id: string,
  updates: Partial<Pick<SheetTask, "title" | "description" | "status" | "priority" | "assigned_to" | "deadline">>
): Promise<SheetTask | null> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A:J`,
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex((row, i) => i > 0 && row[0] === id);
  if (rowIndex === -1) return null;

  const row = [...rows[rowIndex]];
  if (updates.title !== undefined) row[1] = updates.title;
  if (updates.description !== undefined) row[2] = updates.description ?? "";
  if (updates.status !== undefined) row[3] = updates.status;
  if (updates.priority !== undefined) row[4] = updates.priority;
  if (updates.assigned_to !== undefined) row[5] = updates.assigned_to;
  if (updates.deadline !== undefined) row[7] = updates.deadline ?? "";
  row[9] = new Date().toISOString();

  const sheetRow = rowIndex + 1;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A${sheetRow}:J${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  });

  return rowToTask(row);
}

export async function deleteTask(id: string): Promise<boolean> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A:J`,
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex((row, i) => i > 0 && row[0] === id);
  if (rowIndex === -1) return false;
  await deleteSheetRow(SHEET, rowIndex);
  return true;
}

export async function unassignUserTasks(userId: string): Promise<void> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A:J`,
  });
  const rows = res.data.values ?? [];
  const updates: Promise<unknown>[] = [];

  rows.forEach((row, i) => {
    if (i > 0 && row[5] === userId) {
      row[5] = "";
      const sheetRow = i + 1;
      updates.push(
        sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET}!A${sheetRow}:J${sheetRow}`,
          valueInputOption: "RAW",
          requestBody: { values: [row] },
        })
      );
    }
  });

  await Promise.all(updates);
}

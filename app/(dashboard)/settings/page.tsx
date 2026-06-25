import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllUsers } from "@/lib/sheets/users";
import { getAllTasks } from "@/lib/sheets/tasks";
import { Shield, Clock, Database, Lock } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  if (session?.user.role !== "admin") redirect("/dashboard");

  const [users, tasks] = await Promise.all([getAllUsers(), getAllTasks()]);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A3E]">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Platform configuration and security overview.</p>
      </div>

      <div className="apex-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-[#4F7FFF]" />
          <h2 className="font-semibold text-[#1A1A3E]">Platform Overview</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Team Members", value: users.length },
            { label: "Total Tasks", value: tasks.length },
            { label: "Database", value: "Google Sheets" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-2xl font-bold text-[#1A1A3E]">{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="apex-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-emerald-500" />
          <h2 className="font-semibold text-[#1A1A3E]">Security Status</h2>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { label: "JWT Authentication", status: "Active", ok: true },
            { label: "Password Hashing (bcrypt 12 rounds)", status: "Enabled", ok: true },
            { label: "Rate Limiting", status: "Active — 100 req/15min", ok: true },
            { label: "Security Headers (CSP, X-Frame)", status: "Configured", ok: true },
            { label: "HTTP-only Secure Cookies", status: "SameSite=Lax", ok: true },
            { label: "Input Validation (Zod)", status: "All API routes", ok: true },
            { label: "Role-based Access Control", status: "Proxy + API layers", ok: true },
            { label: "XSS Protection", status: "React auto-escape + CSP", ok: true },
          ].map(({ label, status, ok }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <span className="text-sm text-slate-700">{label}</span>
              <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} />
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="apex-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-[#4F7FFF]" />
          <h2 className="font-semibold text-[#1A1A3E]">Session Configuration</h2>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          {[
            { label: "Session Strategy", value: "JWT" },
            { label: "Token Expiry", value: "7 days" },
            { label: "Login Rate Limit", value: "5 attempts / 15 min" },
            { label: "Cookie Security", value: "HTTP-only, Secure, SameSite" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
              <span className="text-slate-600">{label}</span>
              <span className="font-medium text-[#1A1A3E]">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="apex-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-[#8B2FBE]" />
          <h2 className="font-semibold text-[#1A1A3E]">Password Policy</h2>
        </div>
        <ul className="flex flex-col gap-2 text-sm text-slate-600">
          {[
            "Minimum 12 characters",
            "At least one uppercase letter (A–Z)",
            "At least one lowercase letter (a–z)",
            "At least one number (0–9)",
            "At least one special character (!@#$…)",
            "Maximum 128 characters",
          ].map((rule) => (
            <li key={rule} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C8FF] shrink-0" />
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus, Trash2, Mail, Phone, Building2, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { SheetClient, ClientType, ClientStatus } from "@/lib/sheets/clients";
import type { UserRole } from "@/types";

const TYPE_LABELS: Record<ClientType, string> = {
  onboarded: "Onboarded",
  lead: "Potential",
};

const STATUS_STYLES: Record<ClientStatus, string> = {
  active:      "bg-emerald-50 text-emerald-700",
  paused:      "bg-amber-50 text-amber-700",
  completed:   "bg-blue-50 text-blue-700",
  new:         "bg-slate-100 text-slate-600",
  contacted:   "bg-purple-50 text-purple-700",
  proposal:    "bg-cyan-50 text-cyan-700",
  negotiating: "bg-orange-50 text-orange-700",
  lost:        "bg-red-50 text-red-600",
};

const ONBOARDED_STATUSES: ClientStatus[] = ["active", "paused", "completed"];
const LEAD_STATUSES: ClientStatus[] = ["new", "contacted", "proposal", "negotiating", "lost"];

const SOURCE_OPTIONS = ["Referral", "LinkedIn", "Instagram", "Facebook", "Website", "Cold outreach", "Fiverr", "Upwork", "Other"];

interface ClientsClientProps {
  initialClients: SheetClient[];
  role: UserRole;
}

const EMPTY_FORM = {
  name: "", email: "", phone: "", company: "",
  type: "lead" as ClientType, status: "new" as ClientStatus,
  project: "", budget: "", source: "", notes: "", assigned_to: "",
};

export function ClientsClient({ initialClients, role }: ClientsClientProps) {
  const [clients, setClients] = useState<SheetClient[]>(initialClients);
  const [tab, setTab] = useState<"all" | "onboarded" | "lead">("all");
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState<SheetClient | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = role === "admin";

  const filtered = clients.filter((c) => tab === "all" || c.type === tab);
  const onboardedCount = clients.filter((c) => c.type === "onboarded").length;
  const leadCount = clients.filter((c) => c.type === "lead").length;
  const activeCount = clients.filter((c) => c.status === "active").length;

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditClient(null);
    setError("");
    setShowModal(true);
  }

  function openEdit(client: SheetClient) {
    setForm({
      name: client.name, email: client.email, phone: client.phone,
      company: client.company, type: client.type, status: client.status,
      project: client.project, budget: client.budget, source: client.source,
      notes: client.notes, assigned_to: client.assigned_to,
    });
    setEditClient(client);
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditClient(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  function f(key: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required"); return; }
    setLoading(true);
    setError("");

    const url = editClient ? `/api/clients/${editClient.id}` : "/api/clients";
    const method = editClient ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) { setError(json.error ?? "Something went wrong"); return; }

    if (editClient) {
      setClients((prev) => prev.map((c) => (c.id === editClient.id ? json.data : c)));
    } else {
      setClients((prev) => [json.data, ...prev]);
    }
    closeModal();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name}? This cannot be undone.`)) return;
    setClients((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
  }

  async function handleStatusChange(id: string, status: ClientStatus) {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    await fetch(`/api/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  const availableStatuses = form.type === "onboarded" ? ONBOARDED_STATUSES : LEAD_STATUSES;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A3E]">Clients</h1>
          <p className="text-slate-500 text-sm mt-1">{clients.length} total · {activeCount} active</p>
        </div>
        {isAdmin && (
          <Button onClick={openAdd} className="apex-gradient text-white border-0 hover:opacity-90 gap-2">
            <Plus className="w-4 h-4" />Add Client
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="apex-card p-4">
          <p className="text-2xl font-bold text-[#00C8FF]">{onboardedCount}</p>
          <p className="text-sm text-slate-500 mt-1">Onboarded Clients</p>
        </div>
        <div className="apex-card p-4">
          <p className="text-2xl font-bold text-[#4F7FFF]">{leadCount}</p>
          <p className="text-sm text-slate-500 mt-1">Potential Clients</p>
        </div>
        <div className="apex-card p-4">
          <p className="text-2xl font-bold text-[#8B2FBE]">{activeCount}</p>
          <p className="text-sm text-slate-500 mt-1">Active Projects</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {(["all", "onboarded", "lead"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === t ? "bg-white text-[#1A1A3E] shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "all" ? "All" : t === "onboarded" ? "Onboarded" : "Potential"}
          </button>
        ))}
      </div>

      {/* Client Cards */}
      {filtered.length === 0 ? (
        <div className="apex-card p-12 text-center text-slate-400">
          No {tab === "all" ? "clients" : tab === "onboarded" ? "onboarded clients" : "potential clients"} yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <div key={client.id} className="apex-card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl apex-gradient flex items-center justify-center text-white font-bold text-base shrink-0">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1A1A3E] text-sm truncate">{client.name}</p>
                    {client.company && <p className="text-xs text-slate-400 truncate">{client.company}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${client.type === "onboarded" ? "bg-[#00C8FF]/10 text-[#00C8FF]" : "bg-purple-50 text-purple-600"}`}>
                    {TYPE_LABELS[client.type]}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Status</span>
                {isAdmin ? (
                  <Select value={client.status} onValueChange={(v) => v && handleStatusChange(client.id, v as ClientStatus)}>
                    <SelectTrigger className="h-6 w-36 text-xs border-0 bg-transparent p-0 justify-end gap-1 focus:ring-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[client.status]}`}>
                        {client.status}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {(client.type === "onboarded" ? ONBOARDED_STATUSES : LEAD_STATUSES).map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[client.status]}`}>
                    {client.status}
                  </span>
                )}
              </div>

              {/* Project */}
              {client.project && (
                <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 truncate">
                  <span className="text-slate-400">Project: </span>{client.project}
                </div>
              )}

              {/* Contact info */}
              <div className="flex flex-col gap-1">
                {client.email && (
                  <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-xs text-slate-500 hover:text-[#4F7FFF] truncate">
                    <Mail className="w-3 h-3 shrink-0" />{client.email}
                  </a>
                )}
                {client.phone && (
                  <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-xs text-slate-500 hover:text-[#4F7FFF]">
                    <Phone className="w-3 h-3 shrink-0" />{client.phone}
                  </a>
                )}
                {client.budget && (
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    <Building2 className="w-3 h-3 shrink-0" />Budget: {client.budget}
                  </p>
                )}
              </div>

              {client.notes && (
                <p className="text-xs text-slate-400 line-clamp-2 border-t border-slate-50 pt-2">{client.notes}</p>
              )}

              {/* Actions */}
              {isAdmin && (
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50">
                  <button onClick={() => openEdit(client)} className="text-xs text-slate-400 hover:text-[#4F7FFF] flex items-center gap-1 transition-colors">
                    <ExternalLink className="w-3 h-3" />Edit
                  </button>
                  <button onClick={() => handleDelete(client.id, client.name)} className="text-xs text-slate-300 hover:text-red-500 flex items-center gap-1 transition-colors">
                    <Trash2 className="w-3 h-3" />Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Dialog open={showModal} onOpenChange={(v) => { if (!v) closeModal(); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A3E]">
              {editClient ? "Edit Client" : "Add Client"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 col-span-2">
                <Label htmlFor="c-name">Name *</Label>
                <Input id="c-name" value={form.name} onChange={f("name")} placeholder="John Doe" maxLength={100} required />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={(v) => {
                  const newType = v as ClientType;
                  const defaultStatus = newType === "onboarded" ? "active" : "new";
                  setForm((p) => ({ ...p, type: newType, status: defaultStatus }));
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onboarded">Onboarded Client</SelectItem>
                    <SelectItem value="lead">Potential Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Status *</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as ClientStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableStatuses.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="c-email">Email</Label>
                <Input id="c-email" type="email" value={form.email} onChange={f("email")} placeholder="john@example.com" maxLength={255} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="c-phone">Phone</Label>
                <Input id="c-phone" value={form.phone} onChange={f("phone")} placeholder="+91 98765 43210" maxLength={30} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="c-company">Company</Label>
                <Input id="c-company" value={form.company} onChange={f("company")} placeholder="Company name" maxLength={100} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="c-budget">Budget</Label>
                <Input id="c-budget" value={form.budget} onChange={f("budget")} placeholder="e.g. ₹50,000" maxLength={50} />
              </div>

              <div className="flex flex-col gap-1.5 col-span-2">
                <Label htmlFor="c-project">Project / Service</Label>
                <Input id="c-project" value={form.project} onChange={f("project")} placeholder="e.g. Website redesign" maxLength={200} />
              </div>

              <div className="flex flex-col gap-1.5 col-span-2">
                <Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm((p) => ({ ...p, source: v ?? "" }))}>

                  <SelectTrigger><SelectValue placeholder="How did they find us?" /></SelectTrigger>
                  <SelectContent>
                    {SOURCE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5 col-span-2">
                <Label htmlFor="c-notes">Notes</Label>
                <textarea
                  id="c-notes"
                  value={form.notes}
                  onChange={f("notes")}
                  placeholder="Any additional notes..."
                  maxLength={2000}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={closeModal} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading} className="apex-gradient text-white border-0 hover:opacity-90">
                {loading ? "Saving…" : editClient ? "Save Changes" : "Add Client"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

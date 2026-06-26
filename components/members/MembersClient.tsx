"use client";

import { useState } from "react";
import { inviteMemberSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, UserMinus, AlertCircle, Shield, User } from "lucide-react";
import { avatarColor } from "@/lib/avatar-color";
import type { Profile } from "@/types";

interface MembersClientProps {
  members: Profile[];
  taskCounts: { assigned_to: string; status: string }[];
  currentUserId: string;
}

export function MembersClient({
  members: initialMembers,
  taskCounts,
  currentUserId,
}: MembersClientProps) {
  const [members, setMembers] = useState<Profile[]>(initialMembers);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [password, setPassword] = useState("");

  function reset() {
    setEmail("");
    setFullName("");
    setRole("member");
    setPassword("");
    setError("");
  }

  function getTaskCount(memberId: string) {
    return taskCounts.filter((t) => t.assigned_to === memberId).length;
  }

  function getActiveCount(memberId: string) {
    return taskCounts.filter(
      (t) => t.assigned_to === memberId && t.status !== "done"
    ).length;
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsed = inviteMemberSchema.safeParse({ email, full_name: fullName, role, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);

    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Failed to add member.");
      return;
    }

    setMembers((prev) => [...prev, json.data as Profile]);
    reset();
    setShowModal(false);
  }

  async function handleRemove(memberId: string, memberName: string) {
    if (memberId === currentUserId) return;
    if (!confirm(`Remove ${memberName} from the team? Their tasks will be unassigned.`)) return;

    const res = await fetch(`/api/members/${memberId}`, { method: "DELETE" });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1A1A3E]">Team Members</h1>
          <p className="text-slate-500 text-sm mt-1">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="apex-gradient text-white border-0 hover:opacity-90 gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </Button>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <div
            key={member.id}
            className="apex-card p-5 flex flex-col gap-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                  style={{ backgroundColor: avatarColor(member.id) }}
                >
                  {member.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[#1A1A3E] text-sm truncate">
                    {member.full_name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {member.role === "admin" ? (
                      <Shield className="w-3 h-3 text-[#4F7FFF]" />
                    ) : (
                      <User className="w-3 h-3 text-slate-400" />
                    )}
                    <span className="text-xs text-slate-500 capitalize">
                      {member.role}
                    </span>
                  </div>
                </div>
              </div>
              {member.id !== currentUserId && (
                <button
                  onClick={() => handleRemove(member.id, member.full_name)}
                  aria-label={`Remove ${member.full_name}`}
                  className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              )}
            </div>

            {member.role === "member" && (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-50">
                <div className="text-center">
                  <p className="text-lg font-bold text-[#1A1A3E]">
                    {getTaskCount(member.id)}
                  </p>
                  <p className="text-xs text-slate-400">Total tasks</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-[#4F7FFF]">
                    {getActiveCount(member.id)}
                  </p>
                  <p className="text-xs text-slate-400">Active</p>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-400">
              Joined {new Date(member.created_at).toLocaleDateString("en-US")}
            </p>
          </div>
        ))}
      </div>

      {/* Add Member Modal */}
      <Dialog
        open={showModal}
        onOpenChange={(v) => {
          if (!v) { reset(); setShowModal(false); }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A3E]">Add Team Member</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddMember} className="flex flex-col gap-4 mt-2">
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="member-name">Full Name *</Label>
              <Input
                id="member-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Smith"
                maxLength={100}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="member-email">Email *</Label>
              <Input
                id="member-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@apexdigital.com"
                maxLength={255}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="member-password">
                Temporary Password *
              </Label>
              <Input
                id="member-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 12 chars, upper + number + symbol"
                maxLength={128}
                required
              />
              <p className="text-xs text-slate-400">
                Share this securely. They should change it after first login.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(v) => v && setRole(v as "admin" | "member")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { reset(); setShowModal(false); }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="apex-gradient text-white border-0 hover:opacity-90"
              >
                {loading ? "Adding…" : "Add Member"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

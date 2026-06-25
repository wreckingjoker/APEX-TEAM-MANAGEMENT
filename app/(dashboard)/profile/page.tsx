"use client";

import { useState, useEffect } from "react";
import { updateProfileSchema, changePasswordSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ProfileData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [fullName, setFullName] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setFullName(data.full_name);
        }
      });
  }, []);

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    const parsed = updateProfileSchema.safeParse({ full_name: fullName });
    if (!parsed.success) {
      setProfileMsg({ ok: false, text: parsed.error.issues[0].message });
      return;
    }
    setProfileLoading(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: parsed.data.full_name }),
    });
    setProfileLoading(false);
    if (!res.ok) {
      setProfileMsg({ ok: false, text: "Failed to update profile." });
    } else {
      setProfileMsg({ ok: true, text: "Profile updated." });
      setProfile((p) => p ? { ...p, full_name: fullName } : p);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    const parsed = changePasswordSchema.safeParse({
      current_password: currentPw,
      new_password: newPw,
      confirm_password: confirmPw,
    });
    if (!parsed.success) {
      setPwMsg({ ok: false, text: parsed.error.issues[0].message });
      return;
    }
    setPwLoading(true);
    const res = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_password: parsed.data.current_password,
        new_password: parsed.data.new_password,
        confirm_password: parsed.data.confirm_password,
      }),
    });
    const json = await res.json();
    setPwLoading(false);
    if (!res.ok) {
      setPwMsg({ ok: false, text: json.error ?? "Failed to update password." });
    } else {
      setPwMsg({ ok: true, text: "Password updated successfully." });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    }
  }

  if (!profile) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A3E]">Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account details.</p>
      </div>

      <div className="apex-card p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl apex-gradient flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {profile.full_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-xl font-bold text-[#1A1A3E]">{profile.full_name}</p>
          <p className="text-sm text-slate-500 capitalize">{profile.role}</p>
          <p className="text-xs text-slate-400 mt-1">
            Member since {new Date(profile.created_at).toLocaleDateString("en-US")}
          </p>
        </div>
      </div>

      <div className="apex-card p-6">
        <h2 className="font-semibold text-[#1A1A3E] mb-4">Display Name</h2>
        <form onSubmit={handleProfileUpdate} className="flex flex-col gap-4">
          {profileMsg && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${profileMsg.ok ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
              {profileMsg.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {profileMsg.text}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="full-name">Full Name</Label>
            <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} required />
          </div>
          <Button type="submit" disabled={profileLoading} className="self-start apex-gradient text-white border-0 hover:opacity-90">
            {profileLoading ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </div>

      <div className="apex-card p-6">
        <h2 className="font-semibold text-[#1A1A3E] mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
          {pwMsg && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${pwMsg.ok ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
              {pwMsg.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {pwMsg.text}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="current-pw">Current Password</Label>
            <Input id="current-pw" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-pw">New Password</Label>
            <Input id="new-pw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required />
            <p className="text-xs text-slate-400">Min 12 characters · uppercase · number · special character</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-pw">Confirm New Password</Label>
            <Input id="confirm-pw" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
          </div>
          <Button type="submit" disabled={pwLoading} className="self-start apex-gradient text-white border-0 hover:opacity-90">
            {pwLoading ? "Updating…" : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

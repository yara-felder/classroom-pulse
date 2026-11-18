import React, { useEffect, useState } from "react";
import { Copy, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const roleName = (role) => (role === "case_manager" ? "Case manager" : role === "admin" ? "Administrator" : "Teacher");

export const SchoolAccessPanel = ({ role, students }) => {
  const [inviteRole, setInviteRole] = useState("teacher");
  const [invite, setInvite] = useState(null);
  const [invites, setInvites] = useState([]);
  const [code, setCode] = useState("");
  const [directory, setDirectory] = useState([]);
  const [roster, setRoster] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [busy, setBusy] = useState(false);

  const loadStaffTools = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    const [directoryRes, assignmentRes, inviteRes, rosterRes] = await Promise.all([
      supabase.rpc("school_directory"),
      supabase.from("caseload_assignments").select("student_id, case_manager_id"),
      role === "admin"
        ? supabase
            .from("school_invites")
            .select("id, code, access_role, expires_at, max_uses, use_count, revoked_at")
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      role === "admin"
        ? supabase.from("admin_roster").select("id, name, iep, plan_504")
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (directoryRes.error) throw new Error(directoryRes.error.message);
    if (assignmentRes.error) throw new Error(assignmentRes.error.message);
    if (inviteRes.error) throw new Error(inviteRes.error.message);
    if (rosterRes.error) throw new Error(rosterRes.error.message);
    setDirectory(directoryRes.data || []);
    setAssignments(assignmentRes.data || []);
    setInvites((inviteRes.data || []).filter((row) => !row.revoked_at && new Date(row.expires_at) > new Date() && row.use_count < row.max_uses));
    const iepRows = (rosterRes.data || []).filter((student) => student.iep || student.plan_504);
    setRoster(iepRows);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    loadStaffTools().catch((err) => toast.error(err.message || "Couldn't load school access"));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load when the signed-in role is known
  }, [role]);

  const createInvite = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("create_school_invite", {
        new_role: inviteRole,
        use_limit: 5,
        valid_days: 14,
      });
      if (error) throw new Error(error.message);
      const created = data && !Array.isArray(data) ? data : Array.isArray(data) ? data[0] : null;
      setInvite(created);
      await loadStaffTools();
      toast.success("Invite code ready");
    } catch (err) {
      toast.error(err.message || "Couldn't create an invite");
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Invite code copied");
    } catch {
      toast.error("Couldn't copy the code");
    }
  };

  const join = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.rpc("join_school", { invite_code: code.trim() });
      if (error) throw new Error(error.message);
      toast.success("You joined the school. Reloading your account.");
      window.location.assign("/");
    } catch (err) {
      toast.error(err.message || "Couldn't join with that code");
      setBusy(false);
    }
  };

  const assign = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.rpc("assign_caseload", {
        target_case_manager: managerId,
        target_student: studentId,
      });
      if (error) throw new Error(error.message);
      toast.success("Caseload updated");
      await loadStaffTools();
    } catch (err) {
      toast.error(err.message || "Couldn't assign that caseload");
    } finally {
      setBusy(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <p className="text-sm text-slate-500" data-testid="school-access-demo">
        School invites apply to signed-in staff accounts. This demo keeps everyone in a local classroom.
      </p>
    );
  }

  const managers = directory.filter((person) => person.access_role === "case_manager");
  const ownIep = (students || []).filter((student) => student.iep || student.plan504);
  const assignable = role === "admin" ? roster : ownIep;
  const names = new Map([
    ...assignable.map((student) => [student.id, student.name]),
    ...(students || []).map((student) => [student.id, student.name]),
  ]);

  return (
    <div className="space-y-5" data-testid="school-access-panel">
      <p className="text-sm text-slate-600">
        You are signed in as <span className="font-semibold text-slate-800">{roleName(role)}</span>. An invite puts a teacher or case manager on this school. Parents are not invited.
      </p>

      {role === "admin" && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Invite staff into this school</Label>
          <div className="flex gap-2">
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="flex-1" data-testid="school-invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="case_manager">Case manager</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" onClick={createInvite} disabled={busy} className="bg-teal-600 hover:bg-teal-700 text-white" data-testid="school-invite-create">
              <UserPlus className="w-4 h-4 mr-1.5" /> Create code
            </Button>
          </div>
          {invite?.code && (
            <button type="button" onClick={() => copyCode(invite.code)} className="w-full text-left rounded-lg border border-slate-200 px-3 py-2 text-sm" data-testid="school-invite-code">
              <span className="font-mono">{invite.code}</span>
              <Copy className="w-3.5 h-3.5 inline ml-2 text-slate-400" />
              <span className="block text-[11px] text-slate-500">Expires {new Date(invite.expires_at).toLocaleDateString()}. Up to {invite.max_uses} uses.</span>
            </button>
          )}
          {invites.length > 0 && (
            <ul className="text-xs text-slate-600 space-y-1">
              {invites.map((row) => (
                <li key={row.id}>
                  <span className="font-mono">{row.code}</span> · {roleName(row.access_role)} · {row.use_count}/{row.max_uses}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="school-join-code" className="text-xs font-semibold">Join a school with a code</Label>
        <div className="flex gap-2">
          <Input id="school-join-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste invite code" data-testid="school-join-code" />
          <Button type="button" variant="outline" onClick={join} disabled={busy || code.trim().length < 8} data-testid="school-join-submit">
            Join
          </Button>
        </div>
      </div>

      {(role === "admin" || role === "teacher") && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Assign an IEP or 504 student to a case manager</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger data-testid="caseload-student">
                <SelectValue placeholder="Student" />
              </SelectTrigger>
              <SelectContent>
                {assignable.map((student) => (
                  <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={managerId} onValueChange={setManagerId}>
              <SelectTrigger data-testid="caseload-manager">
                <SelectValue placeholder="Case manager" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((person) => (
                  <SelectItem key={person.user_id} value={person.user_id}>{person.name || person.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="outline" onClick={assign} disabled={busy || !studentId || !managerId} data-testid="caseload-assign">
            Assign caseload
          </Button>
          {role === "admin" && roster.length === 0 && (
            <p className="text-[11px] text-slate-500">Names appear here when that teacher allows full roster access. Counts-only privacy stays hidden.</p>
          )}
          {assignments.length > 0 && (
            <ul className="text-xs text-slate-600 space-y-1" data-testid="caseload-list">
              {assignments.map((row) => {
                const manager = directory.find((person) => person.user_id === row.case_manager_id);
                return (
                  <li key={`${row.student_id}-${row.case_manager_id}`}>
                    {names.get(row.student_id) || "Assigned student"} · {manager?.name || manager?.email || "Case manager"}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

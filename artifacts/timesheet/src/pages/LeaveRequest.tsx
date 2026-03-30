import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { AppTheme } from "@/lib/themes";

const API_KEY = "G2JylRhOWQ8Xa0Z5OmCI7W9DfLXJCYPA";
const LEAVE_ENDPOINT =
  "https://defaultd508624fa0b74fd3951105b18ca027.84.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/e6b3ef6685da42d49073363642d020eb/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=FjKe83SFE8Jg6ZM2EVMad4qMEtGzvu4nmhgGLGJ9x_0";

const LEAVE_TYPES = [
  "Annual Leave", "Sick Leave", "WFH", "Casual Leave", "Emergency Leave",
  "Maternity Leave", "Paternity Leave", "Bereavement Leave", "Study / Exam Leave", "Unpaid Leave",
];

const LOCKED_EMPLOYEE_ID = "RC-10045";
const LOCKED_EMPLOYEE_ID_M = "RC-MGR-205";
const LOCKED_EMPLOYEE_NAME = "John Smith";

function formatDate(date: Date): string { return date.toISOString().split("T")[0]; }
function getNow() {
  const now = new Date();
  return { date: formatDate(now), time: now.toTimeString().split(" ")[0] };
}
function calcBusinessDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start), e = new Date(end);
  if (e < s) return 0;
  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function LockIcon() {
  return (
    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"
      fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}
function LockedBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200 normal-case tracking-normal">
      locked
    </span>
  );
}

interface Props {
  theme: AppTheme;
  managerEmail: string;
  setManagerEmail: (v: string) => void;
}

export default function LeaveRequest({ theme, managerEmail, setManagerEmail }: Props) {
  const { toast } = useToast();
  const today = formatDate(new Date());
  const p = theme.primary;
  const ph = theme.primaryHover;

  const [leaveType, setLeaveType] = useState("");
  const [leaveStartDate, setLeaveStartDate] = useState(today);
  const [leaveEndDate, setLeaveEndDate] = useState(today);
  const [reason, setReason] = useState("");
  const [backupResource, setBackupResource] = useState("");
  const [counter, setCounter] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    leaveType: string; leaveStartDate: string; leaveEndDate: string; days: number;
  } | null>(null);

  const totalDays = calcBusinessDays(leaveStartDate, leaveEndDate);

  function handleReset() {
    setSubmitted(false); setSubmittedData(null); setLeaveType(""); setLeaveStartDate(today);
    setLeaveEndDate(today); setReason(""); setBackupResource(""); setCounter(""); setComments("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!leaveType) {
      toast({ title: "Leave type required", description: "Please select a leave type.", variant: "destructive" }); return;
    }
    if (!leaveStartDate || !leaveEndDate) {
      toast({ title: "Dates required", description: "Please select start and end dates.", variant: "destructive" }); return;
    }
    if (new Date(leaveEndDate) < new Date(leaveStartDate)) {
      toast({ title: "Invalid date range", description: "End date must be on or after start date.", variant: "destructive" }); return;
    }
    if (!managerEmail) {
      toast({ title: "Manager email required", description: "Please enter the manager email.", variant: "destructive" }); return;
    }
    setSubmitting(true);
    const { date: creationDate, time: creationTime } = getNow();
    const payload = {
      employeeId: LOCKED_EMPLOYEE_ID, employeeIdM: LOCKED_EMPLOYEE_ID_M,
      counter: counter.trim() || `LR-${Date.now()}`, employeeName: LOCKED_EMPLOYEE_NAME,
      leaveType, leaveStartDate, leaveEndDate, totalDays,
      reason: reason.trim(), backupResource: backupResource.trim(),
      approvalStatus: "Pending", submittedBy: LOCKED_EMPLOYEE_NAME,
      managerEmail, creationDate, creationTime, comments: comments.trim(),
    };
    try {
      const res = await fetch(LEAVE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
        body: JSON.stringify(payload),
      });
      if (res.ok || res.status === 200 || res.status === 202) {
        setSubmittedData({ leaveType, leaveStartDate, leaveEndDate, days: totalDays });
        setSubmitted(true);
        toast({ title: "Leave request submitted!", description: `Your ${leaveType} request has been sent to your manager.` });
      } else {
        const body = await res.text();
        throw new Error(`HTTP ${res.status}: ${body}`);
      }
    } catch (err) {
      toast({ title: "Submission failed", description: `Could not submit leave request. (${err})`, variant: "destructive" });
    } finally { setSubmitting(false); }
  }

  if (submitted && submittedData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Leave Request Submitted</h2>
        <p className="text-gray-500 mb-2">Your <strong>{submittedData.leaveType}</strong> request has been sent to your manager.</p>
        <p className="text-gray-500 mb-2">
          Period: <strong className="text-gray-800">{submittedData.leaveStartDate}</strong> to{" "}
          <strong className="text-gray-800">{submittedData.leaveEndDate}</strong>
        </p>
        <p className="text-gray-500 mb-8">Business days: <strong className="text-gray-800">{submittedData.days}</strong></p>
        <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5 text-sm text-yellow-700 mb-8">
          <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pending manager approval
        </div>
        <div>
          <Button onClick={handleReset} style={{ backgroundColor: p }} className="text-white px-8 hover:opacity-90">
            Submit Another Request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Leave Request</h1>
          <p className="text-sm text-gray-500 mt-0.5">Submit a new absence or leave request</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={handleReset} className="border-gray-300 text-gray-600">
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} style={{ backgroundColor: p }}
            className="text-white min-w-[140px] hover:opacity-90"
            onMouseOver={e => (e.currentTarget.style.backgroundColor = ph)}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = p)}>
            {submitting ? <span className="flex items-center gap-2"><Spinner className="h-4 w-4" /> Submitting...</span> : "Submit Request"}
          </Button>
        </div>
      </div>

      {/* Employee Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div style={{ backgroundColor: theme.sectionHeaderBg }} className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Employee Information</h2>
        </div>
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
              Employee ID <LockedBadge />
            </Label>
            <div className="relative">
              <Input value={LOCKED_EMPLOYEE_ID} readOnly className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed pr-8" />
              <LockIcon />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
              Manager Employee ID <LockedBadge />
            </Label>
            <div className="relative">
              <Input value={LOCKED_EMPLOYEE_ID_M} readOnly className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed pr-8" />
              <LockIcon />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
              Employee Name <LockedBadge />
            </Label>
            <div className="relative">
              <Input value={LOCKED_EMPLOYEE_NAME} readOnly className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed pr-8" />
              <LockIcon />
            </div>
          </div>
          {/* Manager Email - EDITABLE */}
          <div className="space-y-1.5">
            <Label htmlFor="leaveManagerEmail" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Manager Email
            </Label>
            <Input
              id="leaveManagerEmail"
              type="email"
              value={managerEmail}
              onChange={(e) => setManagerEmail(e.target.value)}
              placeholder="manager@company.com"
              className="border-gray-300"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="counter" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Leave Counter
            </Label>
            <Input id="counter" placeholder="Auto-generated if empty" value={counter}
              onChange={(e) => setCounter(e.target.value)} className="border-gray-300" />
          </div>
        </div>
      </div>

      {/* Leave Details Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div style={{ backgroundColor: theme.sectionHeaderBg }} className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Leave Details</h2>
        </div>
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="leaveType" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Leave Type <span className="text-red-500">*</span>
            </Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger className="border-gray-300"><SelectValue placeholder="Select leave type…" /></SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="leaveStartDate" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Start Date <span className="text-red-500">*</span>
            </Label>
            <Input id="leaveStartDate" type="date" value={leaveStartDate}
              onChange={(e) => { setLeaveStartDate(e.target.value); if (e.target.value > leaveEndDate) setLeaveEndDate(e.target.value); }}
              className="border-gray-300" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="leaveEndDate" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              End Date <span className="text-red-500">*</span>
            </Label>
            <Input id="leaveEndDate" type="date" value={leaveEndDate} min={leaveStartDate}
              onChange={(e) => setLeaveEndDate(e.target.value)} className="border-gray-300" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Business Days</Label>
            <div className={`h-10 px-3 flex items-center rounded-md border text-sm font-semibold`}
              style={totalDays > 0
                ? { backgroundColor: theme.primaryLight, borderColor: theme.primaryLightBorder, color: p }
                : { backgroundColor: "#f9fafb", borderColor: "#e5e7eb", color: "#9ca3af" }}>
              {totalDays > 0 ? `${totalDays} day${totalDays !== 1 ? "s" : ""}` : "–"}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="backupResource" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Backup Resource
            </Label>
            <Input id="backupResource" placeholder="Name of backup colleague"
              value={backupResource} onChange={(e) => setBackupResource(e.target.value)} className="border-gray-300" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Reason</Label>
            <Input id="reason" placeholder="Brief reason for leave…"
              value={reason} onChange={(e) => setReason(e.target.value)} className="border-gray-300" />
          </div>
        </div>
      </div>

      {/* Info Banner */}
      {leaveType && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-5 py-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-700">
            <span className="font-semibold">{leaveType}</span> — Your request will be routed to{" "}
            <span className="font-medium">{managerEmail || "your manager"}</span> for approval.
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-6 py-5">
        <Label htmlFor="comments" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Additional Comments
        </Label>
        <Textarea id="comments" placeholder="Any additional information for your manager…"
          value={comments} onChange={(e) => setComments(e.target.value)}
          className="mt-3 border-gray-200 resize-none h-[100px] text-sm" />
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="text-sm text-gray-500"><span className="text-red-500">*</span> Required fields</div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={handleReset} className="border-gray-300 text-gray-600">Cancel</Button>
          <Button type="submit" disabled={submitting} style={{ backgroundColor: p }}
            className="text-white min-w-[140px] hover:opacity-90">
            {submitting ? <span className="flex items-center gap-2"><Spinner className="h-4 w-4" /> Submitting...</span> : "Submit Request"}
          </Button>
        </div>
      </div>
    </form>
  );
}

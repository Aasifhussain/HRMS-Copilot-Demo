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

const LEAVE_ENDPOINT = "/api/proxy/leave";

const LEAVE_TYPES = [
  "Annual Leave",
  "Sick Leave",
  "Casual Leave",
  "Emergency Leave",
  "Maternity Leave",
  "Paternity Leave",
  "Bereavement Leave",
  "Study / Exam Leave",
  "Unpaid Leave",
];

const LOCKED_EMPLOYEE_ID = "RC-10045";
const LOCKED_EMPLOYEE_NAME = "John Smith";
const LOCKED_MANAGER_EMAIL = "asif.hussain@royalcyber.com";
const LOCKED_MANAGER_ID = "RC-MGR-205";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getNow() {
  const now = new Date();
  const date = formatDate(now);
  const time = now.toTimeString().split(" ")[0];
  return { date, time };
}

function calcBusinessDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
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
    <svg
      className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
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

export default function LeaveRequest() {
  const { toast } = useToast();

  const today = formatDate(new Date());

  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<{ leaveType: string; startDate: string; endDate: string; days: number } | null>(null);

  const businessDays = calcBusinessDays(startDate, endDate);

  function handleReset() {
    setSubmitted(false);
    setSubmittedData(null);
    setLeaveType("");
    setStartDate(today);
    setEndDate(today);
    setReason("");
    setComments("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!leaveType) {
      toast({ title: "Leave type required", description: "Please select a leave type.", variant: "destructive" });
      return;
    }
    if (!startDate || !endDate) {
      toast({ title: "Dates required", description: "Please select start and end dates.", variant: "destructive" });
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast({ title: "Invalid date range", description: "End date must be on or after start date.", variant: "destructive" });
      return;
    }
    if (!reason.trim()) {
      toast({ title: "Reason required", description: "Please provide a reason for the leave.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { date: creationDate, time: creationTime } = getNow();

    const payload = {
      employeeId: LOCKED_EMPLOYEE_ID,
      employeeName: LOCKED_EMPLOYEE_NAME,
      managerId: LOCKED_MANAGER_ID,
      managerEmail: LOCKED_MANAGER_EMAIL,
      submittedBy: LOCKED_EMPLOYEE_NAME,
      leaveType,
      startDate,
      endDate,
      numberOfDays: businessDays,
      reason: reason.trim(),
      comments: comments.trim(),
      status: "Pending",
      creationDate,
      creationTime,
    };

    try {
      const res = await fetch(LEAVE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok || res.status === 200 || res.status === 202) {
        setSubmittedData({ leaveType, startDate, endDate, days: businessDays });
        setSubmitted(true);
        toast({
          title: "Leave request submitted!",
          description: `Your ${leaveType} request has been sent to your manager.`,
        });
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      toast({
        title: "Submission failed",
        description: `Could not submit leave request. Please try again. (${err})`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
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
        <p className="text-gray-500 mb-2">
          Your <strong>{submittedData.leaveType}</strong> request has been sent to your manager.
        </p>
        <p className="text-gray-500 mb-2">
          Period: <strong className="text-gray-800">{submittedData.startDate}</strong> to{" "}
          <strong className="text-gray-800">{submittedData.endDate}</strong>
        </p>
        <p className="text-gray-500 mb-8">
          Business days: <strong className="text-gray-800">{submittedData.days}</strong>
        </p>
        <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5 text-sm text-yellow-700 mb-8">
          <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pending manager approval
        </div>
        <div>
          <Button onClick={handleReset} className="bg-[#e07800] hover:bg-[#c96900] text-white px-8">
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
          <Button
            type="submit"
            disabled={submitting}
            className="bg-[#e07800] hover:bg-[#c96900] text-white min-w-[120px]"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4" /> Submitting...
              </span>
            ) : (
              "Submit Request"
            )}
          </Button>
        </div>
      </div>

      {/* Employee Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
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
              Employee Name <LockedBadge />
            </Label>
            <div className="relative">
              <Input value={LOCKED_EMPLOYEE_NAME} readOnly className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed pr-8" />
              <LockIcon />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
              Manager Email <LockedBadge />
            </Label>
            <div className="relative">
              <Input value={LOCKED_MANAGER_EMAIL} readOnly className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed pr-8" />
              <LockIcon />
            </div>
          </div>
        </div>
      </div>

      {/* Leave Details Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Leave Details</h2>
        </div>
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Leave Type */}
          <div className="space-y-1.5 lg:col-span-1">
            <Label htmlFor="leaveType" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Leave Type <span className="text-red-500">*</span>
            </Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger className="border-gray-300 focus:border-[#e07800] focus:ring-[#e07800]/20">
                <SelectValue placeholder="Select leave type…" />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <Label htmlFor="startDate" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Start Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value > endDate) setEndDate(e.target.value);
              }}
              className="border-gray-300 focus:border-[#e07800] focus:ring-[#e07800]/20"
              required
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <Label htmlFor="endDate" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              End Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-gray-300 focus:border-[#e07800] focus:ring-[#e07800]/20"
              required
            />
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Business Days
            </Label>
            <div className={`h-10 px-3 flex items-center rounded-md border text-sm font-semibold
              ${businessDays > 0 ? "bg-orange-50 border-[#e07800]/30 text-[#e07800]" : "bg-gray-50 border-gray-200 text-gray-400"}
            `}>
              {businessDays > 0 ? `${businessDays} day${businessDays !== 1 ? "s" : ""}` : "–"}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
            <Label htmlFor="reason" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Reason <span className="text-red-500">*</span>
            </Label>
            <Input
              id="reason"
              placeholder="Brief reason for leave…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="border-gray-300 focus:border-[#e07800] focus:ring-[#e07800]/20"
              required
            />
          </div>
        </div>
      </div>

      {/* Leave Balance Info Banner */}
      {leaveType && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-5 py-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-700">
            <span className="font-semibold">{leaveType}</span> — Your request will be routed to{" "}
            <span className="font-medium">asif.hussain@royalcyber.com</span> for approval. You will receive a notification once it is reviewed.
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-6 py-5">
        <Label htmlFor="comments" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Additional Comments
        </Label>
        <Textarea
          id="comments"
          placeholder="Any additional information for your manager…"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="mt-3 border-gray-200 focus:border-[#e07800] focus:ring-[#e07800]/10 resize-none h-[100px] text-sm"
        />
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          <span className="text-red-500">*</span> Required fields
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={handleReset} className="border-gray-300 text-gray-600">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-[#e07800] hover:bg-[#c96900] text-white min-w-[140px]"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4" /> Submitting...
              </span>
            ) : (
              "Submit Request"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

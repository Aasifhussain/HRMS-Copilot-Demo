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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Trash2, Clock, ChevronLeft, ChevronRight, CalendarDays, ClipboardList } from "lucide-react";
import LeaveRequest from "./LeaveRequest";

const API_ENDPOINT = "/api/proxy/timesheet";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_FULL = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIME_CODES = [
  "REG",
  "OT",
  "PTO",
  "SICK",
  "HOL",
  "TRAIN",
  "ADMIN",
  "BENCH",
];

const ATTENDANCE_TYPES = ["Billable", "Non-Billable"];

const COST_CENTERS = [
  "CC-1001 - Engineering",
  "CC-1002 - Product",
  "CC-1003 - Sales",
  "CC-1004 - Marketing",
  "CC-1005 - Operations",
  "CC-1006 - Finance",
  "CC-1007 - HR",
];

const PROJECTS = [
  "Project Alpha",
  "Project Beta",
  "Project Gamma",
  "Project Delta",
  "Internal",
  "Innovation Lab",
  "Support & Maintenance",
];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDisplay(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatLong(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getNow() {
  const now = new Date();
  const date = formatDate(now);
  const time = now.toTimeString().split(" ")[0];
  return { date, time };
}

interface TimesheetRow {
  id: string;
  project: string;
  costCenter: string;
  attendanceType: string;
  timeCode: string;
  hours: Record<string, string>;
}

function makeRow(): TimesheetRow {
  return {
    id: crypto.randomUUID(),
    project: "",
    costCenter: "",
    attendanceType: "",
    timeCode: "",
    hours: { Mon: "", Tue: "", Wed: "", Thu: "", Fri: "", Sat: "", Sun: "" },
  };
}

function rowTotal(row: TimesheetRow): number {
  return DAYS.reduce((sum, d) => sum + (parseFloat(row.hours[d]) || 0), 0);
}

function dayTotal(rows: TimesheetRow[], day: string): number {
  return rows.reduce((sum, r) => sum + (parseFloat(r.hours[day]) || 0), 0);
}

function grandTotal(rows: TimesheetRow[]): number {
  return rows.reduce((sum, r) => sum + rowTotal(r), 0);
}

export default function Timesheet() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"timesheet" | "leave">("timesheet");

  const today = new Date();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(today));
  const weekEnd = addDays(weekStart, 6);

  const weekDates = DAYS.map((_, i) => addDays(weekStart, i));

  const employeeId = "RC-10045";
  const employeeIdM = "RC-MGR-205";
  const employeeName = "John Smith";
  const submittedBy = "John Smith";
  const managerEmail = "asif.hussain@royalcyber.com";
  const counter = "TS-2026-W13";
  const [comments, setComments] = useState("");

  const [rows, setRows] = useState<TimesheetRow[]>([makeRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function prevWeek() {
    setWeekStart((w) => addDays(w, -7));
  }
  function nextWeek() {
    setWeekStart((w) => addDays(w, 7));
  }

  function addRow() {
    setRows((r) => [...r, makeRow()]);
  }

  function removeRow(id: string) {
    setRows((r) => r.filter((row) => row.id !== id));
  }

  function updateRow(id: string, field: keyof TimesheetRow, value: string) {
    setRows((r) =>
      r.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  }

  function updateHours(id: string, day: string, value: string) {
    if (value !== "" && (isNaN(parseFloat(value)) || parseFloat(value) < 0))
      return;
    setRows((r) =>
      r.map((row) =>
        row.id === id
          ? { ...row, hours: { ...row.hours, [day]: value } }
          : row
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!employeeId || !employeeIdM || !employeeName || !managerEmail) {
      toast({
        title: "Missing required fields",
        description: "Please fill in Employee ID, Manager ID, Name, and Manager Email.",
        variant: "destructive",
      });
      return;
    }

    const total = grandTotal(rows);
    if (total === 0) {
      toast({
        title: "No hours entered",
        description: "Please enter at least some hours before submitting.",
        variant: "destructive",
      });
      return;
    }

    for (const row of rows) {
      if (!row.project || !row.costCenter || !row.attendanceType || !row.timeCode) {
        toast({
          title: "Incomplete timesheet row",
          description:
            "Each row must have a project, cost center, attendance type, and time code.",
          variant: "destructive",
        });
        return;
      }
    }

    setSubmitting(true);

    const { date: creationDate, time: creationTime } = getNow();

    const primaryRow = rows[0];

    const payload = {
      employeeId,
      employeeIdM,
      counter: counter || `TS-${Date.now()}`,
      employeeName,
      hours: total,
      periodStart: formatDate(weekStart),
      periodEnd: formatDate(weekEnd),
      project: rows.map((r) => r.project).join(", "),
      costCenter: rows.map((r) => r.costCenter).join(", "),
      attendanceType: primaryRow.attendanceType,
      timeCode: primaryRow.timeCode,
      submittedBy: submittedBy || employeeName,
      managerEmail,
      creationDate,
      creationTime,
      comments,
    };

    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok || res.status === 200 || res.status === 202) {
        setSubmitted(true);
        toast({
          title: "Timesheet submitted!",
          description: `${total} hours submitted for ${formatLong(weekStart)} – ${formatLong(weekEnd)}.`,
        });
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      toast({
        title: "Submission failed",
        description: `Could not submit timesheet. Please try again. (${err})`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setSubmitted(false);
    setRows([makeRow()]);
    setComments("");
  }

  const isCurrentWeek =
    getWeekStart(today).getTime() === weekStart.getTime();

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Top Header Bar */}
      <header className="bg-[#e07800] text-white">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="font-semibold text-lg tracking-wide">Workday</span>
            </div>
            <span className="text-orange-200 text-sm">Time Tracking</span>
          </div>
          <div className="text-sm text-orange-100">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-2 text-sm text-gray-500 flex items-center gap-2">
          <span className="text-[#e07800] font-medium cursor-pointer hover:underline">Home</span>
          <span>/</span>
          <span className="text-[#e07800] font-medium cursor-pointer hover:underline">Time</span>
          <span>/</span>
          <span className="text-gray-700 font-medium">
            {activeTab === "timesheet" ? "Enter Time" : "Leave Request"}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-0">
            <button
              type="button"
              onClick={() => setActiveTab("timesheet")}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors
                ${activeTab === "timesheet"
                  ? "border-[#e07800] text-[#e07800]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <ClipboardList className="h-4 w-4" />
              Timesheet Entry
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("leave")}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors
                ${activeTab === "leave"
                  ? "border-[#e07800] text-[#e07800]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <CalendarDays className="h-4 w-4" />
              Leave Request
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === "leave" ? (
          <LeaveRequest />
        ) : submitted ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Timesheet Submitted</h2>
            <p className="text-gray-500 mb-6">
              Your timesheet for{" "}
              <strong>
                {formatLong(weekStart)} – {formatLong(weekEnd)}
              </strong>{" "}
              has been submitted successfully.
            </p>
            <p className="text-gray-500 mb-8">
              Total hours: <strong className="text-gray-800">{grandTotal(rows).toFixed(2)}</strong>
            </p>
            <Button
              onClick={handleReset}
              className="bg-[#e07800] hover:bg-[#c96900] text-white px-8"
            >
              Submit Another Timesheet
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Page Title */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">Enter Time</h1>
                <p className="text-sm text-gray-500 mt-0.5">Weekly timesheet entry</p>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="border-gray-300 text-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#e07800] hover:bg-[#c96900] text-white min-w-[110px]"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="h-4 w-4" /> Submitting...
                    </span>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
            </div>

            {/* Employee Info Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Employee Information
                </h2>
              </div>
              <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="employeeId" className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                    Employee ID
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200 normal-case tracking-normal">locked</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="employeeId"
                      value={employeeId}
                      readOnly
                      className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none pr-8"
                    />
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="employeeName" className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                    Employee Name
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200 normal-case tracking-normal">locked</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="employeeName"
                      value={employeeName}
                      readOnly
                      className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none pr-8"
                    />
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="submittedBy" className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                    Submitted By
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200 normal-case tracking-normal">locked</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="submittedBy"
                      value={submittedBy}
                      readOnly
                      className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none pr-8"
                    />
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="employeeIdM" className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                    Manager Employee ID
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200 normal-case tracking-normal">locked</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="employeeIdM"
                      value={employeeIdM}
                      readOnly
                      className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none pr-8"
                    />
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="managerEmail" className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                    Manager Email
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200 normal-case tracking-normal">locked</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="managerEmail"
                      type="email"
                      value={managerEmail}
                      readOnly
                      className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none pr-8"
                    />
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="counter" className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                    Timesheet Counter
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200 normal-case tracking-normal">locked</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="counter"
                      value={counter}
                      readOnly
                      className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none pr-8"
                    />
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Week Navigator */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Time Period
                  </h2>
                  <p className="text-base font-semibold text-gray-800 mt-0.5">
                    {formatLong(weekStart)} – {formatLong(weekEnd)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!isCurrentWeek && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setWeekStart(getWeekStart(today))}
                      className="text-xs text-[#e07800] border-[#e07800]/30 hover:bg-orange-50"
                    >
                      This Week
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={prevWeek}
                    className="border-gray-300 text-gray-600 hover:bg-gray-50 px-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={nextWeek}
                    className="border-gray-300 text-gray-600 hover:bg-gray-50 px-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Hours Entry Grid */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#f8f8f8] border-b border-gray-200">
                      <TableHead className="text-xs font-semibold text-gray-600 uppercase w-[180px] px-4">
                        Project
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 uppercase w-[170px] px-3">
                        Cost Center
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 uppercase w-[140px] px-3">
                        Type
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 uppercase w-[100px] px-3">
                        Time Code
                      </TableHead>
                      {DAYS.map((d, i) => (
                        <TableHead
                          key={d}
                          className={`text-center px-2 min-w-[68px] ${
                            i >= 5 ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          <div className="text-xs font-semibold uppercase">{d}</div>
                          <div className={`text-[11px] font-normal mt-0.5 ${
                            formatDate(weekDates[i]) === formatDate(today)
                              ? "text-[#e07800] font-semibold"
                              : i >= 5
                              ? "text-gray-400"
                              : "text-gray-400"
                          }`}>
                            {formatDisplay(weekDates[i])}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="text-center text-xs font-semibold text-gray-600 uppercase px-3 min-w-[60px]">
                        Total
                      </TableHead>
                      <TableHead className="w-10 px-2" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, idx) => (
                      <TableRow
                        key={row.id}
                        className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}`}
                      >
                        {/* Project */}
                        <TableCell className="px-4 py-2">
                          <Select
                            value={row.project}
                            onValueChange={(v) => updateRow(row.id, "project", v)}
                          >
                            <SelectTrigger className="h-8 text-xs border-gray-200 focus:border-[#e07800] focus:ring-0">
                              <SelectValue placeholder="Select…" />
                            </SelectTrigger>
                            <SelectContent>
                              {PROJECTS.map((p) => (
                                <SelectItem key={p} value={p} className="text-xs">
                                  {p}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* Cost Center */}
                        <TableCell className="px-3 py-2">
                          <Select
                            value={row.costCenter}
                            onValueChange={(v) => updateRow(row.id, "costCenter", v)}
                          >
                            <SelectTrigger className="h-8 text-xs border-gray-200 focus:border-[#e07800] focus:ring-0">
                              <SelectValue placeholder="Select…" />
                            </SelectTrigger>
                            <SelectContent>
                              {COST_CENTERS.map((cc) => (
                                <SelectItem key={cc} value={cc} className="text-xs">
                                  {cc}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* Attendance Type */}
                        <TableCell className="px-3 py-2">
                          <Select
                            value={row.attendanceType}
                            onValueChange={(v) => updateRow(row.id, "attendanceType", v)}
                          >
                            <SelectTrigger className="h-8 text-xs border-gray-200 focus:border-[#e07800] focus:ring-0">
                              <SelectValue placeholder="Select…" />
                            </SelectTrigger>
                            <SelectContent>
                              {ATTENDANCE_TYPES.map((at) => (
                                <SelectItem key={at} value={at} className="text-xs">
                                  {at}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* Time Code */}
                        <TableCell className="px-3 py-2">
                          <Select
                            value={row.timeCode}
                            onValueChange={(v) => updateRow(row.id, "timeCode", v)}
                          >
                            <SelectTrigger className="h-8 text-xs border-gray-200 focus:border-[#e07800] focus:ring-0">
                              <SelectValue placeholder="Code…" />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_CODES.map((tc) => (
                                <SelectItem key={tc} value={tc} className="text-xs font-mono">
                                  {tc}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* Day Inputs */}
                        {DAYS.map((d, i) => (
                          <TableCell key={d} className="px-1 py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="24"
                              step="0.5"
                              placeholder="–"
                              value={row.hours[d]}
                              onChange={(e) => updateHours(row.id, d, e.target.value)}
                              className={`w-14 h-8 text-center text-sm rounded border focus:outline-none focus:ring-1 focus:ring-[#e07800] focus:border-[#e07800] transition-colors
                                ${i >= 5 ? "bg-gray-50 text-gray-400 border-gray-100" : "bg-white border-gray-200 text-gray-800"}
                                ${parseFloat(row.hours[d]) > 0 ? "border-[#e07800]/40 bg-orange-50/30 text-gray-800 font-medium" : ""}
                              `}
                            />
                          </TableCell>
                        ))}

                        {/* Row Total */}
                        <TableCell className="px-3 py-2 text-center">
                          <span className={`text-sm font-semibold ${rowTotal(row) > 0 ? "text-[#e07800]" : "text-gray-300"}`}>
                            {rowTotal(row) > 0 ? rowTotal(row).toFixed(2) : "–"}
                          </span>
                        </TableCell>

                        {/* Delete Row */}
                        <TableCell className="px-2 py-2">
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            disabled={rows.length === 1}
                            className="text-gray-300 hover:text-red-400 disabled:opacity-0 disabled:cursor-default transition-colors p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Totals Row */}
                    <TableRow className="bg-[#f8f8f8] border-t-2 border-gray-200">
                      <TableCell colSpan={4} className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Daily Totals
                      </TableCell>
                      {DAYS.map((d, i) => (
                        <TableCell key={d} className="px-1 py-2.5 text-center">
                          <span className={`text-sm font-bold ${dayTotal(rows, d) > 0 ? "text-gray-800" : "text-gray-300"} ${i >= 5 ? "text-gray-400" : ""}`}>
                            {dayTotal(rows, d) > 0 ? dayTotal(rows, d).toFixed(2) : "–"}
                          </span>
                        </TableCell>
                      ))}
                      <TableCell className="px-3 py-2.5 text-center">
                        <span className={`text-sm font-bold ${grandTotal(rows) > 0 ? "text-[#e07800]" : "text-gray-300"}`}>
                          {grandTotal(rows) > 0 ? grandTotal(rows).toFixed(2) : "–"}
                        </span>
                      </TableCell>
                      <TableCell className="w-10 px-2" />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Add Row */}
              <div className="px-6 py-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addRow}
                  className="text-[#e07800] hover:text-[#c96900] hover:bg-orange-50 text-sm gap-1.5 px-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Row
                </Button>
              </div>
            </div>

            {/* Summary + Comments */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Summary Card */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                  Summary
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Period</span>
                    <span className="text-sm font-medium text-gray-700">
                      {formatDisplay(weekStart)} – {formatDisplay(weekEnd)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Weekday Hours</span>
                    <span className="text-sm font-medium text-gray-700">
                      {(["Mon", "Tue", "Wed", "Thu", "Fri"] as const)
                        .reduce((s, d) => s + dayTotal(rows, d), 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Weekend Hours</span>
                    <span className="text-sm font-medium text-gray-700">
                      {(["Sat", "Sun"] as const)
                        .reduce((s, d) => s + dayTotal(rows, d), 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Total Hours</span>
                    <span className="text-lg font-bold text-[#e07800]">
                      {grandTotal(rows).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 lg:col-span-2">
                <Label htmlFor="comments" className="text-sm font-semibold text-gray-700 uppercase tracking-wide text-xs">
                  Comments / Notes
                </Label>
                <Textarea
                  id="comments"
                  placeholder="Add any notes or comments for your manager…"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="mt-3 border-gray-200 focus:border-[#e07800] focus:ring-[#e07800]/10 resize-none h-[110px] text-sm"
                />
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                <span className="text-red-500">*</span> Required fields
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="border-gray-300 text-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#e07800] hover:bg-[#c96900] text-white min-w-[110px]"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="h-4 w-4" /> Submitting...
                    </span>
                  ) : (
                    "Submit Timesheet"
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

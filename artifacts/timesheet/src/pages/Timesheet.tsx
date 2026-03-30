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
import { Plus, Trash2, ChevronLeft, ChevronRight, CalendarDays, ClipboardList } from "lucide-react";
import workdayLogo from "@assets/129-1291610_workday-logo-workday-logo-png-transparent-png_1774639736661.png";
import LeaveRequest from "./LeaveRequest";
import { THEMES, THEME_LIST, type ThemeId, type AppTheme, loadTheme, saveTheme } from "@/lib/themes";

const API_KEY = "G2JylRhOWQ8Xa0Z5OmCI7W9DfLXJCYPA";
const API_ENDPOINT =
  "https://defaultd508624fa0b74fd3951105b18ca027.84.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/d419424dcb78497fa8988d5a8e465792/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=DW34F2ORKLfJ7Vi_J2r7GX5Eg32vkbYgD23G-1VlG8U";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TIME_CODES = ["REG", "OT", "PTO", "SICK", "HOL", "TRAIN", "ADMIN", "BENCH"];
const ATTENDANCE_TYPES = ["Billable", "Non-Billable"];
const COST_CENTERS = [
  "CC-1001 - Engineering", "CC-1002 - Product", "CC-1003 - Sales",
  "CC-1004 - Marketing", "CC-1005 - Operations", "CC-1006 - Finance", "CC-1007 - HR",
];
const PROJECTS = [
  "Project Alpha", "Project Beta", "Project Gamma", "Project Delta",
  "Internal", "Innovation Lab", "Support & Maintenance",
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
  const d = new Date(date); d.setDate(d.getDate() + n); return d;
}
function formatDate(date: Date): string { return date.toISOString().split("T")[0]; }
function formatDisplay(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function formatLong(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
function getNow() {
  const now = new Date();
  return { date: formatDate(now), time: now.toTimeString().split(" ")[0] };
}

interface TimesheetRow {
  id: string; project: string; costCenter: string; attendanceType: string;
  timeCode: string; hours: Record<string, string>;
}
function makeRow(): TimesheetRow {
  return { id: crypto.randomUUID(), project: "", costCenter: "", attendanceType: "", timeCode: "",
    hours: { Mon: "", Tue: "", Wed: "", Thu: "", Fri: "", Sat: "", Sun: "" } };
}
function rowTotal(row: TimesheetRow) {
  return DAYS.reduce((s, d) => s + (parseFloat(row.hours[d]) || 0), 0);
}
function dayTotal(rows: TimesheetRow[], day: string) {
  return rows.reduce((s, r) => s + (parseFloat(r.hours[day]) || 0), 0);
}
function grandTotal(rows: TimesheetRow[]) {
  return rows.reduce((s, r) => s + rowTotal(r), 0);
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

function ThemeHeader({ theme, activeTab }: { theme: AppTheme; activeTab: string }) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  if (theme.id === "workday") {
    return (
      <header style={{ backgroundColor: theme.headerBg }} className="text-white">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={workdayLogo} alt="Workday" className="h-8 w-auto" />
            <span style={{ color: theme.headerSubText }} className="text-sm">Time Tracking</span>
          </div>
          <div style={{ color: theme.headerSubText }} className="text-sm">{today}</div>
        </div>
      </header>
    );
  }

  if (theme.id === "sap-fiori") {
    return (
      <header style={{ backgroundColor: theme.headerBg }}>
        <div className="max-w-7xl mx-auto px-6 py-0 flex items-center justify-between h-[44px]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="4" fill="#0070f2" />
                <text x="4" y="23" fontSize="14" fontWeight="bold" fill="white" fontFamily="Arial">SAP</text>
              </svg>
              <span className="text-white font-semibold text-sm tracking-wide">Fiori</span>
            </div>
            <div className="h-5 w-px bg-white/20" />
            <span className="text-white/80 text-sm">
              {activeTab === "timesheet" ? "My Time Recording" : "Leave Management"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ color: theme.headerSubText }} className="text-xs">{today}</span>
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">JS</div>
          </div>
        </div>
        <div style={{ backgroundColor: "#2a3d52" }} className="px-6 py-1.5">
          <div className="max-w-7xl mx-auto text-xs text-white/60 tracking-wide">
            SAP Fiori Launchpad &rsaquo; Human Capital Management &rsaquo;{" "}
            <span className="text-white/90">{activeTab === "timesheet" ? "Time Recording" : "Leave Request"}</span>
          </div>
        </div>
      </header>
    );
  }

  if (theme.id === "sap-s4hana") {
    return (
      <header style={{ backgroundColor: theme.headerBg }}>
        <div className="max-w-7xl mx-auto px-6 py-0 flex items-center justify-between h-[48px]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex flex-col leading-none">
                <span className="text-white font-black text-[13px] tracking-widest">SAP</span>
                <span className="text-[#5ba4cf] font-semibold text-[9px] tracking-widest uppercase">S/4HANA</span>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <span className="text-white/80 text-sm font-medium">Time Management</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span style={{ color: theme.headerSubText }} className="text-xs">{today}</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">JS</div>
            </div>
          </div>
        </div>
        <div style={{ backgroundColor: "#152233", borderBottom: "2px solid #0854a0" }}>
          <div className="max-w-7xl mx-auto px-6 flex gap-0">
            {["Worklist", activeTab === "timesheet" ? "Time Recording" : "Leave Request", "Reports"].map((item, i) => (
              <div key={item} className={`px-4 py-2 text-xs font-medium cursor-pointer transition-colors ${i === 1
                ? "text-white border-b-2 border-[#5ba4cf]"
                : "text-white/50 hover:text-white/80"}`}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </header>
    );
  }

  if (theme.id === "oracle-fusion") {
    return (
      <header style={{ backgroundColor: theme.headerBg }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-[52px]">
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-0.5">
              <span className="text-white font-black text-xl tracking-tight">ORACLE</span>
            </div>
            <div className="h-5 w-px bg-white/20" />
            <div className="flex flex-col leading-tight">
              <span className="text-white/90 text-[11px] font-semibold tracking-wide">FUSION CLOUD</span>
              <span style={{ color: theme.headerSubText }} className="text-[10px] tracking-wide">Human Capital Management</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span style={{ color: theme.headerSubText }} className="text-xs">{today}</span>
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded bg-[#c74634] flex items-center justify-center text-white text-xs font-bold">JS</div>
            </div>
          </div>
        </div>
        <div style={{ backgroundColor: "#1e1a18", borderBottom: "3px solid #c74634" }}>
          <div className="max-w-7xl mx-auto px-6 flex gap-0">
            {["Navigator", "Me", activeTab === "timesheet" ? "Time and Labor" : "Absence Management", "Tools"].map((item, i) => (
              <div key={item} className={`px-4 py-2 text-xs font-medium cursor-pointer transition-colors ${i === 2
                ? "text-white border-b-2 border-[#c74634]"
                : "text-white/40 hover:text-white/70"}`}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </header>
    );
  }

  return null;
}

export default function Timesheet() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"timesheet" | "leave">("timesheet");
  const [themeId, setThemeId] = useState<ThemeId>(() => loadTheme());
  const theme = THEMES[themeId];

  const today = new Date();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(today));
  const weekEnd = addDays(weekStart, 6);
  const weekDates = DAYS.map((_, i) => addDays(weekStart, i));

  const employeeId = "RC-10045";
  const employeeIdM = "RC-MGR-205";
  const employeeName = "John Smith";
  const submittedBy = "John Smith";
  const [managerEmail, setManagerEmail] = useState("asif.hussain@royalcyber.com");
  const counter = "TS-2026-W13";
  const [comments, setComments] = useState("");
  const [rows, setRows] = useState<TimesheetRow[]>([makeRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function prevWeek() { setWeekStart((w) => addDays(w, -7)); }
  function nextWeek() { setWeekStart((w) => addDays(w, 7)); }
  function addRow() { setRows((r) => [...r, makeRow()]); }
  function removeRow(id: string) { setRows((r) => r.filter((row) => row.id !== id)); }
  function updateRow(id: string, field: keyof TimesheetRow, value: string) {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }
  function updateHours(id: string, day: string, value: string) {
    if (value !== "" && (isNaN(parseFloat(value)) || parseFloat(value) < 0)) return;
    setRows((r) => r.map((row) => row.id === id ? { ...row, hours: { ...row.hours, [day]: value } } : row));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!managerEmail) {
      toast({ title: "Missing required fields", description: "Please fill in Manager Email.", variant: "destructive" });
      return;
    }
    const total = grandTotal(rows);
    if (total === 0) {
      toast({ title: "No hours entered", description: "Please enter at least some hours.", variant: "destructive" });
      return;
    }
    for (const row of rows) {
      if (!row.project || !row.costCenter || !row.attendanceType || !row.timeCode) {
        toast({ title: "Incomplete row", description: "Each row needs project, cost center, type, and time code.", variant: "destructive" });
        return;
      }
    }
    setSubmitting(true);
    const { date: creationDate, time: creationTime } = getNow();
    const primaryRow = rows[0];
    const payload = {
      employeeId, employeeIdM, counter: counter || `TS-${Date.now()}`, employeeName,
      hours: total, periodStart: formatDate(weekStart), periodEnd: formatDate(weekEnd),
      project: rows.map((r) => r.project).join(", "),
      costCenter: rows.map((r) => r.costCenter).join(", "),
      attendanceType: primaryRow.attendanceType, timeCode: primaryRow.timeCode,
      submittedBy: submittedBy || employeeName, managerEmail, creationDate, creationTime, comments,
    };
    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
        body: JSON.stringify(payload),
      });
      if (res.ok || res.status === 200 || res.status === 202) {
        setSubmitted(true);
        toast({ title: "Timesheet submitted!", description: `${total} hours submitted for ${formatLong(weekStart)} – ${formatLong(weekEnd)}.` });
      } else { throw new Error(`HTTP ${res.status}`); }
    } catch (err) {
      toast({ title: "Submission failed", description: `Could not submit timesheet. (${err})`, variant: "destructive" });
    } finally { setSubmitting(false); }
  }

  function handleReset() { setSubmitted(false); setRows([makeRow()]); setComments(""); }

  const isCurrentWeek = getWeekStart(today).getTime() === weekStart.getTime();

  const p = theme.primary;
  const ph = theme.primaryHover;

  return (
    <div style={{ backgroundColor: theme.bodyBg }} className="min-h-screen flex flex-col">
      <ThemeHeader theme={theme} activeTab={activeTab} />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-2 text-sm text-gray-500 flex items-center gap-2">
          <span style={{ color: theme.breadcrumbText }} className="font-medium cursor-pointer hover:underline">Home</span>
          <span>/</span>
          <span style={{ color: theme.breadcrumbText }} className="font-medium cursor-pointer hover:underline">Time</span>
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
            <button type="button" onClick={() => setActiveTab("timesheet")}
              className="flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors"
              style={activeTab === "timesheet"
                ? { borderColor: p, color: p }
                : { borderColor: "transparent", color: "#6b7280" }}>
              <ClipboardList className="h-4 w-4" />
              Timesheet Entry
            </button>
            <button type="button" onClick={() => setActiveTab("leave")}
              className="flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors"
              style={activeTab === "leave"
                ? { borderColor: p, color: p }
                : { borderColor: "transparent", color: "#6b7280" }}>
              <CalendarDays className="h-4 w-4" />
              Leave Request
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6 flex-1 w-full">
        {activeTab === "leave" ? (
          <LeaveRequest theme={theme} managerEmail={managerEmail} setManagerEmail={setManagerEmail} />
        ) : submitted ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Timesheet Submitted</h2>
            <p className="text-gray-500 mb-6">
              Your timesheet for <strong>{formatLong(weekStart)} – {formatLong(weekEnd)}</strong> has been submitted.
            </p>
            <p className="text-gray-500 mb-8">Total hours: <strong className="text-gray-800">{grandTotal(rows).toFixed(2)}</strong></p>
            <Button onClick={handleReset} style={{ backgroundColor: p }} className="text-white px-8 hover:opacity-90">
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
                <Button type="button" variant="outline" onClick={handleReset} className="border-gray-300 text-gray-600">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} style={{ backgroundColor: p }}
                  className="text-white min-w-[110px] hover:opacity-90"
                  onMouseOver={e => (e.currentTarget.style.backgroundColor = ph)}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = p)}>
                  {submitting ? <span className="flex items-center gap-2"><Spinner className="h-4 w-4" /> Submitting...</span> : "Submit"}
                </Button>
              </div>
            </div>

            {/* Employee Info Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div style={{ backgroundColor: theme.sectionHeaderBg }} className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Employee Information</h2>
              </div>
              <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Employee ID - locked */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                    Employee ID <LockedBadge />
                  </Label>
                  <div className="relative">
                    <Input value={employeeId} readOnly className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none pr-8" />
                    <LockIcon />
                  </div>
                </div>
                {/* Employee Name - locked */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                    Employee Name <LockedBadge />
                  </Label>
                  <div className="relative">
                    <Input value={employeeName} readOnly className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none pr-8" />
                    <LockIcon />
                  </div>
                </div>
                {/* Submitted By - locked */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                    Submitted By <LockedBadge />
                  </Label>
                  <div className="relative">
                    <Input value={submittedBy} readOnly className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none pr-8" />
                    <LockIcon />
                  </div>
                </div>
                {/* Manager Employee ID - locked */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                    Manager Employee ID <LockedBadge />
                  </Label>
                  <div className="relative">
                    <Input value={employeeIdM} readOnly className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none pr-8" />
                    <LockIcon />
                  </div>
                </div>
                {/* Manager Email - EDITABLE */}
                <div className="space-y-1.5">
                  <Label htmlFor="managerEmail" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Manager Email
                  </Label>
                  <Input
                    id="managerEmail"
                    type="email"
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                    placeholder="manager@company.com"
                    className="border-gray-300"
                    style={{ "--tw-ring-color": p } as React.CSSProperties}
                  />
                </div>
                {/* Timesheet Counter - locked */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                    Timesheet Counter <LockedBadge />
                  </Label>
                  <div className="relative">
                    <Input value={counter} readOnly className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none pr-8" />
                    <LockIcon />
                  </div>
                </div>
              </div>
            </div>

            {/* Week Navigator + Hours Grid */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div style={{ backgroundColor: theme.sectionHeaderBg }} className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Time Period</h2>
                  <p className="text-base font-semibold text-gray-800 mt-0.5">{formatLong(weekStart)} – {formatLong(weekEnd)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!isCurrentWeek && (
                    <Button type="button" variant="outline" size="sm"
                      onClick={() => setWeekStart(getWeekStart(today))}
                      style={{ color: p, borderColor: theme.primaryLightBorder }}
                      className="text-xs hover:opacity-80">
                      This Week
                    </Button>
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={prevWeek}
                    className="border-gray-300 text-gray-600 hover:bg-gray-50 px-2">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={nextWeek}
                    className="border-gray-300 text-gray-600 hover:bg-gray-50 px-2">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow style={{ backgroundColor: theme.tableHeaderBg }} className="border-b border-gray-200">
                      <TableHead className="text-xs font-semibold text-gray-600 uppercase w-[180px] px-4">Project</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 uppercase w-[170px] px-3">Cost Center</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 uppercase w-[140px] px-3">Type</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 uppercase w-[100px] px-3">Time Code</TableHead>
                      {DAYS.map((d, i) => (
                        <TableHead key={d} className={`text-center px-2 min-w-[68px] ${i >= 5 ? "text-gray-400" : "text-gray-600"}`}>
                          <div className="text-xs font-semibold uppercase">{d}</div>
                          <div className="text-[11px] font-normal mt-0.5"
                            style={formatDate(weekDates[i]) === formatDate(today) ? { color: p, fontWeight: 600 } : { color: "#9ca3af" }}>
                            {formatDisplay(weekDates[i])}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="text-center text-xs font-semibold text-gray-600 uppercase px-3 min-w-[60px]">Total</TableHead>
                      <TableHead className="w-10 px-2" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, idx) => (
                      <TableRow key={row.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}`}>
                        <TableCell className="px-4 py-2">
                          <Select value={row.project} onValueChange={(v) => updateRow(row.id, "project", v)}>
                            <SelectTrigger className="h-8 text-xs border-gray-200"><SelectValue placeholder="Select…" /></SelectTrigger>
                            <SelectContent>{PROJECTS.map((p) => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <Select value={row.costCenter} onValueChange={(v) => updateRow(row.id, "costCenter", v)}>
                            <SelectTrigger className="h-8 text-xs border-gray-200"><SelectValue placeholder="Select…" /></SelectTrigger>
                            <SelectContent>{COST_CENTERS.map((cc) => <SelectItem key={cc} value={cc} className="text-xs">{cc}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <Select value={row.attendanceType} onValueChange={(v) => updateRow(row.id, "attendanceType", v)}>
                            <SelectTrigger className="h-8 text-xs border-gray-200"><SelectValue placeholder="Select…" /></SelectTrigger>
                            <SelectContent>{ATTENDANCE_TYPES.map((at) => <SelectItem key={at} value={at} className="text-xs">{at}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <Select value={row.timeCode} onValueChange={(v) => updateRow(row.id, "timeCode", v)}>
                            <SelectTrigger className="h-8 text-xs border-gray-200"><SelectValue placeholder="Code…" /></SelectTrigger>
                            <SelectContent>{TIME_CODES.map((tc) => <SelectItem key={tc} value={tc} className="text-xs font-mono">{tc}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        {DAYS.map((d, i) => (
                          <TableCell key={d} className="px-1 py-2 text-center">
                            <input type="number" min="0" max="24" step="0.5" placeholder="–"
                              value={row.hours[d]} onChange={(e) => updateHours(row.id, d, e.target.value)}
                              className={`w-14 h-8 text-center text-sm rounded border focus:outline-none focus:ring-1 transition-colors ${i >= 5 ? "bg-gray-50 text-gray-400 border-gray-100" : "bg-white border-gray-200 text-gray-800"}`}
                              style={parseFloat(row.hours[d]) > 0 ? { borderColor: theme.primaryLightBorder, backgroundColor: theme.primaryLight } : {}}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="px-3 py-2 text-center">
                          <span className="text-sm font-semibold"
                            style={{ color: rowTotal(row) > 0 ? p : "#d1d5db" }}>
                            {rowTotal(row) > 0 ? rowTotal(row).toFixed(2) : "–"}
                          </span>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <button type="button" onClick={() => removeRow(row.id)} disabled={rows.length === 1}
                            className="text-gray-300 hover:text-red-400 disabled:opacity-0 transition-colors p-1">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow style={{ backgroundColor: theme.tableHeaderBg }} className="border-t-2 border-gray-200">
                      <TableCell colSpan={4} className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Daily Totals</TableCell>
                      {DAYS.map((d, i) => (
                        <TableCell key={d} className="px-1 py-2.5 text-center">
                          <span className={`text-sm font-bold ${dayTotal(rows, d) > 0 ? "text-gray-800" : "text-gray-300"} ${i >= 5 ? "text-gray-400" : ""}`}>
                            {dayTotal(rows, d) > 0 ? dayTotal(rows, d).toFixed(2) : "–"}
                          </span>
                        </TableCell>
                      ))}
                      <TableCell className="px-3 py-2.5 text-center">
                        <span className="text-sm font-bold" style={{ color: grandTotal(rows) > 0 ? p : "#d1d5db" }}>
                          {grandTotal(rows) > 0 ? grandTotal(rows).toFixed(2) : "–"}
                        </span>
                      </TableCell>
                      <TableCell className="w-10 px-2" />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div className="px-6 py-3 border-t border-gray-100">
                <Button type="button" variant="ghost" size="sm" onClick={addRow}
                  style={{ color: p }} className="hover:opacity-80 hover:bg-gray-50 text-sm gap-1.5 px-2">
                  <Plus className="h-4 w-4" /> Add Row
                </Button>
              </div>
            </div>

            {/* Summary + Comments */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Period</span>
                    <span className="text-sm font-medium text-gray-700">{formatDisplay(weekStart)} – {formatDisplay(weekEnd)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Weekday Hours</span>
                    <span className="text-sm font-medium text-gray-700">
                      {(["Mon","Tue","Wed","Thu","Fri"] as const).reduce((s, d) => s + dayTotal(rows, d), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Weekend Hours</span>
                    <span className="text-sm font-medium text-gray-700">
                      {(["Sat","Sun"] as const).reduce((s, d) => s + dayTotal(rows, d), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Total Hours</span>
                    <span className="text-lg font-bold" style={{ color: p }}>{grandTotal(rows).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <Label htmlFor="comments" className="text-sm font-semibold text-gray-700 uppercase tracking-wide text-xs">Comments</Label>
                <Textarea id="comments" placeholder="Any notes for your manager…" value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="mt-3 border-gray-200 resize-none h-[120px] text-sm" />
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between">
              <span className="text-sm text-gray-500"><span className="text-red-500">*</span> Required fields</span>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={handleReset} className="border-gray-300 text-gray-600">Cancel</Button>
                <Button type="submit" disabled={submitting} style={{ backgroundColor: p }}
                  className="text-white min-w-[110px] hover:opacity-90">
                  {submitting ? <span className="flex items-center gap-2"><Spinner className="h-4 w-4" /> Submitting...</span> : "Submit"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </main>

      {/* Theme Switcher Footer */}
      <div className="border-t border-gray-300 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-end gap-3">
          <span className="text-xs text-gray-500 font-medium">Screen Style:</span>
          <select
            value={themeId}
            onChange={(e) => {
              const id = e.target.value as ThemeId;
              setThemeId(id);
              saveTheme(id);
            }}
            className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-1"
            style={{ focusRingColor: p } as React.CSSProperties}
          >
            {THEME_LIST.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

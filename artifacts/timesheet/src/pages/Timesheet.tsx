import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Trash2, ChevronLeft, ChevronRight, CalendarDays, ClipboardList } from "lucide-react";
import workdayLogo from "@assets/129-1291610_workday-logo-workday-logo-png-transparent-png_1774639736661.png";
import LeaveRequest from "./LeaveRequest";
import { THEME_LIST, type ThemeId, type AppTheme, loadTheme, saveTheme } from "@/lib/themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const API_KEY = "G2JylRhOWQ8Xa0Z5OmCI7W9DfLXJCYPA";
const API_ENDPOINT =
  "https://defaultd508624fa0b74fd3951105b18ca027.84.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/d419424dcb78497fa8988d5a8e465792/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=DW34F2ORKLfJ7Vi_J2r7GX5Eg32vkbYgD23G-1VlG8U";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_CODES = ["REG", "OT", "PTO", "SICK", "HOL", "TRAIN", "ADMIN", "BENCH"];
const ATTENDANCE_TYPES = ["Billable", "Non-Billable"];
const COST_CENTERS = ["CC-1001 - Engineering","CC-1002 - Product","CC-1003 - Sales","CC-1004 - Marketing","CC-1005 - Operations","CC-1006 - Finance","CC-1007 - HR"];
const PROJECTS = ["Project Alpha","Project Beta","Project Gamma","Project Delta","Internal","Innovation Lab","Support & Maintenance"];

function getWeekStart(date: Date): Date {
  const d = new Date(date), day = d.getDay(), diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff); d.setHours(0,0,0,0); return d;
}
function addDays(date: Date, n: number): Date { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function formatDate(date: Date): string { return date.toISOString().split("T")[0]; }
function formatDisplay(date: Date): string { return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
function formatLong(date: Date): string { return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); }
function formatShort(date: Date): string { return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }); }
function getNow() { const now = new Date(); return { date: formatDate(now), time: now.toTimeString().split(" ")[0] }; }

interface TimesheetRow { id: string; project: string; costCenter: string; attendanceType: string; timeCode: string; hours: Record<string, string>; }
function makeRow(): TimesheetRow { return { id: crypto.randomUUID(), project: "", costCenter: "", attendanceType: "", timeCode: "", hours: { Mon:"",Tue:"",Wed:"",Thu:"",Fri:"",Sat:"",Sun:"" } }; }
function rowTotal(row: TimesheetRow) { return DAYS.reduce((s,d) => s+(parseFloat(row.hours[d])||0), 0); }
function dayTotal(rows: TimesheetRow[], day: string) { return rows.reduce((s,r) => s+(parseFloat(r.hours[day])||0), 0); }
function grandTotal(rows: TimesheetRow[]) { return rows.reduce((s,r) => s+rowTotal(r), 0); }

// ─── Workday Theme ────────────────────────────────────────────────────────────
function WorkdayPage({ state }: { state: PageState }) {
  const { activeTab, setActiveTab, theme, weekStart, weekEnd, weekDates, today, isCurrentWeek,
    prevWeek, nextWeek, rows, addRow, removeRow, updateRow, updateHours, submitted, submitting,
    handleSubmit, handleReset, comments, setComments, employeeId, employeeIdM, employeeName,
    submittedBy, managerEmail, setManagerEmail, counter, themeId, setThemeId } = state;
  const p = theme.primary;
  return (
    <div style={{ background: theme.bodyBg }} className="min-h-screen flex flex-col">
      <header style={{ background: theme.headerBg }} className="text-white">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={workdayLogo} alt="Workday" className="h-8 w-auto" />
            <span style={{ color: theme.headerSubText }} className="text-sm">Time Tracking</span>
          </div>
          <div style={{ color: theme.headerSubText }} className="text-sm">{new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
        </div>
      </header>
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-2 text-sm text-gray-500 flex items-center gap-2">
          <span style={{ color: p }} className="font-medium cursor-pointer hover:underline">Home</span>
          <span>/</span><span style={{ color: p }} className="font-medium cursor-pointer hover:underline">Time</span>
          <span>/</span><span className="text-gray-700 font-medium">{activeTab==="timesheet"?"Enter Time":"Leave Request"}</span>
        </div>
      </div>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex">
            {(["timesheet","leave"] as const).map(tab => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                className="flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors"
                style={activeTab===tab ? {borderColor:p,color:p} : {borderColor:"transparent",color:"#6b7280"}}>
                {tab==="timesheet" ? <><ClipboardList className="h-4 w-4" />Timesheet Entry</> : <><CalendarDays className="h-4 w-4" />Leave Request</>}
              </button>
            ))}
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-6 py-6 flex-1 w-full">
        {activeTab==="leave" ? (
          <LeaveRequest theme={theme} managerEmail={managerEmail} setManagerEmail={setManagerEmail} />
        ) : submitted ? (
          <SuccessCard theme={theme} weekStart={weekStart} weekEnd={weekEnd} rows={rows} handleReset={handleReset} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between">
              <div><h1 className="text-2xl font-semibold text-gray-800">Enter Time</h1><p className="text-sm text-gray-500 mt-0.5">Weekly timesheet entry</p></div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={handleReset} className="border-gray-300 text-gray-600">Cancel</Button>
                <Button type="submit" disabled={submitting} style={{background:p}} className="text-white min-w-[110px] hover:opacity-90">
                  {submitting ? <span className="flex items-center gap-2"><Spinner className="h-4 w-4"/>Submitting...</span> : "Submit"}
                </Button>
              </div>
            </div>
            <WorkdayCard title="Employee Information" theme={theme}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <WdField label="Employee ID" locked><input value={employeeId} readOnly className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 cursor-not-allowed" /></WdField>
                <WdField label="Employee Name" locked><input value={employeeName} readOnly className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 cursor-not-allowed" /></WdField>
                <WdField label="Submitted By" locked><input value={submittedBy} readOnly className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 cursor-not-allowed" /></WdField>
                <WdField label="Manager Employee ID" locked><input value={employeeIdM} readOnly className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 cursor-not-allowed" /></WdField>
                <WdField label="Manager Email"><input type="email" value={managerEmail} onChange={e=>setManagerEmail(e.target.value)} className="w-full h-9 px-3 border border-gray-300 rounded text-sm" style={{outlineColor:p}} /></WdField>
                <WdField label="Timesheet Counter" locked><input value={counter} readOnly className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 cursor-not-allowed" /></WdField>
              </div>
            </WorkdayCard>
            <WorkdayCard title={`Time Period: ${formatLong(weekStart)} – ${formatLong(weekEnd)}`} theme={theme} headerRight={
              <div className="flex gap-2">
                {!isCurrentWeek && <button type="button" onClick={()=>state.setWeekStart(getWeekStart(today))} style={{color:p,borderColor:theme.primaryLightBorder}} className="text-xs border rounded px-2 py-1 hover:opacity-80">This Week</button>}
                <button type="button" onClick={prevWeek} className="border border-gray-300 rounded px-2 py-1 hover:bg-gray-50"><ChevronLeft className="h-4 w-4"/></button>
                <button type="button" onClick={nextWeek} className="border border-gray-300 rounded px-2 py-1 hover:bg-gray-50"><ChevronRight className="h-4 w-4"/></button>
              </div>
            }>
              <TimesheetGrid theme={theme} rows={rows} weekDates={weekDates} today={today} updateRow={updateRow} updateHours={updateHours} removeRow={removeRow} />
              <div className="px-6 py-3 border-t border-gray-100">
                <button type="button" onClick={addRow} style={{color:p}} className="flex items-center gap-1.5 text-sm hover:opacity-70"><Plus className="h-4 w-4"/>Add Row</button>
              </div>
            </WorkdayCard>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <SummaryCard theme={theme} rows={rows} weekStart={weekStart} weekEnd={weekEnd} />
              <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Comments</p>
                <textarea placeholder="Any notes for your manager…" value={comments} onChange={e=>setComments(e.target.value)} className="w-full border border-gray-200 rounded text-sm resize-none h-[100px] p-2" />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between">
              <span className="text-sm text-gray-500"><span className="text-red-500">*</span> Required</span>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={handleReset} className="border-gray-300 text-gray-600">Cancel</Button>
                <Button type="submit" disabled={submitting} style={{background:p}} className="text-white min-w-[110px] hover:opacity-90">
                  {submitting ? <span className="flex items-center gap-2"><Spinner className="h-4 w-4"/>Submitting...</span> : "Submit"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </main>
      <ThemeSwitcher themeId={themeId} setThemeId={setThemeId} />
    </div>
  );
}

function WorkdayCard({ title, theme, children, headerRight }: { title: string; theme: AppTheme; children: React.ReactNode; headerRight?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div style={{background:theme.sectionHeaderBg}} className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h2>
        {headerRight}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function WdField({ label, locked, children }: { label: string; locked?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</p>
        {locked && <span className="text-[10px] px-1 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">locked</span>}
      </div>
      {children}
    </div>
  );
}

// ─── SAP Fiori Theme ──────────────────────────────────────────────────────────
function FioriPage({ state }: { state: PageState }) {
  const { activeTab, setActiveTab, weekStart, weekEnd, weekDates, today, isCurrentWeek,
    prevWeek, nextWeek, rows, addRow, removeRow, updateRow, updateHours, submitted, submitting,
    handleSubmit, handleReset, comments, setComments, employeeId, employeeIdM, employeeName,
    submittedBy, managerEmail, setManagerEmail, counter, themeId, setThemeId } = state;
  const p = "#0070f2";
  return (
    <div style={{ background: "#f2f2f2", minHeight: "100vh", fontFamily: "'72', '72full', Arial, sans-serif", display: "flex", flexDirection: "column" }}>
      {/* SAP Fiori Shell Bar */}
      <div style={{ background: "#354a5e", height: "44px", display: "flex", alignItems: "center", padding: "0 4px", gap: "0", flexShrink: 0 }}>
        {/* Hamburger */}
        <button style={{ width: "44px", height: "44px", background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 18 18" width="18" height="18" fill="white"><rect y="2" width="18" height="2"/><rect y="8" width="18" height="2"/><rect y="14" width="18" height="2"/></svg>
        </button>
        {/* SAP Logo — official wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "4px", marginRight: "4px" }}>
          <svg viewBox="0 0 56 22" width="56" height="22" aria-label="SAP">
            {/* S */}
            <path d="M1 15.5c1.2 2.5 3.8 4 6.8 4 4.2 0 7-2.2 7-5.5 0-3-2.2-4.5-5.8-5.8C6.5 7.2 5 6.2 5 4.5 5 3 6.3 2 8.2 2c1.6 0 3 .8 4 2.2l2.5-2C13 .8 10.8 0 8.2 0 4.5 0 2 2.2 2 5.2c0 2.8 2 4.3 5.3 5.5 2.5.9 4.2 1.8 4.2 3.8 0 1.8-1.5 3-3.8 3-2 0-3.8-1-4.8-2.8L1 15.5z" fill="white"/>
            {/* A */}
            <path d="M24 0h-2.5L16 20h3l1.2-3.8h5.8L27.2 20h3L24 0zm-3 13.5l2-6.3 2 6.3h-4z" fill="white"/>
            {/* P */}
            <path d="M31 0v20h3V13h3.5c4 0 6.5-2.5 6.5-6.5S41.5 0 37.5 0H31zm3 10.5V2.5h3.5c2.3 0 3.5 1.3 3.5 4s-1.2 4-3.5 4H34z" fill="white"/>
          </svg>
          <div style={{ height: "20px", width: "1px", background: "rgba(255,255,255,0.3)" }} />
          <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "13px", fontWeight: "500", letterSpacing: "0.02em" }}>S/4HANA</span>
        </div>
        <div style={{ height: "28px", width: "1px", background: "rgba(255,255,255,0.2)", marginRight: "12px", marginLeft: "4px" }} />
        {/* App title */}
        <span style={{ color: "white", fontSize: "14px", fontWeight: "600", letterSpacing: "0.01em" }}>
          {activeTab === "timesheet" ? "My Timesheet" : "Leave Request"}
        </span>
        <div style={{ flex: 1 }} />
        {/* Search */}
        <button title="Search" style={{ width: "44px", height: "44px", background: "none", border: "none", color: "rgba(255,255,255,0.75)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7.5" cy="7.5" r="5.5"/><path d="M12 12l4 4" strokeLinecap="round"/></svg>
        </button>
        {/* Notifications */}
        <button title="Notifications" style={{ width: "44px", height: "44px", background: "none", border: "none", color: "rgba(255,255,255,0.75)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 18 18" width="18" height="18" fill="currentColor"><path d="M9 1a1 1 0 011 1v.5A5.5 5.5 0 0115.5 8v3.5l1.5 1.5v.5H1v-.5L2.5 11.5V8A5.5 5.5 0 018 2.5V2a1 1 0 011-1zM7.5 15.5h3a1.5 1.5 0 01-3 0z"/></svg>
        </button>
        {/* Grid/Launchpad */}
        <button title="Launchpad" style={{ width: "44px", height: "44px", background: "none", border: "none", color: "rgba(255,255,255,0.75)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 18 18" width="18" height="18" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="11" y="1" width="6" height="6" rx="1"/><rect x="1" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/></svg>
        </button>
        {/* User avatar */}
        <div title="John Smith" style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#0070f2", border: "2px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px", fontWeight: "700", cursor: "pointer", marginLeft: "4px", marginRight: "4px", letterSpacing: "0.03em" }}>JS</div>
      </div>

      {/* Dynamic Page Header */}
      <div style={{ background: "white", borderBottom: "1px solid #d9d9d9", padding: "12px 48px 0" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: "12px", color: "#6a6d70", marginBottom: "8px" }}>
          <span style={{ color: p, cursor: "pointer" }}>SAP Fiori Launchpad</span>
          {" › "}
          <span style={{ color: p, cursor: "pointer" }}>Human Capital Management</span>
          {" › "}
          <span>{activeTab === "timesheet" ? "My Timesheet" : "Leave Request"}</span>
        </div>
        {/* Page title + attributes */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: "12px" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#32363a", margin: 0 }}>
              {activeTab === "timesheet" ? "My Timesheet" : "Leave Request"}
            </h1>
            <div style={{ display: "flex", gap: "24px", marginTop: "6px" }}>
              <span style={{ fontSize: "13px", color: "#6a6d70" }}>Employee: <strong style={{ color: "#32363a" }}>John Smith</strong></span>
              <span style={{ fontSize: "13px", color: "#6a6d70" }}>
                {activeTab === "timesheet" ? <>Period: <strong style={{ color: "#32363a" }}>{formatShort(weekStart)} – {formatShort(weekEnd)}</strong></> : ""}
              </span>
              <span style={{ fontSize: "12px", padding: "2px 8px", background: "#e8f3ff", color: p, border: `1px solid ${p}`, borderRadius: "2px", fontWeight: "600" }}>Draft</span>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "0", marginTop: "4px" }}>
          {(["timesheet","leave"] as const).map(tab => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              style={{ padding: "8px 20px", fontSize: "13px", fontWeight: "600", border: "none", background: "none", cursor: "pointer", borderBottom: activeTab===tab ? `3px solid ${p}` : "3px solid transparent", color: activeTab===tab ? p : "#6a6d70" }}>
              {tab === "timesheet" ? "Time Entry" : "Leave"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "24px 48px", overflowY: "auto" }}>
        {activeTab === "leave" ? (
          <LeaveRequest theme={state.theme} managerEmail={managerEmail} setManagerEmail={setManagerEmail} />
        ) : submitted ? (
          <SuccessCard theme={state.theme} weekStart={weekStart} weekEnd={weekEnd} rows={rows} handleReset={handleReset} />
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Fiori Section: Employee */}
            <FioriSection title="Employee Information">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0" }}>
                <FioriField label="Employee ID" locked value={employeeId} />
                <FioriField label="Employee Name" locked value={employeeName} />
                <FioriField label="Submitted By" locked value={submittedBy} />
                <FioriField label="Manager ID" locked value={employeeIdM} />
                <FioriFieldEditable label="Manager Email" value={managerEmail} onChange={setManagerEmail} type="email" accent={p} />
                <FioriField label="Period" locked value={`${formatShort(weekStart)} – ${formatShort(weekEnd)}`} />
              </div>
            </FioriSection>

            {/* Fiori Section: Time Entry */}
            <FioriSection title="Time Entry" actions={
              <div style={{ display: "flex", gap: "8px" }}>
                <FioriBtn onClick={prevWeek} outline accent={p}><ChevronLeft className="h-4 w-4"/></FioriBtn>
                {!isCurrentWeek && <FioriBtn onClick={() => state.setWeekStart(getWeekStart(today))} outline accent={p} type="button">Today</FioriBtn>}
                <FioriBtn onClick={nextWeek} outline accent={p}><ChevronRight className="h-4 w-4"/></FioriBtn>
              </div>
            }>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f7f7f7", borderBottom: "2px solid #e5e5e5" }}>
                      {["Project","Cost Center","Type","Time Code",...DAYS.map((d,i)=>`${d}\n${formatDisplay(weekDates[i])}`),"Total",""].map((h,i) => (
                        <th key={i} style={{ padding: "8px 10px", textAlign: i>=4&&i<=10?"center":"left", fontWeight: "700", color: "#32363a", fontSize: "12px", borderRight: "1px solid #e5e5e5", whiteSpace: "pre-line", minWidth: i>=4&&i<=10?"64px":"auto" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={row.id} style={{ background: idx%2===0?"white":"#fafafa", borderBottom: "1px solid #e5e5e5" }}>
                        <td style={{ padding: "6px 8px", borderRight: "1px solid #e5e5e5" }}>
                          <FioriSelect value={row.project} onChange={v=>updateRow(row.id,"project",v)} options={PROJECTS} placeholder="Select…" accent={p} />
                        </td>
                        <td style={{ padding: "6px 8px", borderRight: "1px solid #e5e5e5" }}>
                          <FioriSelect value={row.costCenter} onChange={v=>updateRow(row.id,"costCenter",v)} options={COST_CENTERS} placeholder="Select…" accent={p} />
                        </td>
                        <td style={{ padding: "6px 8px", borderRight: "1px solid #e5e5e5" }}>
                          <FioriSelect value={row.attendanceType} onChange={v=>updateRow(row.id,"attendanceType",v)} options={ATTENDANCE_TYPES} placeholder="Select…" accent={p} />
                        </td>
                        <td style={{ padding: "6px 8px", borderRight: "1px solid #e5e5e5" }}>
                          <FioriSelect value={row.timeCode} onChange={v=>updateRow(row.id,"timeCode",v)} options={TIME_CODES} placeholder="Code…" accent={p} />
                        </td>
                        {DAYS.map((d,i) => (
                          <td key={d} style={{ padding: "4px", textAlign: "center", borderRight: "1px solid #e5e5e5", background: i>=5?"#f9f9f9":"" }}>
                            <input type="number" min="0" max="24" step="0.5" placeholder="–" value={row.hours[d]}
                              onChange={e=>updateHours(row.id,d,e.target.value)}
                              style={{ width: "52px", height: "28px", textAlign: "center", border: `1px solid ${parseFloat(row.hours[d])>0?p:"#d9d9d9"}`, borderRadius: "2px", fontSize: "13px", outline: "none", background: parseFloat(row.hours[d])>0?"#e8f3ff":"white" }} />
                          </td>
                        ))}
                        <td style={{ padding: "6px 10px", textAlign: "center", fontWeight: "700", color: rowTotal(row)>0?p:"#ccc", borderRight: "1px solid #e5e5e5" }}>
                          {rowTotal(row)>0?rowTotal(row).toFixed(2):"–"}
                        </td>
                        <td style={{ padding: "4px 8px", textAlign: "center" }}>
                          <button type="button" onClick={()=>removeRow(row.id)} disabled={rows.length===1} style={{ color: "#e9730c", background: "none", border: "none", cursor: rows.length===1?"not-allowed":"pointer", opacity: rows.length===1?0:1, fontSize: "16px" }}>✕</button>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: "#f7f7f7", borderTop: "2px solid #d9d9d9" }}>
                      <td colSpan={4} style={{ padding: "8px 10px", fontWeight: "700", fontSize: "12px", color: "#32363a" }}>TOTAL</td>
                      {DAYS.map(d => (
                        <td key={d} style={{ textAlign: "center", padding: "8px 4px", fontWeight: "700", color: dayTotal(rows,d)>0?"#32363a":"#ccc", fontSize: "13px" }}>
                          {dayTotal(rows,d)>0?dayTotal(rows,d).toFixed(2):"–"}
                        </td>
                      ))}
                      <td style={{ textAlign: "center", fontWeight: "700", color: grandTotal(rows)>0?p:"#ccc" }}>{grandTotal(rows)>0?grandTotal(rows).toFixed(2):"–"}</td>
                      <td/>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ padding: "8px 16px", borderTop: "1px solid #e5e5e5" }}>
                <button type="button" onClick={addRow} style={{ color: p, background: "none", border: `1px solid ${p}`, borderRadius: "2px", padding: "4px 12px", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "16px" }}>+</span> Add Row
                </button>
              </div>
            </FioriSection>

            {/* Fiori Section: Notes */}
            <FioriSection title="Notes">
              <div style={{ padding: "0 24px 16px" }}>
                <textarea placeholder="Add a note…" value={comments} onChange={e=>setComments(e.target.value)}
                  style={{ width: "100%", height: "80px", border: "1px solid #d9d9d9", borderRadius: "2px", padding: "8px", fontSize: "13px", resize: "none", fontFamily: "inherit", outline: "none" }} />
              </div>
            </FioriSection>
          </form>
        )}
      </div>

      {/* Fiori Footer Bar */}
      {!submitted && activeTab==="timesheet" && (
        <div style={{ background: "white", borderTop: "1px solid #d9d9d9", padding: "8px 48px", display: "flex", justifyContent: "flex-end", gap: "8px", flexShrink: 0, boxShadow: "0 -2px 6px rgba(0,0,0,0.06)" }}>
          <FioriBtn onClick={handleReset} outline accent={p} type="button">Cancel</FioriBtn>
          <FioriBtn onClick={()=>{}} outline accent={p} type="button">Save Draft</FioriBtn>
          <FioriBtn onClick={()=>{}} accent={p} type="submit" onClickForm={handleSubmit} submitting={submitting}>
            {submitting ? "Submitting…" : "Submit"}
          </FioriBtn>
        </div>
      )}
      <ThemeSwitcher themeId={themeId} setThemeId={setThemeId} />
    </div>
  );
}

function FioriSection({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div style={{ background: "white", border: "1px solid #d9d9d9", borderRadius: "4px", marginBottom: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "10px 24px", borderBottom: "1px solid #e5e5e5", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f7f7f7" }}>
        <span style={{ fontWeight: "700", fontSize: "14px", color: "#32363a" }}>{title}</span>
        {actions}
      </div>
      {children}
    </div>
  );
}

function FioriField({ label, locked, value }: { label: string; locked?: boolean; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", padding: "8px 24px", borderBottom: "1px solid #f0f0f0" }}>
      <span style={{ width: "160px", fontSize: "12px", color: "#6a6d70", flexShrink: 0, textAlign: "right", paddingRight: "12px" }}>{label}{locked ? " 🔒" : ""}</span>
      <span style={{ fontSize: "13px", color: "#32363a", fontWeight: "500" }}>{value}</span>
    </div>
  );
}

function FioriFieldEditable({ label, value, onChange, type, accent }: { label: string; value: string; onChange: (v: string) => void; type?: string; accent: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "6px 24px", borderBottom: "1px solid #f0f0f0" }}>
      <span style={{ width: "160px", fontSize: "12px", color: "#6a6d70", flexShrink: 0, textAlign: "right", paddingRight: "12px" }}>{label}</span>
      <input type={type||"text"} value={value} onChange={e=>onChange(e.target.value)}
        style={{ flex: 1, height: "28px", border: `1px solid #d9d9d9`, borderRadius: "2px", padding: "0 8px", fontSize: "13px", outline: "none", fontFamily: "inherit" }}
        onFocus={e=>{e.target.style.borderColor=accent; e.target.style.boxShadow=`0 0 0 2px ${accent}22`;}}
        onBlur={e=>{e.target.style.borderColor="#d9d9d9"; e.target.style.boxShadow="none";}} />
    </div>
  );
}

function FioriSelect({ value, onChange, options, placeholder, accent }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string; accent: string }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{ width: "100%", height: "28px", border: "1px solid #d9d9d9", borderRadius: "2px", padding: "0 4px", fontSize: "12px", outline: "none", background: "white", fontFamily: "inherit", cursor: "pointer" }}
      onFocus={e=>{e.target.style.borderColor=accent;}}
      onBlur={e=>{e.target.style.borderColor="#d9d9d9";}}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function FioriBtn({ children, onClick, outline, accent, type="button", onClickForm, submitting }: {
  children: React.ReactNode; onClick?: () => void; outline?: boolean; accent: string;
  type?: "button"|"submit"; onClickForm?: (e: React.FormEvent) => void; submitting?: boolean;
}) {
  const base: React.CSSProperties = { padding: "0 16px", height: "32px", borderRadius: "2px", fontSize: "13px", fontWeight: "600", cursor: "pointer", border: `1px solid ${accent}`, fontFamily: "inherit" };
  const style: React.CSSProperties = outline ? { ...base, background: "white", color: accent } : { ...base, background: accent, color: "white" };
  return (
    <button type={type} onClick={onClickForm || onClick} style={style} disabled={submitting}>{children}</button>
  );
}

// ─── SAP ECC / SAP GUI Theme (Desktop App Look) ───────────────────────────────
function ECCPage({ state }: { state: PageState }) {
  const { activeTab, setActiveTab, weekStart, weekEnd, weekDates, today, isCurrentWeek,
    prevWeek, nextWeek, rows, addRow, removeRow, updateRow, updateHours, submitted, submitting,
    handleSubmit, handleReset, comments, setComments, employeeId, employeeIdM, employeeName,
    submittedBy, managerEmail, setManagerEmail, counter, themeId, setThemeId } = state;

  const fonts = "'Helvetica Neue', Arial, sans-serif";
  const sapBlue = "#0054a6";
  const toolbarBg = "#dce3ec";

  return (
    <div style={{ background: "#ebebeb", minHeight: "100vh", fontFamily: fonts, fontSize: "12px", display: "flex", flexDirection: "column" }}>
      {/* Fake window title bar */}
      <div style={{ background: "linear-gradient(to bottom, #1e5fa8 0%, #0a3b7a 100%)", color: "white", padding: "2px 6px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "22px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="7" fill="#0070f2"/><text x="1" y="10" fontSize="6" fontWeight="bold" fill="white">SAP</text></svg>
          <span style={{ fontSize: "11px", fontWeight: "bold" }}>SAP Easy Access – {activeTab==="timesheet" ? "Time Recording (PT10)" : "Leave Management (PTMW)"}</span>
        </div>
        <div style={{ display: "flex", gap: "2px" }}>
          {["─","□","×"].map(b => (
            <div key={b} style={{ width: "18px", height: "14px", background: "#5a8ed0", border: "1px solid #4a7bc0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", cursor: "default", userSelect: "none" }}>{b}</div>
          ))}
        </div>
      </div>

      {/* Menu bar */}
      <div style={{ background: toolbarBg, borderBottom: "2px solid #a0a8b0", display: "flex", alignItems: "center", height: "21px", flexShrink: 0 }}>
        <div style={{ width: "30px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#0054a6"/><text x="2" y="14" fontSize="7" fontWeight="bold" fill="white">SAP</text></svg>
        </div>
        {["System","Edit","Goto","Favorites","Extras","Environment","Settings","Help"].map(m => (
          <MenuBarItem key={m} label={m} />
        ))}
      </div>

      {/* Standard Toolbar */}
      <div style={{ background: toolbarBg, borderBottom: "2px solid #a0a8b0", display: "flex", alignItems: "center", padding: "2px 4px", height: "28px", gap: "1px", flexShrink: 0 }}>
        {/* Transaction field */}
        <input defaultValue={activeTab==="timesheet"?"PT10":"PTMW"} style={{ width: "80px", height: "20px", border: "1px solid #7a8a9a", borderRadius: "0", padding: "0 4px", fontSize: "11px", marginRight: "4px", fontFamily: fonts }} readOnly />
        <div style={{ width: "1px", height: "20px", background: "#a0a8b0", margin: "0 2px" }} />
        {[
          { icon: "✓", title: "Enter" }, { icon: "⌨", title: "Command" }, { icon: "💾", title: "Save" },
          { icon: "◀", title: "Back" }, { icon: "✕", title: "Exit" }, { icon: "⊗", title: "Cancel" },
        ].map(btn => <ECCToolBtn key={btn.title} {...btn} />)}
        <div style={{ width: "1px", height: "20px", background: "#a0a8b0", margin: "0 2px" }} />
        {[
          { icon: "⬜", title: "Print" }, { icon: "🔍", title: "Find" }, { icon: "←", title: "First Page" },
          { icon: "‹", title: "Prev Page" }, { icon: "›", title: "Next Page" }, { icon: "→", title: "Last Page" },
        ].map(btn => <ECCToolBtn key={btn.title} {...btn} />)}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: "11px", color: "#334" }}>Client: 100 | User: JSMITH | EN</div>
      </div>

      {/* Screen title bar */}
      <div style={{ background: "#dce3ec", borderBottom: "1px solid #a0a8b0", padding: "2px 8px 2px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontWeight: "bold", fontSize: "13px", color: "#1a2a3a" }}>
          {activeTab==="timesheet" ? "Record Working Time" : "Leave Request Management"}
        </span>
        <span style={{ fontSize: "11px", color: "#555" }}>{activeTab==="timesheet" ? "PT10" : "PTMW"}</span>
      </div>

      {/* Tabs (SAP sub-tabs) */}
      <div style={{ background: "#dce3ec", borderBottom: "2px solid #a0a8b0", display: "flex", padding: "4px 4px 0", gap: "2px", flexShrink: 0 }}>
        {(["timesheet","leave"] as const).map(tab => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)}
            style={{ padding: "3px 14px", border: "1px solid #a0a8b0", borderBottom: activeTab===tab?"none":"1px solid #a0a8b0", background: activeTab===tab?"#f0f4f8":toolbarBg, fontSize: "11px", cursor: "pointer", borderRadius: "3px 3px 0 0", fontWeight: activeTab===tab?"bold":"normal", marginBottom: activeTab===tab?"-2px":"0", position: "relative", zIndex: activeTab===tab?2:1 }}>
            {tab==="timesheet"?"Time Recording":"Leave Request"}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, background: "#f0f4f8", padding: "8px", overflowY: "auto" }}>
        {activeTab==="leave" ? (
          <LeaveRequest theme={state.theme} managerEmail={managerEmail} setManagerEmail={setManagerEmail} />
        ) : submitted ? (
          <SuccessCard theme={state.theme} weekStart={weekStart} weekEnd={weekEnd} rows={rows} handleReset={handleReset} />
        ) : (
          <form onSubmit={handleSubmit}>
            {/* ECC Form box */}
            <div style={{ background: "#f0f4f8", border: "1px solid #a0a8b0" }}>
              {/* Employee Info section */}
              <ECCSectionHeader title="Employee Data" />
              <div style={{ padding: "8px 12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", background: "white", borderBottom: "1px solid #c0c8d0" }}>
                <ECCField label="Employee ID" value={employeeId} locked />
                <ECCField label="Employee Name" value={employeeName} locked />
                <ECCField label="Manager ID" value={employeeIdM} locked />
                <ECCField label="Submitted By" value={submittedBy} locked />
                <ECCFieldEditable label="Manager Email" value={managerEmail} onChange={setManagerEmail} type="email" />
                <ECCField label="Period" value={`${formatShort(weekStart)} – ${formatShort(weekEnd)}`} locked />
              </div>

              {/* Period navigation */}
              <ECCSectionHeader title={`Time Sheet: ${formatShort(weekStart)} to ${formatShort(weekEnd)}`} extra={
                <div style={{ display: "flex", gap: "4px" }}>
                  {!isCurrentWeek && <button type="button" onClick={()=>state.setWeekStart(getWeekStart(today))} style={eccBtnStyle}>Current Week</button>}
                  <button type="button" onClick={prevWeek} style={eccBtnStyle}>◀ Prev</button>
                  <button type="button" onClick={nextWeek} style={eccBtnStyle}>Next ▶</button>
                </div>
              } />

              {/* ALV Grid */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", fontFamily: fonts }}>
                  <thead>
                    <tr>
                      {["Project","Cost Center","Type","Time Code",...DAYS.map((d,i)=>`${d} ${formatDisplay(weekDates[i])}`),"Total",""].map((h,i) => (
                        <th key={i} style={{ background: "#dce3ec", border: "1px solid #a0a8b0", padding: "3px 6px", textAlign: i>=4&&i<=10?"center":"left", fontWeight: "bold", color: "#1a2a3a", whiteSpace: "nowrap", fontSize: "11px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={row.id} style={{ background: idx%2===0?"white":"#eef2f6" }}>
                        <td style={{ border: "1px solid #c0c8d0", padding: "2px 4px" }}>
                          <select value={row.project} onChange={e=>updateRow(row.id,"project",e.target.value)} style={eccSelectStyle}>
                            <option value="">Select…</option>
                            {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td style={{ border: "1px solid #c0c8d0", padding: "2px 4px" }}>
                          <select value={row.costCenter} onChange={e=>updateRow(row.id,"costCenter",e.target.value)} style={eccSelectStyle}>
                            <option value="">Select…</option>
                            {COST_CENTERS.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td style={{ border: "1px solid #c0c8d0", padding: "2px 4px" }}>
                          <select value={row.attendanceType} onChange={e=>updateRow(row.id,"attendanceType",e.target.value)} style={eccSelectStyle}>
                            <option value="">Select…</option>
                            {ATTENDANCE_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </td>
                        <td style={{ border: "1px solid #c0c8d0", padding: "2px 4px" }}>
                          <select value={row.timeCode} onChange={e=>updateRow(row.id,"timeCode",e.target.value)} style={eccSelectStyle}>
                            <option value="">Code…</option>
                            {TIME_CODES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </td>
                        {DAYS.map((d,i) => (
                          <td key={d} style={{ border: "1px solid #c0c8d0", padding: "2px 2px", textAlign: "center", background: i>=5?"#e8edf3":"" }}>
                            <input type="number" min="0" max="24" step="0.5" placeholder="" value={row.hours[d]}
                              onChange={e=>updateHours(row.id,d,e.target.value)}
                              style={{ width: "46px", height: "18px", border: "1px solid #a0a8b0", textAlign: "right", fontSize: "11px", padding: "0 2px", fontFamily: fonts }} />
                          </td>
                        ))}
                        <td style={{ border: "1px solid #c0c8d0", padding: "2px 6px", textAlign: "right", fontWeight: "bold" }}>
                          {rowTotal(row)>0?rowTotal(row).toFixed(2):""}
                        </td>
                        <td style={{ border: "1px solid #c0c8d0", padding: "2px 4px", textAlign: "center" }}>
                          <button type="button" onClick={()=>removeRow(row.id)} disabled={rows.length===1} style={{ ...eccBtnStyle, opacity: rows.length===1?0:1 }}>✕</button>
                        </td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr style={{ background: "#dce3ec", fontWeight: "bold" }}>
                      <td colSpan={4} style={{ border: "1px solid #a0a8b0", padding: "3px 6px" }}>Total</td>
                      {DAYS.map(d => (
                        <td key={d} style={{ border: "1px solid #a0a8b0", padding: "3px 6px", textAlign: "right" }}>
                          {dayTotal(rows,d)>0?dayTotal(rows,d).toFixed(2):""}
                        </td>
                      ))}
                      <td style={{ border: "1px solid #a0a8b0", padding: "3px 6px", textAlign: "right" }}>
                        {grandTotal(rows)>0?grandTotal(rows).toFixed(2):""}
                      </td>
                      <td style={{ border: "1px solid #a0a8b0" }}/>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ padding: "4px 8px", background: "#eef2f6", borderTop: "1px solid #c0c8d0", display: "flex", gap: "4px" }}>
                <button type="button" onClick={addRow} style={{ ...eccBtnStyle, background: sapBlue, color: "white", borderColor: "#003f7d" }}>+ Insert Row</button>
              </div>

              {/* Notes */}
              <ECCSectionHeader title="Long Text / Notes" />
              <div style={{ padding: "8px 12px", background: "white", borderBottom: "1px solid #c0c8d0" }}>
                <textarea placeholder="Enter notes…" value={comments} onChange={e=>setComments(e.target.value)}
                  style={{ width: "100%", height: "60px", border: "1px inset #a0a8b0", fontSize: "12px", fontFamily: fonts, resize: "vertical", padding: "4px" }} />
              </div>

              {/* Bottom action buttons */}
              <div style={{ padding: "6px 8px", background: toolbarBg, borderTop: "2px solid #a0a8b0", display: "flex", gap: "4px" }}>
                <button type="submit" disabled={submitting} style={{ ...eccBtnStyle, background: sapBlue, color: "white", borderColor: "#003f7d", fontWeight: "bold", padding: "3px 16px" }}>
                  {submitting ? "Saving…" : "💾 Save"}
                </button>
                <button type="button" onClick={handleReset} style={{ ...eccBtnStyle, padding: "3px 12px" }}>✕ Cancel</button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* SAP Status bar */}
      <div style={{ background: "#dce3ec", borderTop: "2px solid #a0a8b0", height: "20px", display: "flex", alignItems: "center", padding: "0 8px", gap: "16px", fontSize: "11px", color: "#333", flexShrink: 0 }}>
        <span style={{ flex: 1, color: "#005700", fontWeight: "bold" }}>Space</span>
        <span>Client 100</span>
        <span>User: JSMITH</span>
        <span>{activeTab==="timesheet"?"PT10":"PTMW"}</span>
        <span>INS</span>
      </div>
      <ThemeSwitcher themeId={themeId} setThemeId={setThemeId} />
    </div>
  );
}

const eccBtnStyle: React.CSSProperties = {
  background: "linear-gradient(to bottom, #f0f4f8, #dce3ec)",
  border: "1px solid #a0a8b0", borderRadius: "2px", padding: "2px 8px",
  fontSize: "11px", cursor: "pointer", fontFamily: "'Helvetica Neue', Arial, sans-serif",
};
const eccSelectStyle: React.CSSProperties = {
  width: "100%", height: "18px", border: "1px inset #a0a8b0", fontSize: "11px",
  padding: "0 2px", background: "white", fontFamily: "'Helvetica Neue', Arial, sans-serif",
};

function ECCSectionHeader({ title, extra }: { title: string; extra?: React.ReactNode }) {
  return (
    <div style={{ background: "#dce3ec", borderBottom: "1px solid #a0a8b0", borderTop: "1px solid #a0a8b0", padding: "3px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontWeight: "bold", fontSize: "12px", color: "#1a2a3a" }}>{title}</span>
      {extra}
    </div>
  );
}

function ECCField({ label, value, locked }: { label: string; value: string; locked?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "2px 0" }}>
      <span style={{ width: "130px", textAlign: "right", fontSize: "11px", color: "#334", flexShrink: 0 }}>{label}:</span>
      <input value={value} readOnly style={{ ...eccSelectStyle, width: "180px", height: "20px", background: locked?"#e8edf3":"white", cursor: "default", color: "#334" }} />
      {locked && <span style={{ fontSize: "10px", color: "#666" }}>🔒</span>}
    </div>
  );
}

function ECCFieldEditable({ label, value, onChange, type }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "2px 0" }}>
      <span style={{ width: "130px", textAlign: "right", fontSize: "11px", color: "#334", flexShrink: 0 }}>{label}:</span>
      <input type={type||"text"} value={value} onChange={e=>onChange(e.target.value)}
        style={{ ...eccSelectStyle, width: "200px", height: "20px" }} />
    </div>
  );
}

function MenuBarItem({ label }: { label: string }) {
  return (
    <span style={{ padding: "0 6px", height: "21px", display: "flex", alignItems: "center", fontSize: "11px", cursor: "default", userSelect: "none" }}
      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="#0054a6";(e.currentTarget as HTMLElement).style.color="white";}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="";(e.currentTarget as HTMLElement).style.color="";}}>
      {label}
    </span>
  );
}

function ECCToolBtn({ icon, title }: { icon: string; title: string }) {
  return (
    <button type="button" title={title} style={{ ...eccBtnStyle, width: "22px", height: "22px", padding: "0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
      {icon}
    </button>
  );
}

// ─── Oracle Fusion Cloud HCM Theme ────────────────────────────────────────────
function OraclePage({ state }: { state: PageState }) {
  const { activeTab, setActiveTab, weekStart, weekEnd, weekDates, today, isCurrentWeek,
    prevWeek, nextWeek, rows, addRow, removeRow, updateRow, updateHours, submitted, submitting,
    handleSubmit, handleReset, comments, setComments, employeeId, employeeIdM, employeeName,
    submittedBy, managerEmail, setManagerEmail, counter, themeId, setThemeId } = state;
  const oracleRed = "#c74634";
  const fonts = "'Oracle Sans', 'Helvetica Neue', Arial, sans-serif";

  return (
    <div style={{ background: "#f4f4f4", minHeight: "100vh", fontFamily: fonts, display: "flex", flexDirection: "column" }}>
      {/* Oracle Global Header */}
      <div style={{ background: "#312d2a", display: "flex", alignItems: "center", height: "48px", padding: "0 16px", gap: "0", flexShrink: 0 }}>
        {/* Hamburger + Oracle logo */}
        <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: "18px", cursor: "pointer", padding: "0 12px 0 0" }}>☰</button>
        <div style={{ display: "flex", alignItems: "baseline", gap: "2px", marginRight: "24px" }}>
          <span style={{ color: "white", fontWeight: "900", fontSize: "18px", letterSpacing: "-0.5px" }}>ORACLE</span>
        </div>
        {/* Global nav links */}
        <div style={{ display: "flex", height: "48px" }}>
          {["Me","My Team","Benefits","Time","Compensation","Talent"].map((item, i) => (
            <div key={item} style={{ padding: "0 14px", display: "flex", alignItems: "center", fontSize: "13px", cursor: "pointer", color: i===3?"white":"rgba(255,255,255,0.55)", borderBottom: i===3?`3px solid ${oracleRed}`:"3px solid transparent", fontWeight: i===3?"600":"400" }}>
              {item}
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: "16px", cursor: "pointer", padding: "0 8px", height: "48px" }}>🔍</button>
          <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: "16px", cursor: "pointer", padding: "0 8px", height: "48px" }}>🔔</button>
          <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: "16px", cursor: "pointer", padding: "0 8px", height: "48px" }}>⚙</button>
          <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: oracleRed, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "12px", fontWeight: "bold", cursor: "pointer", marginLeft: "4px" }}>JS</div>
        </div>
      </div>

      {/* Sub header / regional navigation */}
      <div style={{ background: "#1e1a18", padding: "0 24px", display: "flex", alignItems: "center", height: "36px", gap: "0", borderBottom: `2px solid ${oracleRed}`, flexShrink: 0 }}>
        {(["timesheet","leave"] as const).map(tab => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)}
            style={{ padding: "0 16px", height: "36px", background: "none", border: "none", fontSize: "12px", cursor: "pointer", color: activeTab===tab?"white":"rgba(255,255,255,0.45)", fontWeight: activeTab===tab?"600":"400", borderBottom: activeTab===tab?`3px solid ${oracleRed}`:"3px solid transparent" }}>
            {tab==="timesheet" ? "Time Cards" : "Absence Requests"}
          </button>
        ))}
      </div>

      {/* Breadcrumb + page title */}
      <div style={{ background: "white", borderBottom: "1px solid #ddd", padding: "10px 24px" }}>
        <div style={{ fontSize: "12px", color: "#888", marginBottom: "4px" }}>
          <span style={{ color: oracleRed, cursor: "pointer" }}>Time and Labor</span>
          {" > "}
          <span style={{ color: oracleRed, cursor: "pointer" }}>{activeTab==="timesheet"?"Time Cards":"Absence Requests"}</span>
          {" > "}
          <span>{activeTab==="timesheet"?"Enter Time Card":"New Absence Request"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#312d2a" }}>
            {activeTab==="timesheet" ? "Time Card Entry" : "Absence Request"}
          </h1>
          <div style={{ display: "flex", gap: "8px" }}>
            <OracleBtn onClick={handleReset} type="button">Cancel</OracleBtn>
            {!submitted && <OracleBtn type="button" onClick={()=>{}} secondary>Save</OracleBtn>}
            {!submitted && <OracleBtn type="submit" primary red={oracleRed} onSubmit={handleSubmit} submitting={submitting}>
              {submitting?"Submitting…":"Submit"}
            </OracleBtn>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "16px 24px", overflowY: "auto" }}>
        {activeTab==="leave" ? (
          <LeaveRequest theme={state.theme} managerEmail={managerEmail} setManagerEmail={setManagerEmail} />
        ) : submitted ? (
          <SuccessCard theme={state.theme} weekStart={weekStart} weekEnd={weekEnd} rows={rows} handleReset={handleReset} />
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Oracle section boxes */}
            <OracleSection title="Employee Information">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px 24px", padding: "16px" }}>
                <OracleField label="Employee ID" value={employeeId} locked />
                <OracleField label="Employee Name" value={employeeName} locked />
                <OracleField label="Submitted By" value={submittedBy} locked />
                <OracleField label="Manager ID" value={employeeIdM} locked />
                <OracleFieldEditable label="Manager Email" value={managerEmail} onChange={setManagerEmail} type="email" accent={oracleRed} />
                <OracleField label="Timesheet Counter" value={counter} locked />
              </div>
            </OracleSection>

            <OracleSection title={`Time Entry — ${formatShort(weekStart)} to ${formatShort(weekEnd)}`} actions={
              <div style={{ display: "flex", gap: "6px" }}>
                {!isCurrentWeek && <OracleBtn type="button" onClick={()=>state.setWeekStart(getWeekStart(today))}>Current Period</OracleBtn>}
                <OracleBtn type="button" onClick={prevWeek}>◀</OracleBtn>
                <OracleBtn type="button" onClick={nextWeek}>▶</OracleBtn>
              </div>
            }>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f4f4f4", borderBottom: "2px solid #ddd" }}>
                      {["Project","Cost Center","Type","Time Code",...DAYS.map((d,i)=>`${d}\n${formatDisplay(weekDates[i])}`),"Total",""].map((h,i) => (
                        <th key={i} style={{ padding: "8px 12px", textAlign: i>=4&&i<=10?"center":"left", fontWeight: "700", color: "#312d2a", fontSize: "12px", borderRight: "1px solid #e0e0e0", whiteSpace: "pre-line", borderBottom: `2px solid ${oracleRed}`, minWidth: i>=4&&i<=10?"64px":"auto" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={row.id} style={{ background: idx%2===0?"white":"#faf9f9", borderBottom: "1px solid #e8e8e8" }}>
                        {[
                          { value: row.project, onChange: (v:string)=>updateRow(row.id,"project",v), options: PROJECTS, ph: "Select…" },
                          { value: row.costCenter, onChange: (v:string)=>updateRow(row.id,"costCenter",v), options: COST_CENTERS, ph: "Select…" },
                          { value: row.attendanceType, onChange: (v:string)=>updateRow(row.id,"attendanceType",v), options: ATTENDANCE_TYPES, ph: "Select…" },
                          { value: row.timeCode, onChange: (v:string)=>updateRow(row.id,"timeCode",v), options: TIME_CODES, ph: "Code…" },
                        ].map((sel, si) => (
                          <td key={si} style={{ padding: "6px 8px", borderRight: "1px solid #e8e8e8" }}>
                            <select value={sel.value} onChange={e=>sel.onChange(e.target.value)}
                              style={{ width: "100%", height: "28px", border: "1px solid #c8c8c8", borderRadius: "3px", padding: "0 6px", fontSize: "12px", background: "white", fontFamily: fonts }}>
                              <option value="">{sel.ph}</option>
                              {sel.options.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </td>
                        ))}
                        {DAYS.map((d,i) => (
                          <td key={d} style={{ padding: "4px", textAlign: "center", borderRight: "1px solid #e8e8e8", background: i>=5?"#faf6f4":"" }}>
                            <input type="number" min="0" max="24" step="0.5" value={row.hours[d]}
                              onChange={e=>updateHours(row.id,d,e.target.value)}
                              style={{ width: "52px", height: "28px", textAlign: "center", border: `1px solid ${parseFloat(row.hours[d])>0?oracleRed:"#c8c8c8"}`, borderRadius: "3px", fontSize: "13px", fontFamily: fonts, background: parseFloat(row.hours[d])>0?"#fff1f0":"white" }} />
                          </td>
                        ))}
                        <td style={{ padding: "6px 12px", textAlign: "center", fontWeight: "700", color: rowTotal(row)>0?oracleRed:"#ccc", borderRight: "1px solid #e8e8e8" }}>
                          {rowTotal(row)>0?rowTotal(row).toFixed(2):"–"}
                        </td>
                        <td style={{ padding: "4px 8px", textAlign: "center" }}>
                          <button type="button" onClick={()=>removeRow(row.id)} disabled={rows.length===1} style={{ color: oracleRed, background: "none", border: "none", cursor: rows.length===1?"not-allowed":"pointer", opacity: rows.length===1?0:1, fontSize: "16px" }}>✕</button>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: "#faf4f3", borderTop: "2px solid #ddd" }}>
                      <td colSpan={4} style={{ padding: "8px 12px", fontWeight: "700", fontSize: "12px", color: "#312d2a" }}>TOTALS</td>
                      {DAYS.map(d => (
                        <td key={d} style={{ textAlign: "center", padding: "8px 4px", fontWeight: "700", color: dayTotal(rows,d)>0?"#312d2a":"#ccc" }}>
                          {dayTotal(rows,d)>0?dayTotal(rows,d).toFixed(2):"–"}
                        </td>
                      ))}
                      <td style={{ textAlign: "center", fontWeight: "700", color: grandTotal(rows)>0?oracleRed:"#ccc" }}>{grandTotal(rows)>0?grandTotal(rows).toFixed(2):"–"}</td>
                      <td/>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ padding: "8px 12px", borderTop: "1px solid #e8e8e8" }}>
                <OracleBtn type="button" onClick={addRow}>+ Add Row</OracleBtn>
              </div>
            </OracleSection>

            <OracleSection title="Notes">
              <div style={{ padding: "16px" }}>
                <textarea placeholder="Enter any additional notes…" value={comments} onChange={e=>setComments(e.target.value)}
                  style={{ width: "100%", height: "80px", border: "1px solid #c8c8c8", borderRadius: "3px", padding: "8px", fontSize: "13px", fontFamily: fonts, resize: "none" }} />
              </div>
            </OracleSection>

            {/* Bottom action bar */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
              <OracleBtn type="button" onClick={handleReset}>Cancel</OracleBtn>
              <OracleBtn type="button" onClick={()=>{}} secondary>Save</OracleBtn>
              <OracleBtn type="submit" primary red={oracleRed} onSubmit={handleSubmit} submitting={submitting}>
                {submitting?"Submitting…":"Submit"}
              </OracleBtn>
            </div>
          </form>
        )}
      </div>
      <ThemeSwitcher themeId={themeId} setThemeId={setThemeId} />
    </div>
  );
}

function OracleSection({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  const oracleRed = "#c74634";
  return (
    <div style={{ background: "white", border: "1px solid #ddd", borderRadius: "4px", marginBottom: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
      <div style={{ padding: "10px 16px", borderBottom: "2px solid #e8e8e8", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#faf9f9" }}>
        <span style={{ fontWeight: "700", fontSize: "13px", color: "#312d2a", textTransform: "uppercase", letterSpacing: "0.04em" }}>{title}</span>
        {actions}
      </div>
      {children}
    </div>
  );
}

function OracleField({ label, value, locked }: { label: string; value: string; locked?: boolean }) {
  const fonts = "'Oracle Sans', 'Helvetica Neue', Arial, sans-serif";
  return (
    <div>
      <div style={{ fontSize: "11px", fontWeight: "600", color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>{label}{locked ? " 🔒" : ""}</div>
      {locked ? (
        <div style={{ fontSize: "13px", color: "#312d2a", padding: "6px 0", borderBottom: "1px solid #e0e0e0", fontWeight: "500" }}>{value}</div>
      ) : (
        <input value={value} readOnly style={{ width: "100%", height: "32px", border: "1px solid #ddd", borderRadius: "3px", padding: "0 8px", fontSize: "13px", background: "#f9f9f9", fontFamily: fonts }} />
      )}
    </div>
  );
}

function OracleFieldEditable({ label, value, onChange, type, accent }: { label: string; value: string; onChange: (v: string) => void; type?: string; accent: string }) {
  const fonts = "'Oracle Sans', 'Helvetica Neue', Arial, sans-serif";
  return (
    <div>
      <div style={{ fontSize: "11px", fontWeight: "600", color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>{label}</div>
      <input type={type||"text"} value={value} onChange={e=>onChange(e.target.value)}
        style={{ width: "100%", height: "32px", border: "1px solid #c8c8c8", borderRadius: "3px", padding: "0 8px", fontSize: "13px", fontFamily: fonts }}
        onFocus={e=>{e.target.style.borderColor=accent; e.target.style.outline=`2px solid ${accent}33`;}}
        onBlur={e=>{e.target.style.borderColor="#c8c8c8"; e.target.style.outline="none";}} />
    </div>
  );
}

function OracleBtn({ children, onClick, type="button", primary, secondary, red, onSubmit, submitting }: {
  children: React.ReactNode; onClick?: ()=>void; type?: "button"|"submit"; primary?: boolean; secondary?: boolean; red?: string; onSubmit?: (e: React.FormEvent) => void; submitting?: boolean;
}) {
  const oracleRed = red || "#c74634";
  const style: React.CSSProperties = primary
    ? { padding: "0 16px", height: "30px", background: oracleRed, color: "white", border: `1px solid ${oracleRed}`, borderRadius: "3px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }
    : secondary
    ? { padding: "0 16px", height: "30px", background: "white", color: "#312d2a", border: "1px solid #c8c8c8", borderRadius: "3px", fontSize: "13px", fontWeight: "500", cursor: "pointer" }
    : { padding: "0 12px", height: "30px", background: "white", color: "#555", border: "1px solid #c8c8c8", borderRadius: "3px", fontSize: "13px", cursor: "pointer" };
  return <button type={type} onClick={onSubmit||onClick} style={style} disabled={submitting}>{children}</button>;
}

// ─── Shared components ────────────────────────────────────────────────────────
function TimesheetGrid({ theme, rows, weekDates, today, updateRow, updateHours, removeRow }: {
  theme: AppTheme; rows: TimesheetRow[]; weekDates: Date[]; today: Date;
  updateRow: (id: string, field: keyof TimesheetRow, value: string) => void;
  updateHours: (id: string, day: string, value: string) => void;
  removeRow: (id: string) => void;
}) {
  const p = theme.primary;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow style={{background:theme.tableHeaderBg}} className="border-b border-gray-200">
            <TableHead className="text-xs font-semibold text-gray-600 uppercase w-[180px] px-4">Project</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase w-[170px] px-3">Cost Center</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase w-[140px] px-3">Type</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase w-[100px] px-3">Code</TableHead>
            {DAYS.map((d,i) => (
              <TableHead key={d} className={`text-center px-2 min-w-[68px] ${i>=5?"text-gray-400":"text-gray-600"}`}>
                <div className="text-xs font-semibold uppercase">{d}</div>
                <div className="text-[11px] mt-0.5" style={formatDate(weekDates[i])===formatDate(today)?{color:p,fontWeight:600}:{color:"#9ca3af"}}>{formatDisplay(weekDates[i])}</div>
              </TableHead>
            ))}
            <TableHead className="text-center text-xs font-semibold text-gray-600 uppercase px-3 min-w-[60px]">Total</TableHead>
            <TableHead className="w-10 px-2"/>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={row.id} className={`border-b border-gray-100 ${idx%2===0?"bg-white":"bg-[#fafafa]"}`}>
              <TableCell className="px-4 py-2">
                <Select value={row.project} onValueChange={v=>updateRow(row.id,"project",v)}>
                  <SelectTrigger className="h-8 text-xs border-gray-200"><SelectValue placeholder="Select…"/></SelectTrigger>
                  <SelectContent>{PROJECTS.map(p=><SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}</SelectContent>
                </Select>
              </TableCell>
              <TableCell className="px-3 py-2">
                <Select value={row.costCenter} onValueChange={v=>updateRow(row.id,"costCenter",v)}>
                  <SelectTrigger className="h-8 text-xs border-gray-200"><SelectValue placeholder="Select…"/></SelectTrigger>
                  <SelectContent>{COST_CENTERS.map(c=><SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
                </Select>
              </TableCell>
              <TableCell className="px-3 py-2">
                <Select value={row.attendanceType} onValueChange={v=>updateRow(row.id,"attendanceType",v)}>
                  <SelectTrigger className="h-8 text-xs border-gray-200"><SelectValue placeholder="Select…"/></SelectTrigger>
                  <SelectContent>{ATTENDANCE_TYPES.map(a=><SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>)}</SelectContent>
                </Select>
              </TableCell>
              <TableCell className="px-3 py-2">
                <Select value={row.timeCode} onValueChange={v=>updateRow(row.id,"timeCode",v)}>
                  <SelectTrigger className="h-8 text-xs border-gray-200"><SelectValue placeholder="Code…"/></SelectTrigger>
                  <SelectContent>{TIME_CODES.map(t=><SelectItem key={t} value={t} className="text-xs font-mono">{t}</SelectItem>)}</SelectContent>
                </Select>
              </TableCell>
              {DAYS.map((d,i) => (
                <TableCell key={d} className="px-1 py-2 text-center">
                  <input type="number" min="0" max="24" step="0.5" placeholder="–" value={row.hours[d]}
                    onChange={e=>updateHours(row.id,d,e.target.value)}
                    className={`w-14 h-8 text-center text-sm rounded border focus:outline-none focus:ring-1 transition-colors ${i>=5?"bg-gray-50 text-gray-400 border-gray-100":"bg-white border-gray-200 text-gray-800"}`}
                    style={parseFloat(row.hours[d])>0?{borderColor:theme.primaryLightBorder,background:theme.primaryLight}:{}} />
                </TableCell>
              ))}
              <TableCell className="px-3 py-2 text-center">
                <span className="text-sm font-semibold" style={{color:rowTotal(row)>0?p:"#d1d5db"}}>{rowTotal(row)>0?rowTotal(row).toFixed(2):"–"}</span>
              </TableCell>
              <TableCell className="px-2 py-2">
                <button type="button" onClick={()=>removeRow(row.id)} disabled={rows.length===1} className="text-gray-300 hover:text-red-400 disabled:opacity-0 transition-colors p-1"><Trash2 className="h-3.5 w-3.5"/></button>
              </TableCell>
            </TableRow>
          ))}
          <TableRow style={{background:theme.tableHeaderBg}} className="border-t-2 border-gray-200">
            <TableCell colSpan={4} className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase">Daily Totals</TableCell>
            {DAYS.map((d,i) => (
              <TableCell key={d} className="px-1 py-2.5 text-center">
                <span className={`text-sm font-bold ${dayTotal(rows,d)>0?"text-gray-800":"text-gray-300"} ${i>=5?"text-gray-400":""}`}>{dayTotal(rows,d)>0?dayTotal(rows,d).toFixed(2):"–"}</span>
              </TableCell>
            ))}
            <TableCell className="px-3 py-2.5 text-center">
              <span className="text-sm font-bold" style={{color:grandTotal(rows)>0?p:"#d1d5db"}}>{grandTotal(rows)>0?grandTotal(rows).toFixed(2):"–"}</span>
            </TableCell>
            <TableCell className="w-10 px-2"/>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

function SummaryCard({ theme, rows, weekStart, weekEnd }: { theme: AppTheme; rows: TimesheetRow[]; weekStart: Date; weekEnd: Date }) {
  const p = theme.primary;
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-4">Summary</p>
      <div className="space-y-3">
        <div className="flex justify-between"><span className="text-sm text-gray-500">Period</span><span className="text-sm font-medium text-gray-700">{formatDisplay(weekStart)} – {formatDisplay(weekEnd)}</span></div>
        <div className="flex justify-between"><span className="text-sm text-gray-500">Weekday Hours</span><span className="text-sm font-medium text-gray-700">{(["Mon","Tue","Wed","Thu","Fri"] as const).reduce((s,d)=>s+dayTotal(rows,d),0).toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-sm text-gray-500">Weekend Hours</span><span className="text-sm font-medium text-gray-700">{(["Sat","Sun"] as const).reduce((s,d)=>s+dayTotal(rows,d),0).toFixed(2)}</span></div>
        <div className="pt-3 border-t border-gray-100 flex justify-between"><span className="text-sm font-semibold text-gray-700">Total</span><span className="text-lg font-bold" style={{color:p}}>{grandTotal(rows).toFixed(2)}</span></div>
      </div>
    </div>
  );
}

function SuccessCard({ theme, weekStart, weekEnd, rows, handleReset }: { theme: AppTheme; weekStart: Date; weekEnd: Date; rows: TimesheetRow[]; handleReset: ()=>void }) {
  const p = theme.primary;
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
      </div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Timesheet Submitted</h2>
      <p className="text-gray-500 mb-6">Your timesheet for <strong>{formatLong(weekStart)} – {formatLong(weekEnd)}</strong> has been submitted.</p>
      <p className="text-gray-500 mb-8">Total hours: <strong className="text-gray-800">{grandTotal(rows).toFixed(2)}</strong></p>
      <button onClick={handleReset} style={{background:p}} className="text-white px-8 py-2 rounded hover:opacity-90">Submit Another</button>
    </div>
  );
}

function ThemeSwitcher({ themeId, setThemeId }: { themeId: ThemeId; setThemeId: (id: ThemeId) => void }) {
  return (
    <div className="border-t border-gray-300 bg-white" style={{flexShrink:0}}>
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-end gap-3">
        <span className="text-xs text-gray-500 font-medium">Screen Style:</span>
        <select value={themeId} onChange={e=>{const id=e.target.value as ThemeId;setThemeId(id);saveTheme(id);}}
          className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white text-gray-700 cursor-pointer focus:outline-none">
          {THEME_LIST.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
    </div>
  );
}

// ─── Page State Interface ─────────────────────────────────────────────────────
interface PageState {
  activeTab: "timesheet" | "leave";
  setActiveTab: (t: "timesheet"|"leave") => void;
  theme: AppTheme;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  weekStart: Date;
  setWeekStart: (fn: ((w: Date) => Date) | Date) => void;
  weekEnd: Date;
  weekDates: Date[];
  today: Date;
  isCurrentWeek: boolean;
  prevWeek: () => void;
  nextWeek: () => void;
  rows: TimesheetRow[];
  addRow: () => void;
  removeRow: (id: string) => void;
  updateRow: (id: string, field: keyof TimesheetRow, value: string) => void;
  updateHours: (id: string, day: string, value: string) => void;
  submitted: boolean;
  submitting: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  handleReset: () => void;
  comments: string;
  setComments: (v: string) => void;
  employeeId: string;
  employeeIdM: string;
  employeeName: string;
  submittedBy: string;
  managerEmail: string;
  setManagerEmail: (v: string) => void;
  counter: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Timesheet() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"timesheet"|"leave">("timesheet");
  const [themeId, setThemeId] = useState<ThemeId>(() => loadTheme());
  const theme = THEME_LIST.find(t => t.id === themeId) || THEME_LIST[0];

  const today = new Date();
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(today));
  const weekEnd = addDays(weekStart, 6);
  const weekDates = DAYS.map((_,i) => addDays(weekStart, i));

  const employeeId = "RC-10045", employeeIdM = "RC-MGR-205", employeeName = "John Smith", submittedBy = "John Smith";
  const [managerEmail, setManagerEmail] = useState("asif.hussain@royalcyber.com");
  const counter = "TS-2026-W13";
  const [comments, setComments] = useState("");
  const [rows, setRows] = useState<TimesheetRow[]>([makeRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function prevWeek() { setWeekStart(w => addDays(w, -7)); }
  function nextWeek() { setWeekStart(w => addDays(w, 7)); }
  function addRow() { setRows(r => [...r, makeRow()]); }
  function removeRow(id: string) { setRows(r => r.filter(row => row.id !== id)); }
  function updateRow(id: string, field: keyof TimesheetRow, value: string) { setRows(r => r.map(row => row.id===id ? {...row,[field]:value} : row)); }
  function updateHours(id: string, day: string, value: string) {
    if (value!==""&&(isNaN(parseFloat(value))||parseFloat(value)<0)) return;
    setRows(r => r.map(row => row.id===id ? {...row,hours:{...row.hours,[day]:value}} : row));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!managerEmail) { toast({title:"Missing required fields",description:"Please fill in Manager Email.",variant:"destructive"}); return; }
    const total = grandTotal(rows);
    if (total===0) { toast({title:"No hours entered",description:"Please enter at least some hours.",variant:"destructive"}); return; }
    for (const row of rows) {
      if (!row.project||!row.costCenter||!row.attendanceType||!row.timeCode) {
        toast({title:"Incomplete row",description:"Each row needs project, cost center, type, and time code.",variant:"destructive"}); return;
      }
    }
    setSubmitting(true);
    const {date:creationDate,time:creationTime} = getNow();
    const primaryRow = rows[0];
    const payload = {
      employeeId, employeeIdM, counter:`TS-${Date.now()}`, employeeName,
      hours:total, periodStart:formatDate(weekStart), periodEnd:formatDate(weekEnd),
      project:rows.map(r=>r.project).join(", "), costCenter:rows.map(r=>r.costCenter).join(", "),
      attendanceType:primaryRow.attendanceType, timeCode:primaryRow.timeCode,
      submittedBy, managerEmail, creationDate, creationTime, comments,
    };
    try {
      const res = await fetch(API_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json","x-api-key":API_KEY},body:JSON.stringify(payload)});
      if (res.ok||res.status===200||res.status===202) {
        setSubmitted(true);
        toast({title:"Timesheet submitted!",description:`${total} hours submitted for ${formatLong(weekStart)} – ${formatLong(weekEnd)}.`});
      } else { throw new Error(`HTTP ${res.status}`); }
    } catch(err) { toast({title:"Submission failed",description:`Could not submit. (${err})`,variant:"destructive"}); }
    finally { setSubmitting(false); }
  }

  function handleReset() { setSubmitted(false); setRows([makeRow()]); setComments(""); }

  const isCurrentWeek = getWeekStart(today).getTime()===weekStart.getTime();

  const pageState: PageState = {
    activeTab, setActiveTab, theme, themeId, setThemeId,
    weekStart, setWeekStart, weekEnd, weekDates, today, isCurrentWeek,
    prevWeek, nextWeek, rows, addRow, removeRow, updateRow, updateHours,
    submitted, submitting, handleSubmit, handleReset, comments, setComments,
    employeeId, employeeIdM, employeeName, submittedBy, managerEmail, setManagerEmail, counter,
  };

  if (themeId === "sap-s4hana") return <FioriPage state={pageState} />;
  if (themeId === "sap-ecc") return <ECCPage state={pageState} />;
  if (themeId === "oracle-fusion") return <OraclePage state={pageState} />;
  return <WorkdayPage state={pageState} />;
}

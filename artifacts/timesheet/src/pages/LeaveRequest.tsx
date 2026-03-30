import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { AppTheme } from "@/lib/themes";

const API_KEY = "G2JylRhOWQ8Xa0Z5OmCI7W9DfLXJCYPA";
const LEAVE_ENDPOINT =
  "https://defaultd508624fa0b74fd3951105b18ca027.84.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/e6b3ef6685da42d49073363642d020eb/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=FjKe83SFE8Jg6ZM2EVMad4qMEtGzvu4nmhgGLGJ9x_0";

const LEAVE_TYPES = ["Annual Leave","Sick Leave","WFH","Casual Leave","Emergency Leave","Maternity Leave","Paternity Leave","Bereavement Leave","Study / Exam Leave","Unpaid Leave"];
const LOCKED_EMPLOYEE_ID = "RC-10045";
const LOCKED_EMPLOYEE_ID_M = "RC-MGR-205";
const LOCKED_EMPLOYEE_NAME = "John Smith";

function formatDate(date: Date) { return date.toISOString().split("T")[0]; }
function getNow() { const now = new Date(); return { date: formatDate(now), time: now.toTimeString().split(" ")[0] }; }
function calcBusinessDays(start: string, end: string) {
  if (!start||!end) return 0;
  const s = new Date(start), e = new Date(end);
  if (e<s) return 0;
  let count = 0; const cur = new Date(s);
  while (cur<=e) { const day=cur.getDay(); if(day!==0&&day!==6) count++; cur.setDate(cur.getDate()+1); }
  return count;
}

interface Props { theme: AppTheme; managerEmail: string; setManagerEmail: (v: string) => void; }

export default function LeaveRequest({ theme, managerEmail, setManagerEmail }: Props) {
  const { toast } = useToast();
  const today = formatDate(new Date());
  const p = theme.primary;

  const [leaveType, setLeaveType] = useState("");
  const [leaveStartDate, setLeaveStartDate] = useState(today);
  const [leaveEndDate, setLeaveEndDate] = useState(today);
  const [reason, setReason] = useState("");
  const [backupResource, setBackupResource] = useState("");
  const [counter, setCounter] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<{ leaveType: string; leaveStartDate: string; leaveEndDate: string; days: number } | null>(null);
  const totalDays = calcBusinessDays(leaveStartDate, leaveEndDate);

  function handleReset() {
    setSubmitted(false); setSubmittedData(null); setLeaveType(""); setLeaveStartDate(today);
    setLeaveEndDate(today); setReason(""); setBackupResource(""); setCounter(""); setComments("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!leaveType) { toast({title:"Leave type required",description:"Please select a leave type.",variant:"destructive"}); return; }
    if (!leaveStartDate||!leaveEndDate) { toast({title:"Dates required",description:"Please select start and end dates.",variant:"destructive"}); return; }
    if (new Date(leaveEndDate)<new Date(leaveStartDate)) { toast({title:"Invalid date range",description:"End date must be on or after start date.",variant:"destructive"}); return; }
    if (!managerEmail) { toast({title:"Manager email required",description:"Please enter the manager email.",variant:"destructive"}); return; }
    setSubmitting(true);
    const {date:creationDate,time:creationTime} = getNow();
    const payload = {
      employeeId:LOCKED_EMPLOYEE_ID, employeeIdM:LOCKED_EMPLOYEE_ID_M,
      counter:counter.trim()||`LR-${Date.now()}`, employeeName:LOCKED_EMPLOYEE_NAME,
      leaveType, leaveStartDate, leaveEndDate, totalDays, reason:reason.trim(),
      backupResource:backupResource.trim(), approvalStatus:"Pending",
      submittedBy:LOCKED_EMPLOYEE_NAME, managerEmail, creationDate, creationTime, comments:comments.trim(),
    };
    try {
      const res = await fetch(LEAVE_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json","x-api-key":API_KEY},body:JSON.stringify(payload)});
      if (res.ok||res.status===200||res.status===202) {
        setSubmittedData({leaveType,leaveStartDate,leaveEndDate,days:totalDays});
        setSubmitted(true);
        toast({title:"Leave request submitted!",description:`Your ${leaveType} request has been sent to your manager.`});
      } else { const body=await res.text(); throw new Error(`HTTP ${res.status}: ${body}`); }
    } catch(err) { toast({title:"Submission failed",description:`Could not submit leave request. (${err})`,variant:"destructive"}); }
    finally { setSubmitting(false); }
  }

  if (submitted && submittedData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Leave Request Submitted</h2>
        <p className="text-gray-500 mb-2">Your <strong>{submittedData.leaveType}</strong> request has been sent to your manager.</p>
        <p className="text-gray-500 mb-2">Period: <strong>{submittedData.leaveStartDate}</strong> to <strong>{submittedData.leaveEndDate}</strong></p>
        <p className="text-gray-500 mb-8">Business days: <strong>{submittedData.days}</strong></p>
        <button onClick={handleReset} style={{background:p}} className="text-white px-8 py-2 rounded hover:opacity-90">Submit Another Request</button>
      </div>
    );
  }

  // ── SAP ECC / SAP GUI style ──────────────────────────────────────────────
  if (theme.id === "sap-ecc") {
    const fonts = "'Helvetica Neue', Arial, sans-serif";
    const sapBlue = "#0054a6";
    const toolbarBg = "#dce3ec";
    const eccBtnStyle: React.CSSProperties = { background:"linear-gradient(to bottom,#f0f4f8,#dce3ec)", border:"1px solid #a0a8b0", borderRadius:"2px", padding:"2px 8px", fontSize:"11px", cursor:"pointer", fontFamily:fonts };
    const eccInputStyle: React.CSSProperties = { height:"20px", border:"1px inset #a0a8b0", fontSize:"11px", padding:"0 4px", background:"white", fontFamily:fonts };
    return (
      <form onSubmit={handleSubmit}>
        <div style={{ background:"#f0f4f8", border:"1px solid #a0a8b0", fontFamily:fonts, fontSize:"12px" }}>
          {/* Section: Employee */}
          <div style={{background:toolbarBg,borderBottom:"1px solid #a0a8b0",padding:"3px 8px",fontWeight:"bold",fontSize:"12px",color:"#1a2a3a"}}>Employee Data</div>
          <div style={{padding:"8px 12px",background:"white",borderBottom:"1px solid #c0c8d0",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 16px"}}>
            {[["Employee ID",LOCKED_EMPLOYEE_ID,true],["Employee Name",LOCKED_EMPLOYEE_NAME,true],["Manager ID",LOCKED_EMPLOYEE_ID_M,true],["Leave Counter",""]].map(([lbl,val,locked]) => (
              <div key={String(lbl)} style={{display:"flex",alignItems:"center",gap:"6px",padding:"2px 0"}}>
                <span style={{width:"120px",textAlign:"right",fontSize:"11px",color:"#334",flexShrink:0}}>{String(lbl)}:</span>
                <input value={String(val)} readOnly={!!locked} onChange={lbl==="Leave Counter"?e=>setCounter(e.target.value):undefined}
                  style={{...eccInputStyle,width:"180px",background:locked?"#e8edf3":"white"}} />
                {locked && <span style={{fontSize:"10px",color:"#666"}}>🔒</span>}
              </div>
            ))}
            <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"2px 0"}}>
              <span style={{width:"120px",textAlign:"right",fontSize:"11px",color:"#334",flexShrink:0}}>Manager Email:</span>
              <input type="email" value={managerEmail} onChange={e=>setManagerEmail(e.target.value)} style={{...eccInputStyle,width:"200px"}} />
            </div>
          </div>
          {/* Section: Leave Details */}
          <div style={{background:toolbarBg,borderBottom:"1px solid #a0a8b0",padding:"3px 8px",fontWeight:"bold",fontSize:"12px",color:"#1a2a3a",borderTop:"1px solid #a0a8b0"}}>Leave Request Details</div>
          <div style={{padding:"8px 12px",background:"white",borderBottom:"1px solid #c0c8d0",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"2px 0"}}>
              <span style={{width:"120px",textAlign:"right",fontSize:"11px",color:"#334",flexShrink:0}}>Leave Type *:</span>
              <select value={leaveType} onChange={e=>setLeaveType(e.target.value)} style={{...eccInputStyle,width:"200px"}}>
                <option value="">Select…</option>
                {LEAVE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"2px 0"}}>
              <span style={{width:"120px",textAlign:"right",fontSize:"11px",color:"#334",flexShrink:0}}>Start Date *:</span>
              <input type="date" value={leaveStartDate} onChange={e=>{setLeaveStartDate(e.target.value);if(e.target.value>leaveEndDate)setLeaveEndDate(e.target.value);}} style={{...eccInputStyle,width:"140px"}} required />
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"2px 0"}}>
              <span style={{width:"120px",textAlign:"right",fontSize:"11px",color:"#334",flexShrink:0}}>End Date *:</span>
              <input type="date" value={leaveEndDate} min={leaveStartDate} onChange={e=>setLeaveEndDate(e.target.value)} style={{...eccInputStyle,width:"140px"}} required />
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"2px 0"}}>
              <span style={{width:"120px",textAlign:"right",fontSize:"11px",color:"#334",flexShrink:0}}>Business Days:</span>
              <input value={totalDays>0?`${totalDays} day(s)`:""} readOnly style={{...eccInputStyle,width:"100px",background:"#e8edf3",fontWeight:"bold"}} />
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"2px 0"}}>
              <span style={{width:"120px",textAlign:"right",fontSize:"11px",color:"#334",flexShrink:0}}>Backup Resource:</span>
              <input value={backupResource} onChange={e=>setBackupResource(e.target.value)} placeholder="" style={{...eccInputStyle,width:"200px"}} />
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"2px 0"}}>
              <span style={{width:"120px",textAlign:"right",fontSize:"11px",color:"#334",flexShrink:0}}>Reason:</span>
              <input value={reason} onChange={e=>setReason(e.target.value)} style={{...eccInputStyle,width:"200px"}} />
            </div>
          </div>
          {/* Notes */}
          <div style={{background:toolbarBg,borderBottom:"1px solid #a0a8b0",padding:"3px 8px",fontWeight:"bold",fontSize:"12px",color:"#1a2a3a",borderTop:"1px solid #a0a8b0"}}>Long Text / Notes</div>
          <div style={{padding:"8px 12px",background:"white",borderBottom:"1px solid #c0c8d0"}}>
            <textarea value={comments} onChange={e=>setComments(e.target.value)} placeholder="Enter notes…"
              style={{width:"100%",height:"60px",border:"1px inset #a0a8b0",fontSize:"12px",fontFamily:fonts,resize:"vertical",padding:"4px"}} />
          </div>
          {/* Actions */}
          <div style={{padding:"6px 8px",background:toolbarBg,borderTop:"2px solid #a0a8b0",display:"flex",gap:"4px"}}>
            <button type="submit" disabled={submitting} style={{...eccBtnStyle,background:sapBlue,color:"white",borderColor:"#003f7d",fontWeight:"bold",padding:"3px 16px"}}>
              {submitting?"Saving…":"💾 Save"}
            </button>
            <button type="button" onClick={handleReset} style={{...eccBtnStyle,padding:"3px 12px"}}>✕ Cancel</button>
          </div>
        </div>
      </form>
    );
  }

  // ── SAP Fiori style ──────────────────────────────────────────────────────
  if (theme.id === "sap-fiori") {
    const accent = "#0070f2";
    const fioriInput: React.CSSProperties = { width:"100%",height:"28px",border:"1px solid #d9d9d9",borderRadius:"2px",padding:"0 8px",fontSize:"13px",fontFamily:"inherit" };
    const fioriSelect: React.CSSProperties = { ...fioriInput,cursor:"pointer",background:"white" };
    return (
      <form onSubmit={handleSubmit}>
        <div style={{background:"white",border:"1px solid #d9d9d9",borderRadius:"4px",marginBottom:"16px",boxShadow:"0 1px 2px rgba(0,0,0,0.06)"}}>
          <div style={{padding:"10px 24px",borderBottom:"1px solid #e5e5e5",background:"#f7f7f7",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontWeight:"700",fontSize:"14px",color:"#32363a"}}>Employee Information</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr"}}>
            {[[LOCKED_EMPLOYEE_ID,"Employee ID",true],[LOCKED_EMPLOYEE_ID_M,"Manager ID",true],[LOCKED_EMPLOYEE_NAME,"Employee Name",true]].map(([val,lbl,locked]) => (
              <div key={String(lbl)} style={{display:"flex",alignItems:"baseline",padding:"8px 24px",borderBottom:"1px solid #f0f0f0"}}>
                <span style={{width:"140px",fontSize:"12px",color:"#6a6d70",flexShrink:0,textAlign:"right",paddingRight:"12px"}}>{String(lbl)}{locked?" 🔒":""}</span>
                <span style={{fontSize:"13px",color:"#32363a",fontWeight:"500"}}>{String(val)}</span>
              </div>
            ))}
            <div style={{display:"flex",alignItems:"center",padding:"6px 24px",borderBottom:"1px solid #f0f0f0"}}>
              <span style={{width:"140px",fontSize:"12px",color:"#6a6d70",flexShrink:0,textAlign:"right",paddingRight:"12px"}}>Manager Email</span>
              <input type="email" value={managerEmail} onChange={e=>setManagerEmail(e.target.value)} style={fioriInput}
                onFocus={e=>{e.target.style.borderColor=accent;}} onBlur={e=>{e.target.style.borderColor="#d9d9d9";}} />
            </div>
          </div>
        </div>
        <div style={{background:"white",border:"1px solid #d9d9d9",borderRadius:"4px",marginBottom:"16px",boxShadow:"0 1px 2px rgba(0,0,0,0.06)"}}>
          <div style={{padding:"10px 24px",borderBottom:"1px solid #e5e5e5",background:"#f7f7f7"}}>
            <span style={{fontWeight:"700",fontSize:"14px",color:"#32363a"}}>Leave Details</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr"}}>
            <div style={{display:"flex",alignItems:"center",padding:"8px 24px",borderBottom:"1px solid #f0f0f0"}}>
              <span style={{width:"140px",fontSize:"12px",color:"#6a6d70",flexShrink:0,textAlign:"right",paddingRight:"12px"}}>Leave Type *</span>
              <select value={leaveType} onChange={e=>setLeaveType(e.target.value)} style={fioriSelect} required>
                <option value="">Select…</option>
                {LEAVE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{display:"flex",alignItems:"center",padding:"8px 24px",borderBottom:"1px solid #f0f0f0"}}>
              <span style={{width:"140px",fontSize:"12px",color:"#6a6d70",flexShrink:0,textAlign:"right",paddingRight:"12px"}}>Start Date *</span>
              <input type="date" value={leaveStartDate} onChange={e=>{setLeaveStartDate(e.target.value);if(e.target.value>leaveEndDate)setLeaveEndDate(e.target.value);}} style={fioriInput} required />
            </div>
            <div style={{display:"flex",alignItems:"center",padding:"8px 24px",borderBottom:"1px solid #f0f0f0"}}>
              <span style={{width:"140px",fontSize:"12px",color:"#6a6d70",flexShrink:0,textAlign:"right",paddingRight:"12px"}}>End Date *</span>
              <input type="date" value={leaveEndDate} min={leaveStartDate} onChange={e=>setLeaveEndDate(e.target.value)} style={fioriInput} required />
            </div>
            <div style={{display:"flex",alignItems:"center",padding:"8px 24px",borderBottom:"1px solid #f0f0f0"}}>
              <span style={{width:"140px",fontSize:"12px",color:"#6a6d70",flexShrink:0,textAlign:"right",paddingRight:"12px"}}>Business Days</span>
              <span style={{fontSize:"13px",fontWeight:"700",color:totalDays>0?accent:"#ccc"}}>{totalDays>0?`${totalDays} day(s)`:"–"}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",padding:"8px 24px",borderBottom:"1px solid #f0f0f0"}}>
              <span style={{width:"140px",fontSize:"12px",color:"#6a6d70",flexShrink:0,textAlign:"right",paddingRight:"12px"}}>Backup Resource</span>
              <input value={backupResource} onChange={e=>setBackupResource(e.target.value)} style={fioriInput} />
            </div>
            <div style={{display:"flex",alignItems:"center",padding:"8px 24px",borderBottom:"1px solid #f0f0f0"}}>
              <span style={{width:"140px",fontSize:"12px",color:"#6a6d70",flexShrink:0,textAlign:"right",paddingRight:"12px"}}>Reason</span>
              <input value={reason} onChange={e=>setReason(e.target.value)} style={fioriInput} />
            </div>
          </div>
          <div style={{padding:"12px 24px",borderTop:"1px solid #e5e5e5"}}>
            <div style={{fontSize:"12px",color:"#6a6d70",marginBottom:"6px"}}>Notes</div>
            <textarea value={comments} onChange={e=>setComments(e.target.value)} placeholder="Add a note…"
              style={{width:"100%",height:"70px",border:"1px solid #d9d9d9",borderRadius:"2px",padding:"8px",fontSize:"13px",resize:"none",fontFamily:"inherit"}} />
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:"8px",marginTop:"8px"}}>
          <button type="button" onClick={handleReset} style={{padding:"0 16px",height:"32px",borderRadius:"2px",fontSize:"13px",fontWeight:"600",cursor:"pointer",border:`1px solid ${accent}`,background:"white",color:accent}}>Cancel</button>
          <button type="submit" disabled={submitting} style={{padding:"0 16px",height:"32px",borderRadius:"2px",fontSize:"13px",fontWeight:"600",cursor:"pointer",border:`1px solid ${accent}`,background:accent,color:"white"}}>
            {submitting?"Submitting…":"Submit"}
          </button>
        </div>
      </form>
    );
  }

  // ── Oracle Fusion style ──────────────────────────────────────────────────
  if (theme.id === "oracle-fusion") {
    const oracleRed = "#c74634";
    const fonts = "'Oracle Sans','Helvetica Neue',Arial,sans-serif";
    const oInput: React.CSSProperties = { width:"100%",height:"32px",border:"1px solid #c8c8c8",borderRadius:"3px",padding:"0 8px",fontSize:"13px",fontFamily:fonts };
    const oLabel: React.CSSProperties = { fontSize:"11px",fontWeight:"600",color:"#888",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"4px",display:"block" };
    return (
      <form onSubmit={handleSubmit}>
        <div style={{background:"white",border:"1px solid #ddd",borderRadius:"4px",marginBottom:"16px",boxShadow:"0 1px 3px rgba(0,0,0,0.08)"}}>
          <div style={{padding:"10px 16px",borderBottom:`2px solid ${oracleRed}`,background:"#faf9f9"}}>
            <span style={{fontWeight:"700",fontSize:"13px",color:"#312d2a",textTransform:"uppercase",letterSpacing:"0.04em"}}>Employee Information</span>
          </div>
          <div style={{padding:"16px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"16px 24px"}}>
            {[[LOCKED_EMPLOYEE_ID,"Employee ID"],[LOCKED_EMPLOYEE_ID_M,"Manager ID"],[LOCKED_EMPLOYEE_NAME,"Employee Name"]].map(([val,lbl]) => (
              <div key={String(lbl)}>
                <span style={{...oLabel}}>{String(lbl)} 🔒</span>
                <div style={{fontSize:"13px",color:"#312d2a",padding:"6px 0",borderBottom:"1px solid #e0e0e0",fontWeight:"500"}}>{String(val)}</div>
              </div>
            ))}
            <div>
              <label style={oLabel}>Manager Email</label>
              <input type="email" value={managerEmail} onChange={e=>setManagerEmail(e.target.value)} style={oInput}
                onFocus={e=>{e.target.style.borderColor=oracleRed;}} onBlur={e=>{e.target.style.borderColor="#c8c8c8";}} />
            </div>
          </div>
        </div>
        <div style={{background:"white",border:"1px solid #ddd",borderRadius:"4px",marginBottom:"16px",boxShadow:"0 1px 3px rgba(0,0,0,0.08)"}}>
          <div style={{padding:"10px 16px",borderBottom:`2px solid ${oracleRed}`,background:"#faf9f9"}}>
            <span style={{fontWeight:"700",fontSize:"13px",color:"#312d2a",textTransform:"uppercase",letterSpacing:"0.04em"}}>Absence Details</span>
          </div>
          <div style={{padding:"16px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"16px 24px"}}>
            <div>
              <label style={oLabel}>Absence Type *</label>
              <select value={leaveType} onChange={e=>setLeaveType(e.target.value)} style={{...oInput,cursor:"pointer",background:"white"}} required>
                <option value="">Select…</option>
                {LEAVE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={oLabel}>Start Date *</label>
              <input type="date" value={leaveStartDate} onChange={e=>{setLeaveStartDate(e.target.value);if(e.target.value>leaveEndDate)setLeaveEndDate(e.target.value);}} style={oInput} required />
            </div>
            <div>
              <label style={oLabel}>End Date *</label>
              <input type="date" value={leaveEndDate} min={leaveStartDate} onChange={e=>setLeaveEndDate(e.target.value)} style={oInput} required />
            </div>
            <div>
              <label style={oLabel}>Business Days</label>
              <div style={{fontSize:"16px",fontWeight:"700",color:totalDays>0?oracleRed:"#ccc",paddingTop:"4px"}}>{totalDays>0?`${totalDays} day(s)`:"–"}</div>
            </div>
            <div>
              <label style={oLabel}>Backup Resource</label>
              <input value={backupResource} onChange={e=>setBackupResource(e.target.value)} style={oInput} placeholder="" />
            </div>
            <div>
              <label style={oLabel}>Reason</label>
              <input value={reason} onChange={e=>setReason(e.target.value)} style={oInput} />
            </div>
          </div>
          <div style={{padding:"16px",borderTop:"1px solid #e8e8e8"}}>
            <label style={oLabel}>Notes</label>
            <textarea value={comments} onChange={e=>setComments(e.target.value)} placeholder="Enter any additional notes…"
              style={{width:"100%",height:"80px",border:"1px solid #c8c8c8",borderRadius:"3px",padding:"8px",fontSize:"13px",fontFamily:fonts,resize:"none"}} />
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:"8px",marginTop:"8px"}}>
          <button type="button" onClick={handleReset} style={{padding:"0 12px",height:"30px",background:"white",color:"#555",border:"1px solid #c8c8c8",borderRadius:"3px",fontSize:"13px",cursor:"pointer",fontFamily:fonts}}>Cancel</button>
          <button type="submit" disabled={submitting} style={{padding:"0 16px",height:"30px",background:oracleRed,color:"white",border:`1px solid ${oracleRed}`,borderRadius:"3px",fontSize:"13px",fontWeight:"600",cursor:"pointer",fontFamily:fonts}}>
            {submitting?"Submitting…":"Submit"}
          </button>
        </div>
      </form>
    );
  }

  // ── Workday / default style ──────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-gray-800">Leave Request</h1><p className="text-sm text-gray-500 mt-0.5">Submit a new absence or leave request</p></div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={handleReset} className="border-gray-300 text-gray-600">Cancel</Button>
          <Button type="submit" disabled={submitting} style={{background:p}} className="text-white min-w-[140px] hover:opacity-90">
            {submitting?<span className="flex items-center gap-2"><Spinner className="h-4 w-4"/>Submitting...</span>:"Submit Request"}
          </Button>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div style={{background:theme.sectionHeaderBg}} className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Employee Information</h2>
        </div>
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-1.5"><Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Employee ID 🔒</Label><Input value={LOCKED_EMPLOYEE_ID} readOnly className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed"/></div>
          <div className="space-y-1.5"><Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Manager ID 🔒</Label><Input value={LOCKED_EMPLOYEE_ID_M} readOnly className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed"/></div>
          <div className="space-y-1.5"><Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Employee Name 🔒</Label><Input value={LOCKED_EMPLOYEE_NAME} readOnly className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed"/></div>
          <div className="space-y-1.5"><Label htmlFor="leaveEmail" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Manager Email</Label><Input id="leaveEmail" type="email" value={managerEmail} onChange={e=>setManagerEmail(e.target.value)} className="border-gray-300"/></div>
          <div className="space-y-1.5"><Label htmlFor="counter" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Leave Counter</Label><Input id="counter" placeholder="Auto-generated if empty" value={counter} onChange={e=>setCounter(e.target.value)} className="border-gray-300"/></div>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div style={{background:theme.sectionHeaderBg}} className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Leave Details</h2>
        </div>
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Leave Type <span className="text-red-500">*</span></Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger className="border-gray-300"><SelectValue placeholder="Select leave type…"/></SelectTrigger>
              <SelectContent>{LEAVE_TYPES.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Start Date <span className="text-red-500">*</span></Label>
            <Input type="date" value={leaveStartDate} onChange={e=>{setLeaveStartDate(e.target.value);if(e.target.value>leaveEndDate)setLeaveEndDate(e.target.value);}} className="border-gray-300" required/>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">End Date <span className="text-red-500">*</span></Label>
            <Input type="date" value={leaveEndDate} min={leaveStartDate} onChange={e=>setLeaveEndDate(e.target.value)} className="border-gray-300" required/>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Business Days</Label>
            <div className="h-10 px-3 flex items-center rounded-md border text-sm font-semibold"
              style={totalDays>0?{background:theme.primaryLight,borderColor:theme.primaryLightBorder,color:p}:{background:"#f9fafb",borderColor:"#e5e7eb",color:"#9ca3af"}}>
              {totalDays>0?`${totalDays} day(s)`:"–"}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Backup Resource</Label>
            <Input value={backupResource} onChange={e=>setBackupResource(e.target.value)} className="border-gray-300"/>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Reason</Label>
            <Input value={reason} onChange={e=>setReason(e.target.value)} className="border-gray-300"/>
          </div>
        </div>
      </div>
      {leaveType && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-5 py-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <div className="text-sm text-blue-700"><span className="font-semibold">{leaveType}</span> — Your request will be routed to <span className="font-medium">{managerEmail||"your manager"}</span> for approval.</div>
        </div>
      )}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-6 py-5">
        <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Additional Comments</Label>
        <Textarea value={comments} onChange={e=>setComments(e.target.value)} placeholder="Any additional information…" className="mt-3 border-gray-200 resize-none h-[100px] text-sm"/>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="text-sm text-gray-500"><span className="text-red-500">*</span> Required fields</div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={handleReset} className="border-gray-300 text-gray-600">Cancel</Button>
          <Button type="submit" disabled={submitting} style={{background:p}} className="text-white min-w-[140px] hover:opacity-90">
            {submitting?<span className="flex items-center gap-2"><Spinner className="h-4 w-4"/>Submitting...</span>:"Submit Request"}
          </Button>
        </div>
      </div>
    </form>
  );
}

import React, { useState, useMemo, useEffect } from "react";

/* ===============================
   Dummy Data
=============================== */

const DUMMY_INVESTIGATIONS = [
{
caseId: "CASE-2026-0001",
systemId: "SYS-1001",
technician: "Priya Sharma",
initialAIVerdict: { label: "Potential Compromise", confidence: 0.78 },
finalTechnicianVerdict: "Confirmed - Malware",
evidenceCount: 3,
status: "Closed",
severity: "High",
lastUpdated: "2026-01-16T14:32:00Z",
timeline: [
{ ts: "2026-01-15T10:05:00Z", actor: "AI Engine", type: "AI_VERDICT", note: "Low confidence alert detected" },
{ ts: "2026-01-15T11:20:00Z", actor: "Priya Sharma", type: "EVIDENCE_UPLOADED", note: "malware_sample.exe uploaded" }
],
evidence: [
{ filename: "malware_sample.exe", type: "binary", uploadedBy: "Priya Sharma", ts: "2026-01-15T11:20:00Z", retained: true }
],
compliance:{ evidenceRetained:true, notesPresent:true, aiConfidenceLogged:true, adminNotified:true }
}
];


/* ===============================
   Helpers
=============================== */

const formatDateTime = (iso)=>{
const d = new Date(iso)
return d.toLocaleString()
}

const statusColor = (s)=>{
if(s==="Closed") return "bg-green-100 text-green-700"
if(s==="Escalated") return "bg-red-100 text-red-700"
if(s==="In Progress") return "bg-blue-100 text-blue-700"
return "bg-gray-100 text-gray-700"
}

const severityColor=(s)=>{
if(s==="Critical") return "text-red-600"
if(s==="High") return "text-orange-600"
if(s==="Medium") return "text-yellow-600"
return "text-green-600"
}


/* ===============================
   Component
=============================== */

export default function InvestigationLogs(){

const [investigations] = useState(DUMMY_INVESTIGATIONS)

const [search,setSearch]=useState("")
const [drawerOpen,setDrawerOpen]=useState(false)
const [activeCase,setActiveCase]=useState(null)

const filtered = useMemo(()=>{
return investigations.filter(i =>
i.systemId.toLowerCase().includes(search.toLowerCase()) ||
i.technician.toLowerCase().includes(search.toLowerCase()) ||
i.caseId.toLowerCase().includes(search.toLowerCase())
)
},[search,investigations])


const openTimeline=(item)=>{
setActiveCase(item)
setDrawerOpen(true)
}

const closeDrawer=()=>{
setDrawerOpen(false)
setActiveCase(null)
}


return(

<div className="w-full space-y-6">

{/* ===============================
Header
=============================== */}

<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

<div>
<h1 className="text-2xl font-semibold text-gray-900">
Investigation Logs
</h1>
<p className="text-sm text-gray-600">
Technician investigation history
</p>
</div>

<input
value={search}
onChange={(e)=>setSearch(e.target.value)}
placeholder="Search System / Technician / Case"
className="w-full md:w-80 px-3 py-2 border rounded-md text-sm"
/>

</div>


{/* ===============================
Table
=============================== */}

<div className="bg-white border rounded-lg shadow-sm">

<div className="overflow-x-auto">

<table className="min-w-[900px] w-full text-sm">

<thead className="bg-gray-50">

<tr>

<th className="px-4 py-3 text-left">Case ID</th>
<th className="px-4 py-3 text-left">System</th>
<th className="px-4 py-3 text-left">Technician</th>
<th className="px-4 py-3 text-left">AI Verdict</th>
<th className="px-4 py-3 text-left">Final Verdict</th>
<th className="px-4 py-3 text-left">Evidence</th>
<th className="px-4 py-3 text-left">Status</th>
<th className="px-4 py-3 text-left">Updated</th>
<th className="px-4 py-3 text-left">Action</th>

</tr>

</thead>

<tbody>

{filtered.map((inv)=>(
<tr key={inv.caseId} className="border-t hover:bg-gray-50">

<td className="px-4 py-3 font-medium">{inv.caseId}</td>

<td className="px-4 py-3 text-blue-600">{inv.systemId}</td>

<td className="px-4 py-3">{inv.technician}</td>

<td className="px-4 py-3">
<span className="px-2 py-1 text-xs rounded bg-red-50 text-red-600">
{inv.initialAIVerdict.label}
</span>
</td>

<td className="px-4 py-3">
<span className="px-2 py-1 text-xs rounded bg-gray-100">
{inv.finalTechnicianVerdict}
</span>
</td>

<td className="px-4 py-3">{inv.evidenceCount}</td>

<td className="px-4 py-3">
<span className={`px-2 py-1 text-xs rounded ${statusColor(inv.status)}`}>
{inv.status}
</span>
<div className={`text-xs ${severityColor(inv.severity)}`}>
{inv.severity}
</div>
</td>

<td className="px-4 py-3 text-gray-500">
{formatDateTime(inv.lastUpdated)}
</td>

<td className="px-4 py-3">

<button
onClick={()=>openTimeline(inv)}
className="px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50"
>
View Timeline
</button>

</td>

</tr>
))}

</tbody>

</table>

</div>

</div>


{/* ===============================
Drawer
=============================== */}

{drawerOpen && activeCase && (

<div className="fixed inset-0 z-50 flex">

<div className="absolute inset-0 bg-black/40" onClick={closeDrawer}/>

<div className="relative ml-auto w-full md:w-[600px] bg-white h-full shadow-xl overflow-y-auto">

<div className="p-5 border-b flex justify-between">

<div>

<h2 className="text-lg font-semibold">
Timeline - {activeCase.caseId}
</h2>

<p className="text-sm text-gray-600">
System {activeCase.systemId}
</p>

</div>

<button onClick={closeDrawer}>✕</button>

</div>


<div className="p-6 space-y-6">

{/* Timeline */}

<div>

<h3 className="font-medium mb-3">Timeline</h3>

<div className="space-y-3">

{activeCase.timeline.map((t,i)=>(
<div key={i} className="border rounded p-3">

<div className="flex justify-between text-sm">

<span className="font-medium">{t.type}</span>

<span className="text-gray-500">
{formatDateTime(t.ts)}
</span>

</div>

<p className="text-sm text-gray-600 mt-1">
{t.note}
</p>

</div>
))}

</div>

</div>


{/* Evidence */}

<div>

<h3 className="font-medium mb-3">
Evidence ({activeCase.evidence.length})
</h3>

<div className="space-y-2">

{activeCase.evidence.map((ev,i)=>(
<div key={i} className="border rounded p-3 flex justify-between">

<div>

<div className="text-sm font-medium text-blue-600">
{ev.filename}
</div>

<div className="text-xs text-gray-500">
{ev.uploadedBy}
</div>

</div>

<div className="text-xs">
{ev.retained ? "Retained" : "Not Retained"}
</div>

</div>
))}

</div>

</div>

</div>

</div>

</div>

)}

</div>

)
}
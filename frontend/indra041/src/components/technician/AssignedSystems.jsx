import React, { useState } from "react";
import SystemDiagnosis from "./SystemDiagnosis";

const AssignedSystems = () => {

const [selectedSystem,setSelectedSystem]=useState(null)
const [search,setSearch]=useState("")
const [filter,setFilter]=useState("All")

/* ===============================
Dummy Data
=============================== */

const systemsData=[
{
systemId:"SYS-10234",
owner:"Finance Dept",
assignedDate:"2026-01-12",
severity:"Critical",
rootCause:"Disk I/O saturation",
status:"In Progress",
slaHours:-2,
category:"Hardware",
},
{
systemId:"SYS-10241",
owner:"HR Systems",
assignedDate:"2026-01-14",
severity:"High",
rootCause:"Authentication service failure",
status:"Pending",
slaHours:5,
category:"Security",
},
{
systemId:"SYS-10258",
owner:"Manufacturing",
assignedDate:"2026-01-15",
severity:"Medium",
rootCause:"Memory leak in service",
status:"Awaiting Evidence",
slaHours:18,
category:"Software",
},
]

/* ===============================
Filters
=============================== */

const filteredSystems=systemsData.filter((sys)=>{

const matchesSearch=
sys.systemId.toLowerCase().includes(search.toLowerCase()) ||
sys.owner.toLowerCase().includes(search.toLowerCase())

const matchesFilter=
filter==="All" ||
sys.severity===filter ||
sys.status===filter

return matchesSearch && matchesFilter

})

/* ===============================
Snapshot Metrics
=============================== */

const snapshot={
pending:systemsData.filter(s=>s.status==="Pending").length,
inProgress:systemsData.filter(s=>s.status==="In Progress").length,
breached:systemsData.filter(s=>s.slaHours<0).length,
awaiting:systemsData.filter(s=>s.status==="Awaiting Evidence").length
}

/* ===============================
Styles
=============================== */

const severityStyles={
Critical:"bg-red-100 text-red-700",
High:"bg-orange-100 text-orange-700",
Medium:"bg-yellow-100 text-yellow-700",
Low:"bg-green-100 text-green-700"
}

const statusStyles={
Pending:"bg-gray-100 text-gray-700",
"In Progress":"bg-blue-100 text-blue-700",
"Awaiting Evidence":"bg-purple-100 text-purple-700",
Resolved:"bg-green-100 text-green-700"
}


/* ===============================
Open Diagnosis Page
=============================== */

if(selectedSystem){

return(

<div className="px-4 sm:px-6 py-6 space-y-6">

<button
onClick={()=>setSelectedSystem(null)}
className="text-blue-600 text-sm font-medium hover:underline"
>
← Back to Assigned Systems
</button>

<SystemDiagnosis systemId={selectedSystem}/>

</div>

)

}


/* ===============================
Main Page
=============================== */

return(

<div className="px-4 sm:px-6 py-6 space-y-6">

{/* ===============================
Header
=============================== */}

<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

<div>
<h1 className="text-2xl font-semibold text-gray-900">
Assigned Systems
</h1>
<p className="text-sm text-gray-500">
Systems assigned to you for investigation
</p>
</div>

<div className="flex flex-wrap gap-3">

<input
type="text"
placeholder="Search system or owner"
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="border px-3 py-2 rounded-md text-sm w-full sm:w-56"
/>

<select
value={filter}
onChange={(e)=>setFilter(e.target.value)}
className="border px-3 py-2 rounded-md text-sm"
>

<option value="All">All</option>
<option value="Critical">Critical</option>
<option value="High">High</option>
<option value="Medium">Medium</option>
<option value="Pending">Pending</option>
<option value="In Progress">In Progress</option>
<option value="Awaiting Evidence">Awaiting Evidence</option>

</select>

</div>

</div>


{/* ===============================
Snapshot Cards
=============================== */}

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

<SnapshotCard label="Pending Investigations" value={snapshot.pending}/>

<SnapshotCard label="In Progress" value={snapshot.inProgress}/>

<SnapshotCard label="SLA Breached" value={snapshot.breached} danger/>

<SnapshotCard label="Awaiting Evidence" value={snapshot.awaiting}/>

</div>


{/* ===============================
Systems Table
=============================== */}

<div className="bg-white border rounded-lg shadow-sm">

<div className="overflow-x-auto">

<table className="min-w-[850px] w-full text-sm">

<thead className="bg-gray-50 text-gray-600">

<tr>

<th className="px-4 py-3 text-left">System</th>

<th className="px-4 py-3 text-left">Owner</th>

<th className="px-4 py-3 text-center">Severity</th>

<th className="px-4 py-3 text-left">AI Root Cause</th>

<th className="px-4 py-3 text-center">Status</th>

<th className="px-4 py-3 text-center">SLA</th>

<th className="px-4 py-3 text-center">Action</th>

</tr>

</thead>


<tbody>

{filteredSystems.map((sys)=>(
<tr key={sys.systemId} className="border-t hover:bg-gray-50">

<td className="px-4 py-3 font-medium text-blue-600">
{sys.systemId}
</td>

<td className="px-4 py-3">
{sys.owner}
</td>

<td className="px-4 py-3 text-center">

<span className={`px-2 py-1 rounded-full text-xs font-medium ${severityStyles[sys.severity]}`}>
{sys.severity}
</span>

</td>

<td className="px-4 py-3">
{sys.rootCause}
</td>

<td className="px-4 py-3 text-center">

<span className={`px-2 py-1 rounded-full text-xs ${statusStyles[sys.status]}`}>
{sys.status}
</span>

</td>

<td className="px-4 py-3 text-center">

<span className={`font-medium ${
sys.slaHours<0
? "text-red-600"
: sys.slaHours<6
? "text-orange-600"
: "text-green-600"
}`}>

{sys.slaHours<0
? "BREACHED"
: `${sys.slaHours} hrs`
}

</span>

</td>

<td className="px-4 py-3 text-center">

<button
onClick={()=>setSelectedSystem(sys.systemId)}
className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
>
Investigate
</button>

</td>

</tr>
))}

</tbody>

</table>

</div>

</div>

</div>

)

}


/* ===============================
Snapshot Card
=============================== */

const SnapshotCard=({label,value,danger})=>(

<div className={`border rounded-lg p-4 shadow-sm ${
danger ? "border-red-300 bg-red-50" : "bg-white"
}`}>

<p className="text-sm text-gray-500">
{label}
</p>

<p className={`text-2xl font-semibold ${
danger ? "text-red-600" : "text-gray-900"
}`}>
{value}
</p>

</div>

)

export default AssignedSystems
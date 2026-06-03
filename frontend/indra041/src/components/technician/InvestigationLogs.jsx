import React, { useState, useMemo } from "react";
import { DUMMY_INVESTIGATIONS } from "../../data/mockData";
import { useSystemData } from "../../context/SystemDataContext";

/* ===============================
   Helpers
=============================== */

const formatDateTime = (iso) => {
  return new Date(iso).toLocaleString(undefined, { 
    year: 'numeric', month: 'short', day: 'numeric', 
    hour: '2-digit', minute:'2-digit'
  });
};

const statusColor = (s) => {
  if (s === "Closed") return "bg-gray-100 text-gray-700 border-gray-200";
  if (s === "Escalated") return "bg-red-50 text-red-700 border-red-200";
  if (s === "In Progress") return "bg-indigo-50 text-indigo-700 border-indigo-200";
  return "bg-gray-50 text-gray-700 border-gray-200";
};

const severityColor = (s) => {
  if (s === "Critical") return "bg-red-50 text-red-700 border-red-200";
  if (s === "High") return "bg-orange-50 text-orange-700 border-orange-200";
  if (s === "Medium") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
};

/* ===============================
   Component
=============================== */

export default function InvestigationLogs() {
  const { getAllSystems, isUsingMockData } = useSystemData();
  const systems = getAllSystems();

  const liveInvestigations = useMemo(() => {
    return systems.filter(sys => sys.status !== "healthy").map((sys, idx) => ({
      caseId: `CASE-${sys.id.replace('SYS-', '')}-${idx+100}`,
      systemId: sys.id,
      technician: "Current Tech",
      initialAIVerdict: { label: sys.liveData?.diagnosis?.root_cause || "Analysis Pending" },
      finalTechnicianVerdict: "In Progress",
      evidenceCount: 1,
      status: "In Progress",
      severity: sys.status === "critical" ? "Critical" : "High",
      timeline: [
        { ts: new Date().toISOString(), type: "Alert Received", note: `System telemetry indicated ${sys.status} state.`, actor: "NexusOps System" }
      ],
      evidence: [
        { filename: "initial_telemetry.json", uploadedBy: "System", ts: new Date().toISOString(), retained: true }
      ]
    }));
  }, [systems]);

  const investigations = isUsingMockData ? DUMMY_INVESTIGATIONS : liveInvestigations;
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCase, setActiveCase] = useState(null);

  const filtered = useMemo(() => {
    return investigations.filter(i =>
      i.systemId.toLowerCase().includes(search.toLowerCase()) ||
      i.technician.toLowerCase().includes(search.toLowerCase()) ||
      i.caseId.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, investigations]);

  const openTimeline = (item) => {
    setActiveCase(item);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setActiveCase(null);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Investigation Logs
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Technician investigation history and evidence trail
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search System / Technician / Case ID"
          className="w-full md:w-80 px-4 py-2 border border-gray-200 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4 text-left whitespace-nowrap">Case ID</th>
                <th className="px-6 py-4 text-left whitespace-nowrap">System</th>
                <th className="px-6 py-4 text-left whitespace-nowrap">Technician</th>
                <th className="px-6 py-4 text-left whitespace-nowrap">AI Verdict</th>
                <th className="px-6 py-4 text-left whitespace-nowrap">Final Verdict</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Evidence</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((inv) => (
                <tr key={inv.caseId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{inv.caseId}</td>
                  <td className="px-6 py-4 font-medium text-indigo-600">{inv.systemId}</td>
                  <td className="px-6 py-4 text-gray-700">{inv.technician}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 text-xs rounded border bg-amber-50 text-amber-800 border-amber-200 font-medium">
                      {inv.initialAIVerdict.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700 font-medium">
                    {inv.finalTechnicianVerdict}
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-gray-600">
                    {inv.evidenceCount} files
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded border ${statusColor(inv.status)}`}>
                        {inv.status}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded border ${severityColor(inv.severity)}`}>
                        {inv.severity}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => openTimeline(inv)}
                      className="px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors"
                    >
                      Timeline
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWER */}
      {drawerOpen && activeCase && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={closeDrawer} />
          <div className="relative w-full max-w-2xl bg-gray-50 h-full flex flex-col shadow-2xl transition-transform pointer-events-auto">
            
            <div className="p-6 bg-white border-b border-gray-200 flex justify-between items-center z-10 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Timeline: {activeCase.caseId}</h2>
                <p className="text-sm font-medium text-indigo-600 mt-1">System {activeCase.systemId}</p>
              </div>
              <button onClick={closeDrawer} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Timeline Items */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-6">Investigation Events</h3>
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:ml-6 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                  {activeCase.timeline.map((t, i) => (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-indigo-100 text-indigo-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-lg border border-gray-200 shadow-sm ml-4 md:ml-0 overflow-hidden">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-gray-900 text-sm">{t.type}</span>
                          <span className="text-xs text-gray-500 font-medium">{formatDateTime(t.ts)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{t.note}</p>
                        <p className="text-xs text-indigo-600 font-medium">By: {t.actor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Panel */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4 items-center flex justify-between">
                  Log & Evidence Files
                  <span className="bg-gray-100 text-gray-600 text-xs py-1 px-3 rounded-full font-bold">{activeCase.evidence.length} files</span>
                </h3>
                <div className="space-y-3">
                  {activeCase.evidence.map((ev, i) => (
                    <div key={i} className="flex justify-between items-center p-4 border border-gray-100 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer">{ev.filename}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Uploaded by {ev.uploadedBy} on {formatDateTime(ev.ts)}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ev.retained ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                        {ev.retained ? "Retained" : "Discarded"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
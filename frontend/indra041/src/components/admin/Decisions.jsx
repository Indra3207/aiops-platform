import { useMemo, useState } from "react";
import { DUMMY_REQUESTS } from "../../data/mockData";
import { useSystemData } from "../../context/SystemDataContext";

/* ==============================
   REUSABLE COMPONENTS
============================== */

function currency(v) {
  return v.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function statusBadge(status) {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "rejected":
      return "bg-red-50 text-red-700 border-red-200";
    case "deferred":
      return "bg-gray-50 text-gray-700 border-gray-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

export default function Decisions() {
  const { 
    getAllSystems, 
    isUsingMockData, 
    globalWorkflowState, 
    approveAdminDecision, 
    rejectAdminDecision, 
    deferAdminDecision 
  } = useSystemData();
  const systems = getAllSystems();

  const liveRequests = useMemo(() => {
    return systems
      .filter((sys) => sys.status === "critical" || globalWorkflowState[sys.id]?.escalatedToAdmin)
      .map((sys, idx) => {
        const reqId = `REQ-${sys.id.replace("SYS-", "")}-${idx+100}`;
        const override = globalWorkflowState[sys.id]?.adminDecision;
        const escalated = globalWorkflowState[sys.id]?.escalatedToAdmin;
        
        return {
          id: reqId, // Keep for UI keys
          systemId: sys.id,
          owner: sys.owner,
          requestedBy: escalated ? "Technician Escalation" : "Auto-Generated",
          status: override ? override : "pending",
          aiVerdict: escalated ? "Investigate Further" : "approve",
          confidence: sys.liveData?.diagnosis?.confidence || 85,
          rootCause: sys.liveData?.diagnosis?.root_cause || "Hardware Degradation",
          estimatedCost: Math.floor(Math.random() * 2000) + 500,
        };
      });
  }, [systems, globalWorkflowState]);

  const requests = isUsingMockData ? DUMMY_REQUESTS : liveRequests;
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const visible = useMemo(() => {
    const q = query.toLowerCase();
    return requests.filter((r) => {
      if (statusFilter !== "All" && r.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (!q) return true;
      return (
        r.id.toLowerCase().includes(q) ||
        r.systemId.toLowerCase().includes(q) ||
        r.owner.toLowerCase().includes(q)
      );
    });
  }, [requests, query, statusFilter]);

  const openDrawer = (r) => {
    setSelected(r);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setSelected(null);
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Replacement Decisions
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          AI verified hardware replacement approvals
        </p>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <input
          placeholder="Search requests..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border border-gray-200 px-4 py-2 rounded-lg bg-white w-full md:w-72 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 px-4 py-2 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium text-gray-700"
        >
          <option value="All">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="deferred">Deferred</option>
        </select>
      </div>

      {/* DECISION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {visible.map((r) => (
          <div
            key={r.id}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-150"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">
                {r.id}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge(
                  r.status
                )}`}
              >
                {r.status.toUpperCase()}
              </span>
            </div>

            <p className="text-sm font-medium text-gray-900 mb-1">
              System: <span className="font-normal text-gray-600">{r.systemId}</span>
            </p>
            <p className="text-sm font-medium text-gray-900 mb-4">
              Owner: <span className="font-normal text-gray-600">{r.owner}</span>
            </p>

            <div className="space-y-2 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">AI Verdict:</span>
                <span className={`font-semibold ${r.aiVerdict === 'approve' ? 'text-emerald-700' : 'text-red-700'}`}>
                  {r.aiVerdict.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Confidence:</span>
                <span className="font-medium text-gray-900">{r.confidence}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Root Cause:</span>
                <span className="font-medium text-gray-900">{r.rootCause}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200 mt-2">
                <span className="text-gray-900 font-medium">Estimated Cost:</span>
                <span className="font-bold text-gray-900">{currency(r.estimatedCost)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => openDrawer(r)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                View Details
              </button>

              {r.status === "pending" && (
                <button 
                  onClick={() => approveAdminDecision(r.systemId)}
                  className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors">
                    Quick Approve
                  </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* DRAWER */}
      {drawerOpen && selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
            onClick={closeDrawer}
          />
          <aside className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col pointer-events-auto transition-transform">
            
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selected.id}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  System: {selected.systemId} • {selected.owner}
                </p>
              </div>
              <button onClick={closeDrawer} className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-8 overflow-y-auto flex-1">
              
              {/* AI DECISION */}
              <section className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                <h3 className="text-base font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded flex items-center justify-center text-xs">AI</span>
                  Decision Analysis
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-indigo-700/80">Verdict:</span>
                    <span className="font-bold text-indigo-900">{selected.aiVerdict.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-indigo-700/80">Confidence:</span>
                    <span className="font-bold text-indigo-900">{selected.confidence}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-indigo-700/80">Root Cause:</span>
                    <span className="font-bold text-indigo-900">{selected.rootCause}</span>
                  </div>
                </div>
              </section>

              {/* SYSTEM INFO */}
              <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  System Overview
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">System ID:</span>
                    <span className="font-medium text-gray-900">{selected.systemId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Owner:</span>
                    <span className="font-medium text-gray-900">{selected.owner}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Requested By:</span>
                    <span className="font-medium text-gray-900">{selected.requestedBy}</span>
                  </div>
                </div>
              </section>

              {/* ACTION PANEL */}
              {selected.status === "pending" && (
                <section className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Reviewer Actions
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => { approveAdminDecision(selected.systemId); closeDrawer(); }} className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-lg text-sm shadow-sm hover:bg-emerald-700 transition-colors">
                        Approve
                      </button>
                    <button onClick={() => { rejectAdminDecision(selected.systemId); closeDrawer(); }} className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg text-sm shadow-sm hover:bg-red-700 transition-colors">
                        Reject
                      </button>
                    <button onClick={() => { deferAdminDecision(selected.systemId); closeDrawer(); }} className="px-5 py-2.5 bg-white text-gray-700 border border-gray-200 font-medium rounded-lg text-sm shadow-sm hover:bg-gray-50 transition-colors">
                        Defer
                      </button>
                    <button className="px-5 py-2.5 bg-white text-indigo-600 border border-indigo-200 font-medium rounded-lg text-sm shadow-sm hover:bg-indigo-50 transition-colors">
                        Request Evidence
                      </button>
                  </div>
                </section>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
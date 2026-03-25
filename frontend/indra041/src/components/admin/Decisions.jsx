import { useMemo, useState } from "react";

const DUMMY_REQUESTS = [
  {
    id: "REQ-2026-001",
    systemId: "SYS-8472",
    owner: "Manufacturing / Line B",
    requestedBy: "tech.alex",
    aiVerdict: "approve",
    rootCause: "Hardware",
    confidence: 94,
    estimatedCost: 4200,
    riskIfDelayed: "High",
    status: "pending",
  },
  {
    id: "REQ-2026-002",
    systemId: "SYS-9031",
    owner: "Data Center / Rack 7",
    requestedBy: "ops.maya",
    aiVerdict: "reject",
    rootCause: "Software",
    confidence: 78,
    estimatedCost: 1600,
    riskIfDelayed: "Medium",
    status: "pending",
  },
  {
    id: "REQ-2026-003",
    systemId: "SYS-7720",
    owner: "R&D / Lab",
    requestedBy: "eng.sam",
    aiVerdict: "approve",
    rootCause: "Hardware",
    confidence: 85,
    estimatedCost: 1200,
    riskIfDelayed: "Low",
    status: "approved",
  },
];

function currency(v) {
  return v.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function statusBadge(status) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "deferred":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function Decisions() {

  const [requests] = useState(DUMMY_REQUESTS);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const visible = useMemo(() => {

    const q = query.toLowerCase();

    return requests.filter((r) => {

      if (statusFilter !== "All" && r.status !== statusFilter) return false;

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
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">

      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Replacement Decisions
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          AI verified hardware replacement approvals
        </p>
      </div>


      {/* FILTERS */}

      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">

        <input
          placeholder="Search requests..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border px-4 py-2 rounded-md w-full md:w-72"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border px-3 py-2 rounded-md"
        >
          <option>All</option>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
          <option value="deferred">deferred</option>
        </select>

      </div>


      {/* DECISION CARDS */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {visible.map((r) => (

          <div
            key={r.id}
            className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition"
          >

            <div className="flex justify-between items-center mb-3">

              <h3 className="font-semibold text-gray-900">
                {r.id}
              </h3>

              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(
                  r.status
                )}`}
              >
                {r.status}
              </span>

            </div>

            <p className="text-sm text-gray-500 mb-2">
              System: {r.systemId}
            </p>

            <p className="text-sm text-gray-600 mb-3">
              {r.owner}
            </p>

            <div className="text-sm text-gray-700 mb-2">
              AI Verdict:
              <span className="ml-1 font-semibold">
                {r.aiVerdict.toUpperCase()}
              </span>
            </div>

            <div className="text-sm text-gray-700 mb-2">
              Confidence:
              <span className="ml-1 font-semibold">
                {r.confidence}%
              </span>
            </div>

            <div className="text-sm text-gray-700 mb-2">
              Root Cause:
              <span className="ml-1 font-semibold">
                {r.rootCause}
              </span>
            </div>

            <div className="text-sm text-gray-700 mb-4">
              Estimated Cost:
              <span className="ml-1 font-semibold">
                {currency(r.estimatedCost)}
              </span>
            </div>

            <div className="flex gap-3">

              <button
                onClick={() => openDrawer(r)}
                className="flex-1 px-3 py-2 border rounded-md text-sm hover:bg-gray-100"
              >
                View Details
              </button>

              {r.status === "pending" && (
                <button className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
                  Quick Approve
                </button>
              )}

            </div>

          </div>

        ))}

      </div>


      {/* DRAWER */}

      {drawerOpen && selected && (

        <div className="fixed inset-0 z-50 flex">

          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeDrawer}
          />

          <aside className="ml-auto w-full lg:w-[720px] bg-white shadow-xl overflow-y-auto relative">

            <div className="p-6 border-b">

              <h2 className="text-xl font-bold">
                {selected.id}
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                System: {selected.systemId} • {selected.owner}
              </p>

            </div>


            <div className="p-6 space-y-6">

              {/* AI DECISION */}

              <section className="bg-gray-50 border rounded-lg p-4">

                <h3 className="font-semibold mb-2">
                  AI Decision Analysis
                </h3>

                <p className="text-sm text-gray-600">
                  Verdict: <b>{selected.aiVerdict.toUpperCase()}</b>
                </p>

                <p className="text-sm text-gray-600">
                  Confidence: <b>{selected.confidence}%</b>
                </p>

                <p className="text-sm text-gray-600">
                  Root Cause: <b>{selected.rootCause}</b>
                </p>

              </section>


              {/* SYSTEM INFO */}

              <section className="bg-white border rounded-lg p-4">

                <h3 className="font-semibold mb-2">
                  System Overview
                </h3>

                <p className="text-sm text-gray-600">
                  System ID: {selected.systemId}
                </p>

                <p className="text-sm text-gray-600">
                  Owner: {selected.owner}
                </p>

                <p className="text-sm text-gray-600">
                  Requested By: {selected.requestedBy}
                </p>

              </section>


              {/* ACTION PANEL */}

              {selected.status === "pending" && (

                <section className="border rounded-lg p-4">

                  <h3 className="font-semibold mb-3">
                    Reviewer Actions
                  </h3>

                  <div className="flex flex-wrap gap-3">

                    <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
                      Approve
                    </button>

                    <button className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">
                      Reject
                    </button>

                    <button className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700">
                      Defer
                    </button>

                    <button className="px-4 py-2 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600">
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
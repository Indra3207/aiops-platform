import React, { useState } from "react";
import SystemDiagnosis from "./SystemDiagnosis";
import { ASSIGNMENTS } from "../../data/mockData";
import { useSystemData } from "../../context/SystemDataContext";

export default function AssignedSystems() {
  const { getAllSystems, isUsingMockData, globalWorkflowState } = useSystemData();
  const systems = getAllSystems();

  const liveAssignments = React.useMemo(() => {
    return systems
      .filter(sys => globalWorkflowState[sys.id]?.assignedToTech === true || sys.status === "critical") // Include criticals by default or manually assigned
      .map(sys => ({
        id: sys.id,
        owner: sys.owner,
        severity: sys.status === "critical" ? "Critical" : "High",
        aiRootCause: sys.liveData?.diagnosis?.root_cause || "Pending AI Analysis",
        status: globalWorkflowState[sys.id]?.status || (sys.status === "critical" ? "in-progress" : "pending"),
        slaHours: sys.status === "critical" ? 4 : 24
    }));
  }, [systems, globalWorkflowState]);

  const assignments = isUsingMockData ? ASSIGNMENTS : liveAssignments;

  const [selectedSystem, setSelectedSystem] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filteredSystems = assignments.filter((sys) => {
    const matchesSearch =
      sys.id.toLowerCase().includes(search.toLowerCase()) ||
      sys.owner.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" ||
      sys.severity === filter ||
      sys.status === filter.toLowerCase() ||
      (filter === "In Progress" && sys.status === "in-progress");

    return matchesSearch && matchesFilter;
  });

  const snapshot = {
    pending: assignments.filter(s => s.status === "pending").length,
    inProgress: assignments.filter(s => s.status === "in-progress").length,
    breached: assignments.filter(s => s.slaHours < 0).length,
    awaiting: 0
  };

  const severityStyles = {
    Critical: "bg-red-50 text-red-700 border-red-200",
    High: "bg-orange-50 text-orange-700 border-orange-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    Low: "bg-emerald-50 text-emerald-700 border-emerald-200"
  };

  const statusStyles = {
    pending: "bg-gray-50 text-gray-700 border-gray-200",
    "in-progress": "bg-indigo-50 text-indigo-700 border-indigo-200",
    resolved: "bg-emerald-50 text-emerald-700 border-emerald-200"
  };

  if (selectedSystem) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedSystem(null)}
          className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1"
        >
          &larr; Back to Assigned Systems
        </button>
        <SystemDiagnosis systemId={selectedSystem} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Assigned Systems
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Systems assigned to you for investigation
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search system or owner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 px-4 py-2 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="All">All</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="pending">Pending</option>
            <option value="In Progress">In Progress</option>
          </select>
        </div>
      </div>

      {/* SNAPSHOT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SnapshotCard label="Pending investigations" value={snapshot.pending} />
        <SnapshotCard label="In Progress" value={snapshot.inProgress} highlight />
        <SnapshotCard label="SLA Breached" value={snapshot.breached} danger />
        <SnapshotCard label="Total Assigned" value={assignments.length} />
      </div>

      {/* SYSTEMS TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4 text-left whitespace-nowrap">System</th>
                <th className="px-6 py-4 text-left whitespace-nowrap">Owner</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Severity</th>
                <th className="px-6 py-4 text-left whitespace-nowrap">AI Root Cause</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">SLA</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSystems.map((sys) => (
                <tr key={sys.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-indigo-600">
                    {sys.id}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {sys.owner}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${severityStyles[sys.severity]}`}>
                      {sys.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {sys.aiRootCause}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${statusStyles[sys.status]}`}>
                      {sys.status.replace("-", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-semibold ${
                      sys.slaHours < 0
                        ? "text-red-600"
                        : sys.slaHours < 6
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}>
                      {sys.slaHours < 0 ? "BREACHED" : `${sys.slaHours} hrs`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setSelectedSystem(sys.id)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
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
  );
}

const SnapshotCard = ({ label, value, danger, highlight }) => (
  <div className={`border rounded-xl p-5 shadow-sm transition-all ${
    danger ? "border-red-200 bg-red-50" : highlight ? "border-indigo-200 bg-indigo-50/50" : "bg-white border-gray-200"
  }`}>
    <p className={`text-sm font-medium ${danger ? "text-red-800" : highlight ? "text-indigo-800" : "text-gray-500"}`}>
      {label}
    </p>
    <p className={`text-3xl font-bold mt-2 ${
      danger ? "text-red-600" : highlight ? "text-indigo-600" : "text-gray-900"
    }`}>
      {value}
    </p>
  </div>
);
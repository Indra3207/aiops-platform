import React, { useMemo, useState } from "react";
import { useSystemData } from "../../context/SystemDataContext";

/* ==============================
   REUSABLE COMPONENTS
============================== */

// ----------------------------
// Status Badge
// ----------------------------
function statusBadge(status) {
  switch (status.toLowerCase()) {
    case "healthy":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "warning":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "critical":
      return "bg-red-50 text-red-700 border border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border border-gray-200";
  }
}

// ----------------------------
// Component
// ----------------------------
export default function SystemsOverview({ openSystem }) {
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  const { getAllSystems, assignToTechnician, globalWorkflowState } = useSystemData();
  const SYSTEMS = getAllSystems();

  const filteredSystems = useMemo(() => {
    return SYSTEMS.filter((system) => {
      if (
        search &&
        !system.id.toLowerCase().includes(search.toLowerCase()) &&
        !system.owner.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (statusFilter !== "All" && system.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [statusFilter, search]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Systems Overview
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            AI evaluated system health across all managed devices
          </p>
        </div>
      </div>

      {/* SEARCH + FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search system ID or owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full md:w-72 shadow-sm"
        />

        {/* STATUS FILTER */}
        <div className="flex gap-2 flex-wrap">
          {["All", "Healthy", "Warning", "Critical"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors border shadow-sm ${
                statusFilter === status
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* SYSTEM CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSystems.map((system) => (
          <div
            key={system.id}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-150"
          >
            {/* CARD HEADER */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                {system.id}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge(
                  system.status
                )}`}
              >
                {system.status.charAt(0).toUpperCase() + system.status.slice(1)}
              </span>
            </div>

            {/* OWNER */}
            <p className="text-sm text-gray-600 mb-5">
              {system.owner}
            </p>

            {/* HEALTH SCORE */}
            <div className="mb-5 flex justify-between items-center">
              <div>
                <div className="text-xs text-gray-500 font-medium">
                  Health Score
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {system.healthScore}
                </div>
              </div>
              
              <div className="w-12 h-12 relative flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="stroke-gray-100"
                    strokeWidth="4"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={
                      system.healthScore >= 80 ? "stroke-emerald-500" :
                      system.healthScore >= 50 ? "stroke-amber-500" : "stroke-red-500"
                    }
                    strokeWidth="4"
                    strokeDasharray={`${system.healthScore}, 100`}
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>
            </div>

            {/* ROOT CAUSE */}
            <div className="text-sm text-gray-600 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
              Root Cause:
              <span className="ml-1 font-medium text-gray-900">
                {system.primaryRootCause || "N/A"}
              </span>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3">
              <button
                onClick={() => openSystem(system)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                Details
              </button>
              
              <div className="flex-1 w-full">
                <button
                    onClick={() => assignToTechnician(system.id)}
                    className={`w-full px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors shadow-sm ${
                      globalWorkflowState[system.id]?.assignedToTech ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    {globalWorkflowState[system.id]?.assignedToTech ? "✓ Assigned" : "Assign"}
                  </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
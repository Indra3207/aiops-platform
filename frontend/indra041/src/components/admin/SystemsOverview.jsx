import React, { useMemo, useState } from "react";

const DUMMY_SYSTEMS = [
  {
    id: "SYS-1001",
    owner: "Manufacturing / Line A",
    healthScore: 92,
    status: "healthy",
    primaryRootCause: "Hardware",
  },
  {
    id: "SYS-1002",
    owner: "Data Center / Rack 7",
    healthScore: 64,
    status: "warning",
    primaryRootCause: "Software",
  },
  {
    id: "SYS-1003",
    owner: "Field Device / Pump 4",
    healthScore: 38,
    status: "critical",
    primaryRootCause: "Security",
  },
  {
    id: "SYS-1004",
    owner: "Office / Finance",
    healthScore: 85,
    status: "healthy",
    primaryRootCause: "Software",
  },
];

// ----------------------------
// Status Badge
// ----------------------------

function statusBadge(status) {
  switch (status) {
    case "healthy":
      return "bg-green-100 text-green-700";
    case "warning":
      return "bg-yellow-100 text-yellow-700";
    case "critical":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

// ----------------------------
// Component
// ----------------------------

export default function SystemsOverview({ openSystem }) {

  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filteredSystems = useMemo(() => {

    return DUMMY_SYSTEMS.filter((system) => {

      if (
        search &&
        !system.id.toLowerCase().includes(search.toLowerCase()) &&
        !system.owner.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }

      if (statusFilter !== "All" && system.status !== statusFilter.toLowerCase()) {
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
          <h1 className="text-2xl font-semibold text-gray-900">
            Systems Overview
          </h1>

          <p className="text-sm text-gray-500">
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
          className="border rounded-md px-4 py-2 text-sm w-full md:w-72"
        />


        {/* STATUS FILTER */}

        <div className="flex gap-2 flex-wrap">

          {["All", "Healthy", "Warning", "Critical"].map((status) => (

            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                statusFilter === status
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white hover:bg-gray-100"
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
            className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition"
          >

            {/* CARD HEADER */}

            <div className="flex items-center justify-between mb-3">

              <h3 className="font-semibold text-gray-900">
                {system.id}
              </h3>

              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(
                  system.status
                )}`}
              >
                {system.status}
              </span>

            </div>


            {/* OWNER */}

            <p className="text-sm text-gray-500 mb-4">
              {system.owner}
            </p>


            {/* HEALTH SCORE */}

            <div className="mb-4">

              <div className="text-xs text-gray-500">
                Health Score
              </div>

              <div className="text-2xl font-bold text-gray-900">
                {system.healthScore}
              </div>

            </div>


            {/* ROOT CAUSE */}

            <div className="text-sm text-gray-600 mb-4">

              Root Cause:
              <span className="ml-1 font-medium">
                {system.primaryRootCause}
              </span>

            </div>


            {/* ACTION BUTTONS */}

            <div className="flex gap-3">

              <button
                onClick={() => openSystem(system)}
                className="flex-1 px-3 py-2 border rounded-md text-sm hover:bg-gray-100"
              >
                Details
              </button>

              <button
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Assign
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}
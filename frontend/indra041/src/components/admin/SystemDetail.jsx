import React, { useState } from "react";
import {
  Server,
  Activity,
  Shield,
  Cpu,
  ArrowLeft
} from "lucide-react";

export default function SystemDetail({ system, goBack }) {

  const [activeTab, setActiveTab] = useState("hardware");

  if (!system) return null;

  const statusColor =
    system.healthScore >= 80
      ? "bg-green-100 text-green-700"
      : system.healthScore >= 50
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between gap-6">

        <div>

          <button
            onClick={goBack}
            className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-3"
          >
            <ArrowLeft size={16} />
            Back to Systems
          </button>

          <div className="flex items-center gap-3 mb-2">

            <Server size={22} className="text-blue-600" />

            <h2 className="text-2xl font-semibold">
              {system.id}
            </h2>

            <span
              className={`px-3 py-1 text-xs rounded-full font-medium ${statusColor}`}
            >
              {system.healthScore >= 80
                ? "Healthy"
                : system.healthScore >= 50
                ? "Warning"
                : "Critical"}
            </span>

          </div>

          <p className="text-gray-500">
            {system.owner}
          </p>

        </div>


        {/* HEALTH CARD */}

        <div className="bg-white border rounded-xl p-5 shadow-sm w-full md:w-64">

          <div className="text-sm text-gray-500 mb-1">
            Health Score
          </div>

          <div className="flex items-center justify-between">

            <span className="text-3xl font-bold">
              {system.healthScore}
            </span>

            <Activity className="text-blue-600" />

          </div>

        </div>

      </div>



      {/* TABS */}

      <div className="border-b">

        <div className="flex gap-2 overflow-x-auto pb-2">

          {[
            { id: "hardware", label: "Hardware", icon: Cpu },
            { id: "software", label: "Software", icon: Server },
            { id: "security", label: "Security", icon: Shield }
          ].map((tab) => {

            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition ${
                  activeTab === tab.id
                    ? "bg-gray-100 font-medium"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}

        </div>

      </div>



      {/* TAB CONTENT */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {activeTab === "hardware" && (

          <div className="bg-white border rounded-xl p-6 shadow-sm">

            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Cpu size={18} />
              Hardware Health
            </h3>

            <p className="text-sm text-gray-600 leading-relaxed">
              AI analysis detected abnormal disk I/O patterns and possible
              hardware degradation. Predictive models suggest proactive
              inspection of disk components within the next maintenance window.
            </p>

          </div>

        )}

        {activeTab === "software" && (

          <div className="bg-white border rounded-xl p-6 shadow-sm">

            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Server size={18} />
              Software Health
            </h3>

            <p className="text-sm text-gray-600 leading-relaxed">
              Pending OS patches detected along with application memory
              anomalies. System logs indicate retry storms affecting
              telemetry services.
            </p>

          </div>

        )}

        {activeTab === "security" && (

          <div className="bg-white border rounded-xl p-6 shadow-sm">

            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Shield size={18} />
              Security Status
            </h3>

            <p className="text-sm text-gray-600 leading-relaxed">
              No malware activity detected. However, anomaly detection
              models flagged unusual outbound network traffic patterns
              which should be investigated further.
            </p>

          </div>

        )}

      </div>



      {/* ACTION PANEL */}

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">

        <button className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
          Assign Technician
        </button>

        <button className="px-5 py-2 border rounded-md hover:bg-gray-100 transition">
          Approve Replacement
        </button>

      </div>

    </div>
  );
}
import React from "react";
import { useSystemData } from "../../context/SystemDataContext";

/*
  MySystemDetail.jsx
  ------------------
  Purpose:
  - Explain system health to non-technical users in plain language
  - Build trust through transparency
  - Avoid technical jargon and raw metrics
*/

// ===================================================
// HELPER: STATUS STYLE
// ===================================================
const statusStyle = (state) => {
  switch (state.toLowerCase()) {
    case "good":
      return {
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: "✓",
      };
    case "attention":
      return {
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        icon: "⚠️",
      };
    case "critical":
      return {
        badge: "bg-red-50 text-red-700 border-red-200",
        icon: "🚨",
      };
    default:
      return {
        badge: "bg-gray-50 text-gray-700 border-gray-200",
        icon: "?",
      };
  }
};

// ===================================================
// MAIN COMPONENT
// ===================================================
export default function MySystemDetail() {
  const { getUserSystemDetail, getAllSystems, isUsingMockData } = useSystemData();
  const systems = getAllSystems();
  const targetId = systems.length > 0 ? systems[0].id : "SYS-1049";
  
  // Use mock data fallback if active, otherwise live data
  const systemHealth = getUserSystemDetail(targetId);
  
  // Provide safe fallbacks if live data doesn't have explanations yet
  const { 
    systemName = "Endpoint Machine", 
    systemId = targetId, 
    overallStatus = "healthy", 
    explanation = systemHealth?.explanations?.user_friendly || {
        what: "Waiting for AI analysis...",
        why: "System telemetry is being processed.",
        hardwareFault: "N/A"
    }, 
    statuses = {
      Hardware: {
        state: systemHealth?.signals?.hardware_state || "good",
        message: systemHealth?.explanations?.admin_assessments?.hardware || "Hardware operating normally."
      },
      Software: {
        state: systemHealth?.signals?.software_state || "good",
        message: systemHealth?.explanations?.admin_assessments?.software || "Software systems stable."
      },
      Security: {
        state: systemHealth?.signals?.security_state || "good",
        message: systemHealth?.explanations?.admin_assessments?.security || "No security issues detected."
      }
    },
    actions = systemHealth?.user_actions?.map((a, i) => ({ id: i, icon: "🔧", text: a })) || []
  } = isUsingMockData ? systemHealth : {};

  const overallBadge =
    overallStatus === "healthy"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : overallStatus === "attention"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";

  return (
    <div className="space-y-6">
      {/* ===================================================
          PAGE HEADER
          =================================================== */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          My System
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">{systemName}</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${overallBadge}`}
          >
            {overallStatus === "healthy"
              ? "Healthy"
              : overallStatus === "attention"
              ? "Needs Attention"
              : "Critical"}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">System ID: {systemId}</p>
      </div>

      {/* ===================================================
          HEALTH EXPLANATION
          =================================================== */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          What’s going on?
        </h2>

        <div className="space-y-4 text-sm text-gray-700">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <strong className="text-gray-900 block mb-1">What’s happening:</strong> 
            {explanation.what}
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <strong className="text-gray-900 block mb-1">What you might notice:</strong> 
            {explanation.why}
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <strong className="text-gray-900 block mb-1">Is hardware at fault?</strong> 
            {explanation.hardwareFault}
          </div>
        </div>
      </div>

      {/* ===================================================
          STATUS CARDS
          =================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {Object.entries(statuses).map(([key, value]) => {
          const style = statusStyle(value.state);
          return (
            <div
              key={key}
              className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow duration-150"
            >
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 border text-lg font-bold ${style.badge}`}
              >
                {style.icon}
              </div>
              <h3 className="font-semibold text-gray-900 capitalize mb-2">
                {key} Status
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{value.message}</p>
            </div>
          );
        })}
      </div>

      {/* ===================================================
          SUGGESTED ACTIONS
          =================================================== */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-indigo-900 mb-4">
          What should you do?
        </h2>

        <ul className="space-y-3">
          {actions.map((action) => (
            <li
              key={action.id}
              className="flex items-center gap-4 bg-white/60 p-3 rounded-lg border border-indigo-100 text-sm text-gray-800 font-medium"
            >
              <span className="text-xl w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-indigo-50 shrink-0">{action.icon}</span>
              <span>{action.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

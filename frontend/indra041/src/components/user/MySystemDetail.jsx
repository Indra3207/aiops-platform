// src/components/pages/MySystemDetail.jsx
import React from "react";

/*
  MySystemDetail.jsx
  ------------------
  Purpose:
  - Explain system health to non-technical users in plain language
  - Build trust through transparency
  - Avoid technical jargon and raw metrics

  Backend (future):
  - GET /api/user/system-detail
  - GET /api/user/system-explanation
*/

// ===================================================
// DUMMY DATA (replace with backend later)
// ===================================================
const systemDetail = {
  systemName: "Manufacturing Line B Workstation",
  systemId: "SYS-8472",
  overallStatus: "healthy", // healthy | attention | critical

  explanation: {
    what: "Your system is running normally with no signs of failure.",
    why: "You should not notice any slowdowns or unexpected behavior.",
    hardwareFault: "No hardware problems detected. All components are functioning as expected.",
  },

  statuses: {
    hardware: {
      state: "good",
      message: "Physical components are working correctly.",
    },
    software: {
      state: "good",
      message: "Required applications are stable and up to date.",
    },
    security: {
      state: "good",
      message: "No security risks or suspicious activity found.",
    },
  },

  actions: [
    {
      id: 1,
      text: "No action required at this time.",
      icon: "✅",
    },
    {
      id: 2,
      text: "We’ll notify you if anything needs attention.",
      icon: "🔔",
    },
  ],
};

// ===================================================
// HELPER: STATUS STYLE
// ===================================================
const statusStyle = (state) => {
  switch (state) {
    case "good":
      return {
        badge: "bg-green-100 text-green-700",
        icon: "✓",
      };
    case "attention":
      return {
        badge: "bg-yellow-100 text-yellow-800",
        icon: "⚠️",
      };
    case "critical":
      return {
        badge: "bg-red-100 text-red-700",
        icon: "🚨",
      };
    default:
      return {
        badge: "bg-gray-100 text-gray-700",
        icon: "?",
      };
  }
};

// ===================================================
// MAIN COMPONENT
// ===================================================
export default function MySystemDetail() {
  const { systemName, systemId, overallStatus, explanation, statuses, actions } =
    systemDetail;

  const overallBadge =
    overallStatus === "healthy"
      ? "bg-green-100 text-green-700"
      : overallStatus === "attention"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-700";

  return (
    <div className="space-y-6">
      {/* ===================================================
          PAGE HEADER
          =================================================== */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          My System
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">{systemName}</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${overallBadge}`}
          >
            {overallStatus === "healthy"
              ? "Healthy"
              : overallStatus === "attention"
              ? "Needs Attention"
              : "Critical"}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">System ID: {systemId}</p>
      </div>

      {/* ===================================================
          HEALTH EXPLANATION
          =================================================== */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          What’s going on?
        </h2>

        <div className="space-y-3 text-sm text-slate-700">
          <p>
            <strong>What’s happening:</strong> {explanation.what}
          </p>
          <p>
            <strong>What you might notice:</strong> {explanation.why}
          </p>
          <p>
            <strong>Is hardware at fault?</strong> {explanation.hardwareFault}
          </p>
        </div>
      </div>

      {/* ===================================================
          STATUS CARDS
          =================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(statuses).map(([key, value]) => {
          const style = statusStyle(value.state);
          return (
            <div
              key={key}
              className="bg-white border rounded-lg p-5 text-center"
            >
              <div
                className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-3 ${style.badge}`}
              >
                {style.icon}
              </div>
              <h3 className="font-semibold text-slate-900 capitalize mb-1">
                {key} Status
              </h3>
              <p className="text-sm text-slate-600">{value.message}</p>
            </div>
          );
        })}
      </div>

      {/* ===================================================
          SUGGESTED ACTIONS
          =================================================== */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          What should you do?
        </h2>

        <ul className="space-y-3">
          {actions.map((action) => (
            <li
              key={action.id}
              className="flex items-start gap-3 text-sm text-slate-700"
            >
              <span className="text-lg">{action.icon}</span>
              <span>{action.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

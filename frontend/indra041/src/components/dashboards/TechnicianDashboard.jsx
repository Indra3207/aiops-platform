import { useState, useMemo } from "react";
import {
  AlertTriangle,
  Activity,
  Clock,
  CheckCircle,
  Cpu,
  Wrench,
  Brain,
} from "lucide-react";
import { ACTIVITY } from "../../data/mockData";
import { useSystemData } from "../../context/SystemDataContext";
import { Loader2 } from "lucide-react";

/* ==============================
   REUSABLE COMPONENTS
============================== */


/* ==============================
   UTIL
============================== */

function severityColor(sev) {
  const norm = sev.toLowerCase();
  if (norm === "critical") return "bg-red-50 text-red-700 border border-red-200";
  if (norm === "high") return "bg-orange-50 text-orange-700 border border-orange-200";
  if (norm === "medium" || norm === "warning" || norm === "attention") return "bg-amber-50 text-amber-700 border border-amber-200";
  if (norm === "low") return "bg-blue-50 text-blue-700 border border-blue-200";
  if (norm === "healthy" || norm === "good" || norm === "approved") return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  return "bg-gray-100 text-gray-600 border border-gray-200";
}

function healthColor(score) {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

/* ==============================
   COMPONENT
============================== */

export default function TechnicianDashboard({ navigateTo }) {
  const { getAssignedSystems, systemsMap, isUsingMockData } = useSystemData();
  const assignments = getAssignedSystems();

  const metrics = useMemo(() => {
    const critical = assignments.filter(a => a.severity.toLowerCase() === "critical").length;
    const overdue = assignments.filter(a => a.slaHours < 0).length;
    const inProgress = assignments.filter(a => a.status === "in-progress").length;

    return {
      critical,
      overdue,
      inProgress,
      total: assignments.length,
    };
  }, [assignments]);

  // Extract AI Insights specific to this technician's assignments
  const aiGuidance = useMemo(() => {
     if (isUsingMockData || systemsMap.size === 0) return [];

     return assignments
       .map(a => systemsMap.get(a.id))
       .filter(sys => sys && sys.explanations?.technical)
       .map(sys => ({
          id: sys.system_info.system_id,
          system: sys.system_info.system_id,
          summary: sys.explanations.technical,
          confidence: sys.diagnosis.confidence || 0
       }))
       .slice(0, 3); // Max 3 items
  }, [assignments, systemsMap, isUsingMockData]);

  const activity = useMemo(() => {
    if (isUsingMockData) return ACTIVITY;
    if (assignments.length === 0) return [];
    
    return assignments.map(a => ({
      id: Math.random().toString(),
      action: a.status === "in-progress" ? "Investigation Started" : "System Alert Flagged",
      system: a.id,
      time: "Just now",
      actor: a.status === "in-progress" ? "Technician" : "NexusOps System"
    })).slice(0, 5);
  }, [assignments, isUsingMockData]);

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Technician Dashboard
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Assigned investigations and system monitoring
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        <MetricCard
          icon={<Cpu size={24} />}
          title="Assigned Systems"
          value={metrics.total}
        />

        <MetricCard
          icon={<AlertTriangle size={24} />}
          title="Critical Alerts"
          value={metrics.critical}
        />

        <MetricCard
          icon={<Clock size={24} />}
          title="SLA Breaches"
          value={metrics.overdue}
        />

        <MetricCard
          icon={<CheckCircle size={24} />}
          title="In Progress"
          value={metrics.inProgress}
        />

      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* LEFT */}
        <div className="xl:col-span-2 space-y-6">

          {/* AI GUIDANCE */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={20} className="text-indigo-600" />
              <h2 className="text-base font-semibold text-gray-900">
                AI Investigation Guidance
              </h2>
            </div>
            <div className="space-y-3">
              {aiGuidance.length > 0 ? (
                aiGuidance.map(item => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 flex justify-between items-center transition-colors hover:bg-gray-50 shadow-sm"
                  >
                    <div className="pr-4">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        System {item.system}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {item.summary}
                      </p>
                    </div>
                    <div className="text-right text-sm font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md shrink-0 border border-indigo-100">
                      {item.confidence}%
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                   {!isUsingMockData && assignments.length > 0 ? (
                     <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                        <span className="text-sm font-medium">Generating technical guidance...</span>
                     </div>
                   ) : (
                     <div className="text-center">
                       <CheckCircle className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                       <span className="text-sm font-medium">No critical actions required.</span>
                     </div>
                   )}
                </div>
              )}
            </div>
          </div>

          {/* PRIORITY QUEUE */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Priority Investigation Queue
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="text-left py-3 px-4 rounded-tl-lg">System</th>
                    <th className="text-left py-3 px-4">Severity</th>
                    <th className="text-left py-3 px-4">Root Cause</th>
                    <th className="text-left py-3 px-4">Confidence</th>
                    <th className="text-left py-3 px-4">Health</th>
                    <th className="text-left py-3 px-4 rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(sys => (
                    <tr key={sys.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{sys.id}</p>
                          <p className="text-xs text-gray-500">{sys.owner}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${severityColor(
                            sys.severity
                          )}`}
                        >
                          {sys.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {sys.aiRootCause}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-full">
                          {sys.confidence}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${healthColor(
                                sys.healthScore
                              )}`}
                              style={{ width: `${Math.max(0, Math.min(100, sys.healthScore))}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 font-medium">
                            {sys.healthScore}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button 
                          onClick={() => navigateTo ? navigateTo("assigned") : {}}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-lg transition-colors shadow-sm">
                            <Wrench size={14} />
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

        {/* RIGHT ACTIVITY */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-fit">
          <h2 className="text-base font-semibold text-gray-900 mb-6">
            Recent Activity
          </h2>
          <div className="space-y-5">
            {activity.length === 0 ? (
              <p className="text-sm text-gray-500">No recent activity.</p>
            ) : (
              activity.map(item => (
              <div key={item.id} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Activity size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {item.action}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.system} • {item.time}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    By: {item.actor}
                  </p>
                </div>
              </div>
            )))}
          </div>
        </div>

      </div>

    </div>
  );
}

/* ==============================
   METRIC CARD
============================== */

function MetricCard({ icon, title, value }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow duration-150 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-700">{title}</p>
        <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
      </div>
      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
        {icon}
      </div>
    </div>
  );
}
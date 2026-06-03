import React, { useState } from "react";
import { useSystemData } from "../../context/SystemDataContext";
import {
  Server,
  Activity,
  Shield,
  Cpu,
  ArrowLeft,
  Loader2
} from "lucide-react";

/* ==============================
   REUSABLE COMPONENTS
============================== */

export default function SystemDetail({ system, goBack }) {
  const [activeTab, setActiveTab] = useState("hardware");
  
  const { assignToTechnician, approveAdminDecision, globalWorkflowState } = useSystemData();
  const isAssigned = globalWorkflowState[system?.id]?.assignedToTech;
  const isApproved = globalWorkflowState[system?.id]?.adminDecision === "approved";

  if (!system) return null;
  const liveData = system.liveData;
  const isAILoading = liveData?.ai_status === "loading";

  const statusColor =
    system.healthScore >= 80
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : system.healthScore >= 50
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between gap-6">
        <div>
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:underline mb-4"
          >
            <ArrowLeft size={16} />
            Back to Systems
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <Server size={20} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {system.id}
            </h2>
            <span
              className={`px-2.5 py-0.5 text-xs rounded-full font-semibold border ${statusColor}`}
            >
              {system.healthScore >= 80
                ? "Healthy"
                : system.healthScore >= 50
                ? "Warning"
                : "Critical"}
            </span>
          </div>

          <p className="text-sm text-gray-600 mt-1 ml-13">
            {system.owner}
          </p>
        </div>

        {/* HEALTH CARD */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm w-full md:w-64">
          <div className="text-sm font-medium text-gray-500 mb-2">
            Health Score
          </div>
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold text-gray-900">
              {system.healthScore}
            </span>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
              <Activity size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6 overflow-x-auto">
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
                className={`flex items-center gap-2 pb-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
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
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative">
            {isAILoading && <div className="absolute inset-0 bg-white/50 z-10 rounded-xl flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>}
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Cpu size={18} className="text-indigo-600" />
              Hardware Health
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100 min-h-[100px]">
              {liveData?.explanations?.admin_assessments?.hardware || "No hardware assessment available."}
            </p>
          </div>
        )}

        {activeTab === "software" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative">
            {isAILoading && <div className="absolute inset-0 bg-white/50 z-10 rounded-xl flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>}
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Server size={18} className="text-indigo-600" />
              Software Health
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100 min-h-[100px]">
              {liveData?.explanations?.admin_assessments?.software || "No software assessment available."}
            </p>
          </div>
        )}

        {activeTab === "security" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative">
            {isAILoading && <div className="absolute inset-0 bg-white/50 z-10 rounded-xl flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>}
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield size={18} className="text-indigo-600" />
              Security Status
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100 min-h-[100px]">
              {liveData?.explanations?.admin_assessments?.security || "No security assessment available."}
            </p>
          </div>
        )}
      </div>

      {/* ACTION PANEL */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 mt-8">
        <button 
          onClick={() => assignToTechnician(system.id)}
          className={`w-full sm:w-auto px-6 py-2.5 text-white font-medium rounded-lg shadow-sm transition-colors ${isAssigned ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"}`}>
            {isAssigned ? "✓ Technician Assigned" : "Assign Technician"}
          </button>
        <button 
          onClick={() => approveAdminDecision(system.id)}
          className={`w-full sm:w-auto px-6 py-2.5 font-medium border rounded-lg shadow-sm transition-colors ${isApproved ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
            {isApproved ? "✓ Replacement Approved" : "Approve Replacement"}
          </button>
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { SYSTEM_DIAGNOSIS } from "../../data/mockData";

/* ==============================
   REUSABLE COMPONENTS
============================== */

import { useSystemData } from "../../context/SystemDataContext";
import { Loader2 } from "lucide-react";

export default function SystemDiagnosis({ systemId }) {
  const { getSystemDiagnosis, isUsingMockData, updateInvestigation, escalateToAdmin, globalWorkflowState } = useSystemData();
  const data = getSystemDiagnosis(systemId);
  const isAILoading = data.ai_status === "loading" && !isUsingMockData;

  const overrideState = globalWorkflowState[systemId]?.investigationData || {};
  const isEscalated = globalWorkflowState[systemId]?.escalatedToAdmin;
  
  const [notes, setNotes] = useState(overrideState.notes || "");
  const [checklist, setChecklist] = useState(overrideState.checklist || {
    evidence: false,
    logs: false,
    reproduction: false,
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [verdict, setVerdict] = useState(globalWorkflowState[systemId]?.techVerdict || null);

  const severityStyle = {
    Critical: "bg-red-50 text-red-700 border border-red-200",
    High: "bg-orange-50 text-orange-700 border border-orange-200",
    Medium: "bg-amber-50 text-amber-700 border border-amber-200",
  };

  const handleCheckbox = (field) => {
    const newVal = { ...checklist, [field]: !checklist[field] };
    setChecklist(newVal);
    updateInvestigation(systemId, { checklist: newVal });
  };

  const handleNotes = (e) => {
    setNotes(e.target.value);
    updateInvestigation(systemId, { notes: e.target.value });
  };

  const handleFileUpload = (e) => {
    setUploadedFile(e.target.files[0]);
  };

  const handleVerdict = (type) => {
    setVerdict(type);
    if (type === "escalated" || type === "confirmed") {
        escalateToAdmin(systemId, type);
    } else {
        updateInvestigation(systemId, { verdict: type });
    }
  };

  return (
    <div className="space-y-6">
      {/* SYSTEM HEADER */}
      <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {systemId || data.systemInfo.systemId}
          </h1>
          <p className="text-sm font-medium text-gray-600 mt-1">
            {data.systemInfo.owner} <span className="text-gray-400 mx-1">•</span> {data.systemInfo.os}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Assigned to: <span className="font-medium text-gray-700">{data.systemInfo.assignedTechnician}</span>
          </p>
        </div>
        <div className="text-right">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide border ${severityStyle[data.aiDiagnosis.severity] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
            {data.aiDiagnosis.severity}
          </span>
          <p className={`mt-3 font-bold ${data.systemInfo.slaHours < 0 ? "text-red-600" : "text-emerald-600"}`}>
            SLA: {data.systemInfo.slaHours < 0 ? "BREACHED" : `${data.systemInfo.slaHours} hrs remaining`}
          </p>
        </div>
      </div>

      {/* AI DIAGNOSIS SUMMARY */}
      <div className={`border rounded-xl p-6 shadow-sm transition-all duration-500 ${isAILoading ? "border-gray-200 bg-gray-50 animate-pulse" : "border-indigo-200 bg-indigo-50/50"}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-sm font-bold ${isAILoading ? "bg-gray-200 text-gray-500" : "bg-indigo-100 text-indigo-700"}`}>AI</span>
            Diagnosis Summary
          </h2>
          {isAILoading && (
             <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium">
               <Loader2 className="w-4 h-4 animate-spin" />
               Generating Analysis...
             </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm relative">
          {/* Overlay for loading state to make content semi-transparent */}
          {isAILoading && <div className="absolute inset-0 bg-white/40 z-10 rounded-lg"></div>}
          
          <div className="bg-white/80 p-4 rounded-xl border border-indigo-100">
            <span className="text-gray-500 block mb-1">Primary Root Cause</span>
            <span className="font-semibold text-gray-900">{data.aiDiagnosis.rootCause}</span>
          </div>
          <div className="bg-white/80 p-4 rounded-xl border border-indigo-100">
            <span className="text-gray-500 block mb-1">Confidence</span>
            <span className="font-bold text-indigo-600">{Math.round(data.aiDiagnosis.confidence * 100)}%</span>
          </div>
          <div className="bg-white/80 p-4 rounded-xl border border-indigo-100">
            <span className="text-gray-500 block mb-1">Predicted Failure Window</span>
            <span className="font-semibold text-gray-900">{data.aiDiagnosis.predictedWindow}</span>
          </div>
          <div className="bg-white/80 p-4 rounded-xl border border-indigo-100">
            <span className="text-gray-500 block mb-1">Technical Explanation</span>
            <span className="text-gray-700 leading-relaxed block mt-1">{data.aiDiagnosis.technicalExplanation}</span>
          </div>
        </div>
      </div>

      {/* SIGNALS */}
      <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <div className="px-6 py-4 text-sm font-medium border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/30 whitespace-nowrap">
            All Signals
          </div>
        </div>
        <div className="p-6 text-sm bg-gray-50/30">
          <div className="grid md:grid-cols-2 gap-4">
            {data.signals.map((item) => (
              <div key={item.name} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="font-semibold text-gray-900 mb-3 text-base">{item.name}</p>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Value: <span className="font-semibold text-gray-900">{item.value}</span></span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                    item.status === 'critical' ? 'bg-red-50 text-red-600' :
                    item.status === 'warning' ? 'bg-amber-50 text-amber-600' :
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Trend: <span className="capitalize">{item.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* TECHNICIAN INVESTIGATION */}
        <div className="lg:col-span-2 border border-gray-200 rounded-xl p-6 bg-white shadow-sm flex flex-col">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Technician Investigation Log</h2>
          <textarea
            value={notes}
            onChange={handleNotes}
            placeholder="Enter investigation notes, findings, and next steps..."
            className="w-full flex-1 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[160px] bg-gray-50/50"
          />
          
          <div className="mt-5 flex flex-wrap gap-5 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
            <label className="flex items-center gap-2.5 cursor-pointer font-medium text-gray-700">
              <input type="checkbox" checked={checklist.evidence} onChange={() => handleCheckbox("evidence")} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
              Evidence Verified
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer font-medium text-gray-700">
              <input type="checkbox" checked={checklist.logs} onChange={() => handleCheckbox("logs")} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
              Logs Analyzed
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer font-medium text-gray-700">
              <input type="checkbox" checked={checklist.reproduction} onChange={() => handleCheckbox("reproduction")} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
              Reproduction Attempted
            </label>
          </div>

          <div className="mt-5">
            <input type="file" onChange={handleFileUpload} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer transition-colors" />
            {uploadedFile && (
              <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {uploadedFile.name} attached
              </p>
            )}
          </div>
        </div>

        {/* TIMELINE */}
        <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm flex flex-col">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Evidence Timeline</h2>
          <div className="flex-1 overflow-y-auto pr-2 min-h-[200px]">
            <div className="space-y-6">
              {data.timeline.map((item, index) => (
                <div key={index} className="relative pl-5 border-l-2 border-indigo-100 last:border-transparent">
                  <div className="absolute w-2.5 h-2.5 bg-indigo-500 rounded-full -left-[6px] top-1.5 ring-4 ring-white"></div>
                  <p className="text-xs font-bold text-indigo-600 mb-1 tracking-wide">{item.time}</p>
                  <p className="text-sm font-medium text-gray-800 leading-snug">{item.event}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TECHNICIAN ACTIONS */}
      <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Technician Recommendation</h2>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => handleVerdict("confirmed")}
            className={`w-full sm:w-auto px-6 py-2.5 font-medium rounded-lg text-sm shadow-sm transition-colors ${verdict === "confirmed" ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
            {verdict === "confirmed" ? "✓ Verdict Confirmed" : "Confirm AI Verdict"}
          </button>
          <button 
            onClick={() => handleVerdict("alternate")}
            className={`w-full sm:w-auto px-6 py-2.5 border font-medium rounded-lg text-sm shadow-sm transition-colors ${verdict === "alternate" ? "bg-amber-600 text-white border-amber-600" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
            {verdict === "alternate" ? "✓ Alternate Suggested" : "Suggest Alternate Cause"}
          </button>
          <button 
            onClick={() => handleVerdict("more_data")}
            className={`w-full sm:w-auto px-6 py-2.5 border font-medium rounded-lg text-sm shadow-sm transition-colors ${verdict === "more_data" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
            {verdict === "more_data" ? "✓ Data Requested" : "Request More Data"}
          </button>
          <button 
            onClick={() => handleVerdict("escalated")}
            className={`w-full sm:w-auto px-6 py-2.5 border font-medium rounded-lg text-sm shadow-sm transition-colors hidden sm:block ${isEscalated ? "bg-red-600 text-white border-red-600" : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"}`}>
            {isEscalated ? "✓ Escalated to Admin" : "Escalate to Admin"}
          </button>
        </div>
      </div>
    </div>
  );
}
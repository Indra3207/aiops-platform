import React, { useState } from "react";

const SystemDiagnosis = ({ systemId }) => {

  /* ======================================================
     Dummy Backend Payload
  ====================================================== */

  const systemInfo = {
    systemId: systemId || "SYS-10234",
    owner: "Finance Department",
    systemType: "Production Database Server",
    assignedTechnician: "Indra K",
    severity: "Critical",
    slaHours: -2,
  };

  const aiDiagnosis = {
    verdict: "Hardware Failure",
    confidence: 92,
    predictedWindow: "Within 48 hours",
    explanation:
      "Disk read/write latency has increased continuously over the last 72 hours, indicating imminent storage subsystem degradation.",
  };

  const investigationSignals = {
    hardware: [
      { name: "Disk Health", risk: "High", probability: "89%" },
      { name: "I/O Controller", risk: "Medium", probability: "54%" },
    ],
    software: {
      osHealth: "Stable",
      crashes: "No kernel crashes detected",
      heavyApps: "Database write-intensive workload",
    },
    security: {
      agentIntegrity: "Verified",
      malwareRisk: "Low",
      compliance: "Compliant",
    },
  };

  const timeline = [
    { time: "2026-01-14 09:10", event: "AI Verdict Generated" },
    { time: "2026-01-14 09:15", event: "System Assigned to Technician" },
    { time: "2026-01-15 10:30", event: "Technician Opened Diagnosis" },
  ];

  /* ======================================================
     UI STATE
  ====================================================== */

  const [activeTab, setActiveTab] = useState("Hardware");
  const [notes, setNotes] = useState("");

  const [checklist, setChecklist] = useState({
    evidence: false,
    logs: false,
    reproduction: false,
  });

  const [uploadedFile, setUploadedFile] = useState(null);

  /* ======================================================
     UI HELPERS
  ====================================================== */

  const severityStyle = {
    Critical: "bg-red-100 text-red-700",
    High: "bg-orange-100 text-orange-700",
    Medium: "bg-yellow-100 text-yellow-700",
  };

  const handleCheckbox = (field) => {
    setChecklist({
      ...checklist,
      [field]: !checklist[field],
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setUploadedFile(file);
  };

  const handleAction = (action) => {
    console.log("Technician action:", action);
  };

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <div className="space-y-6">

      {/* ===============================
          SYSTEM HEADER
      =============================== */}

      <div className="border rounded-lg p-5 bg-white flex flex-col md:flex-row justify-between gap-4">

        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {systemInfo.systemId}
          </h1>

          <p className="text-sm text-gray-500">
            {systemInfo.owner} • {systemInfo.systemType}
          </p>

          <p className="text-sm text-gray-500">
            Assigned to: {systemInfo.assignedTechnician}
          </p>
        </div>

        <div className="text-right">

          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${severityStyle[systemInfo.severity]}`}
          >
            {systemInfo.severity}
          </span>

          <p
            className={`mt-2 font-semibold ${
              systemInfo.slaHours < 0
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            SLA:
            {systemInfo.slaHours < 0
              ? " BREACHED"
              : ` ${systemInfo.slaHours} hrs remaining`}
          </p>

        </div>

      </div>


      {/* ===============================
          AI DIAGNOSIS SUMMARY
      =============================== */}

      <div className="border rounded-lg p-5 bg-blue-50">

        <h2 className="text-lg font-semibold text-gray-900">
          AI Diagnosis Summary
        </h2>

        <div className="mt-3 space-y-2 text-sm">

          <p>
            <span className="font-medium">Primary Verdict:</span>{" "}
            {aiDiagnosis.verdict}
          </p>

          <p>
            <span className="font-medium">Confidence:</span>{" "}
            {aiDiagnosis.confidence}%
          </p>

          <p>
            <span className="font-medium">Predicted Failure Window:</span>{" "}
            {aiDiagnosis.predictedWindow}
          </p>

          <p className="text-gray-700">{aiDiagnosis.explanation}</p>

        </div>

      </div>


      {/* ===============================
          TABBED SIGNAL VIEW
      =============================== */}

      <div className="border rounded-lg bg-white">

        <div className="flex border-b">

          {["Hardware", "Software", "Security"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === tab
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500"
              }`}
            >
              {tab} Signals
            </button>
          ))}

        </div>

        <div className="p-4 text-sm">

          {activeTab === "Hardware" && (
            <div className="grid md:grid-cols-2 gap-4">
              {investigationSignals.hardware.map((item) => (
                <div
                  key={item.name}
                  className="border rounded p-3"
                >
                  <p className="font-medium">{item.name}</p>
                  <p>Risk: {item.risk}</p>
                  <p>Failure Probability: {item.probability}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Software" && (
            <div className="space-y-2">
              <p>OS Health: {investigationSignals.software.osHealth}</p>
              <p>Crash Patterns: {investigationSignals.software.crashes}</p>
              <p>Heavy Applications: {investigationSignals.software.heavyApps}</p>
            </div>
          )}

          {activeTab === "Security" && (
            <div className="space-y-2">
              <p>Agent Integrity: {investigationSignals.security.agentIntegrity}</p>
              <p>Malware Risk: {investigationSignals.security.malwareRisk}</p>
              <p>Compliance Status: {investigationSignals.security.compliance}</p>
            </div>
          )}

        </div>

      </div>


      {/* ===============================
          TECHNICIAN INVESTIGATION
      =============================== */}

      <div className="border rounded-lg p-5 bg-white">

        <h2 className="font-semibold mb-3">Technician Investigation</h2>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter investigation notes..."
          className="w-full border rounded p-2 text-sm"
          rows={4}
        />

        <div className="mt-3 flex flex-wrap gap-4 text-sm">

          <label>
            <input
              type="checkbox"
              checked={checklist.evidence}
              onChange={() => handleCheckbox("evidence")}
              className="mr-1"
            />
            Evidence Verified
          </label>

          <label>
            <input
              type="checkbox"
              checked={checklist.logs}
              onChange={() => handleCheckbox("logs")}
              className="mr-1"
            />
            Logs Analyzed
          </label>

          <label>
            <input
              type="checkbox"
              checked={checklist.reproduction}
              onChange={() => handleCheckbox("reproduction")}
              className="mr-1"
            />
            Reproduction Attempted
          </label>

        </div>

        <div className="mt-4">

          <input
            type="file"
            onChange={handleFileUpload}
            className="text-sm"
          />

          {uploadedFile && (
            <p className="text-xs text-gray-500 mt-2">
              Uploaded: {uploadedFile.name}
            </p>
          )}

        </div>

      </div>


      {/* ===============================
          TECHNICIAN ACTIONS
      =============================== */}

      <div className="border rounded-lg p-5 bg-white">

        <h2 className="font-semibold mb-3">Technician Recommendation</h2>

        <div className="grid md:grid-cols-2 gap-3">

          <ActionButton
            label="Confirm AI Verdict"
            onClick={() => handleAction("confirm")}
          />

          <ActionButton
            label="Suggest Alternate Cause"
            onClick={() => handleAction("alternate")}
          />

          <ActionButton
            label="Request More Data"
            onClick={() => handleAction("request-data")}
          />

          <ActionButton
            label="Escalate to Admin"
            danger
            onClick={() => handleAction("escalate")}
          />

        </div>

      </div>


      {/* ===============================
          TIMELINE
      =============================== */}

      <div className="border rounded-lg p-5 bg-white">

        <h2 className="font-semibold mb-3">Evidence Timeline</h2>

        <ul className="space-y-2 text-sm">

          {timeline.map((item, index) => (
            <li key={index} className="flex gap-3">

              <span className="text-gray-500">{item.time}</span>

              <span>{item.event}</span>

            </li>
          ))}

        </ul>

      </div>

    </div>
  );
};


/* ======================================================
   ACTION BUTTON COMPONENT
====================================================== */

const ActionButton = ({ label, danger, onClick }) => (

  <button
    onClick={onClick}
    className={`border rounded px-4 py-2 text-sm font-medium ${
      danger
        ? "border-red-500 text-red-600 hover:bg-red-50"
        : "border-blue-500 text-blue-600 hover:bg-blue-50"
    }`}
  >
    {label}
  </button>

);

export default SystemDiagnosis;
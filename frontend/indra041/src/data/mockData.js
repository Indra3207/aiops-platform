// src/data/mockData.js

export const SYSTEMS = [
  {
    id: "SYS-8472", owner: "Manufacturing / Line B", department: "Manufacturing",
    healthScore: 42, status: "critical", severity: "Critical",
    primaryRootCause: "Disk I/O Saturation", assignedTechnician: "Priya Sharma",
    agentStatus: "running", lastSeen: "2 minutes ago", slaHours: 0.75
  },
  {
    id: "SYS-9031", owner: "Data Center / Rack 7", department: "Data Center",
    healthScore: 68, status: "warning", severity: "High",
    primaryRootCause: "Service Crash", assignedTechnician: "Alex Chen",
    agentStatus: "running", lastSeen: "5 minutes ago", slaHours: 3
  },
  {
    id: "SYS-3344", owner: "Support Floor", department: "Support",
    healthScore: 38, status: "critical", severity: "Critical",
    primaryRootCause: "Network Packet Loss", assignedTechnician: "Unassigned",
    agentStatus: "running", lastSeen: "1 minute ago", slaHours: -0.5
  },
  {
    id: "SYS-7720", owner: "R&D / Lab", department: "R&D",
    healthScore: 85, status: "healthy", severity: "Low",
    primaryRootCause: "None", assignedTechnician: "Sam Patel",
    agentStatus: "running", lastSeen: "3 minutes ago", slaHours: 18
  },
];

export const ASSIGNMENTS = SYSTEMS.slice(0, 3).map(s => ({
  id: s.id, owner: s.owner, severity: s.severity,
  aiRootCause: s.primaryRootCause, confidence: [94, 78, 91, 85][SYSTEMS.indexOf(s)] || 80,
  slaHours: s.slaHours, healthScore: s.healthScore,
  status: s.slaHours < 0 ? "overdue" : s.healthScore < 50 ? "pending" : "in-progress",
  assignedDate: "2026-01-12", category: s.primaryRootCause.includes("Disk") ? "Hardware" : s.primaryRootCause.includes("Network") ? "Network" : "Software"
}));

export const ACTIVITY = [
  { id: 1, action: "Investigation started", system: "SYS-9031", time: "15m ago", actor: "Alex Chen" },
  { id: 2, action: "Evidence uploaded", system: "SYS-8472", time: "45m ago", actor: "Priya Sharma" },
  { id: 3, action: "New assignment", system: "SYS-3344", time: "2h ago", actor: "System" },
];

export const AI_GUIDANCE = [
  { id: 1, system: "SYS-8472", summary: "Disk SMART warnings — imminent failure likely within 12hrs", confidence: 94, severity: "Critical" },
  { id: 2, system: "SYS-3344", summary: "Network packet loss traced to switch port 14", confidence: 91, severity: "Critical" },
];

export const DUMMY_REQUESTS = [
  {
    id: "REQ-2026-001", systemId: "SYS-8472", owner: "Manufacturing / Line B",
    requestedBy: "tech.alex", aiVerdict: "approve", rootCause: "Hardware",
    confidence: 94, estimatedCost: 4200, riskIfDelayed: "High", status: "pending"
  },
  {
    id: "REQ-2026-002", systemId: "SYS-9031", owner: "Data Center / Rack 7",
    requestedBy: "ops.maya", aiVerdict: "reject", rootCause: "Software",
    confidence: 78, estimatedCost: 1600, riskIfDelayed: "Medium", status: "pending"
  },
  {
    id: "REQ-2026-003", systemId: "SYS-7720", owner: "R&D / Lab",
    requestedBy: "eng.sam", aiVerdict: "approve", rootCause: "Hardware",
    confidence: 85, estimatedCost: 1200, riskIfDelayed: "Low", status: "approved"
  },
];

export const REPORT_DATA = {
  kpis: {
    totalCostSaved: 148000, replacementsPrevented: 312,
    downtimeAvoidedHours: 1840, falseClaimsDetected: 96,
    avgLifespanExtensionYears: 1.8
  },
  costComparison: { blindReplacementCost: 420000, aiOptimizedCost: 272000 },
  costByRootCause: [
    { label: "Hardware", value: 58 },
    { label: "Software", value: 27 },
    { label: "Security", value: 15 }
  ],
  decisionEffectiveness: { approved: 412, rejected: 288, deferred: 94, accuracy: 92 },
  departmentCosts: [
    { department: "Manufacturing", systems: 120, requests: 84, costIncurred: 94000, costSaved: 62000 },
    { department: "Finance", systems: 64, requests: 32, costIncurred: 38000, costSaved: 29000 },
    { department: "R&D", systems: 98, requests: 54, costIncurred: 56000, costSaved: 41000 }
  ],
  lifecycle: { beforeAI: 3.4, afterAI: 5.2, forecastSavings: 210000 }
};

export const DUMMY_INVESTIGATIONS = [
  {
    caseId: "CASE-2026-0001", systemId: "SYS-8472", technician: "Priya Sharma",
    initialAIVerdict: { label: "Disk Saturation", confidence: 0.94 },
    finalTechnicianVerdict: "Confirmed — Disk I/O Failure", evidenceCount: 3,
    status: "Closed", severity: "Critical", lastUpdated: "2026-01-16T14:32:00Z",
    timeline: [
      { ts: "2026-01-15T10:05:00Z", actor: "AI Engine", type: "AI_VERDICT", note: "Disk utilisation at 98.7% — saturation detected" },
      { ts: "2026-01-15T11:20:00Z", actor: "Priya Sharma", type: "EVIDENCE_UPLOADED", note: "disk_smart_report.txt uploaded" },
      { ts: "2026-01-16T14:32:00Z", actor: "Priya Sharma", type: "CASE_CLOSED", note: "Replacement approved and scheduled" }
    ],
    evidence: [
      { filename: "disk_smart_report.txt", type: "log", uploadedBy: "Priya Sharma", ts: "2026-01-15T11:20:00Z", retained: true }
    ],
    compliance: { evidenceRetained: true, notesPresent: true, aiConfidenceLogged: true, adminNotified: true }
  },
  {
    caseId: "CASE-2026-0002", systemId: "SYS-9031", technician: "Alex Chen",
    initialAIVerdict: { label: "Service Crash", confidence: 0.78 },
    finalTechnicianVerdict: "In Progress", evidenceCount: 1,
    status: "Open", severity: "High", lastUpdated: "2026-01-17T09:10:00Z",
    timeline: [
      { ts: "2026-01-17T08:00:00Z", actor: "AI Engine", type: "AI_VERDICT", note: "Authentication service crash loop detected" },
      { ts: "2026-01-17T09:10:00Z", actor: "Alex Chen", type: "INVESTIGATION_STARTED", note: "Reviewing service logs" }
    ],
    evidence: [],
    compliance: { evidenceRetained: false, notesPresent: true, aiConfidenceLogged: true, adminNotified: false }
  },
];

export const SYSTEM_DIAGNOSIS = {
  systemInfo: {
    systemId: "SYS-8472", hostname: "MFG-LINE-B-WS01",
    owner: "Manufacturing / Line B", assignedTechnician: "Priya Sharma",
    os: "Windows 11 Pro", lastSeen: "2 minutes ago", agentVersion: "1.0.0"
  },
  aiDiagnosis: {
    rootCause: "Disk saturation due to critical utilization",
    confidence: 0.9, severity: "CRITICAL", priority: 1,
    stage: "critical", predictedWindow: "Within 12 hours",
    technicalExplanation: "Disk utilization at 98.7% with MemCompression process consuming 50.1% CPU share. Fill rate indicates full saturation within 12 hours. Memory pressure at 94.6% compounding the issue — Windows is aggressively paging to a nearly-full disk, creating a feedback loop.",
    resolutions: [
      "Immediately free disk space — clear temp files, logs, and pagefile",
      "Identify and terminate or throttle MemCompression pressure sources",
      "Run SMART diagnostics to rule out physical disk failure",
      "Consider emergency disk expansion or data offload",
      "Monitor memory usage — potential leak in background service"
    ]
  },
  signals: [
    { name: "Disk Utilization", value: "98.7%", status: "critical", trend: "increasing" },
    { name: "Memory Pressure", value: "94.6%", status: "critical", trend: "stable" },
    { name: "CPU Usage", value: "53.9%", status: "warning", trend: "stable" },
    { name: "Dominant Process", value: "MemCompression (50.1%)", status: "warning", trend: "stable" },
    { name: "Disk Fill Rate", value: "12.4 MB/s", status: "critical", trend: "increasing" },
    { name: "Time to Full", value: "~11.2 hours", status: "critical", trend: "increasing" },
  ],
  timeline: [
    { time: "2026-05-02 20:00", event: "Disk utilization crossed 90% threshold" },
    { time: "2026-05-02 21:30", event: "Memory pressure alert triggered" },
    { time: "2026-05-02 22:50", event: "AI diagnosis completed — CRITICAL severity assigned" },
    { time: "2026-05-02 23:05", event: "Assigned to Priya Sharma" },
  ]
};

export const USER_SYSTEM = {
  systemId: "SYS-8472", systemName: "Manufacturing Line B Workstation",
  overallStatus: "healthy", healthScore: 92,
  lastCheckTime: "10 minutes ago", agentStatus: "running",
  explanation: {
    what: "Your computer is running normally. All systems are operating as expected.",
    why: "No performance issues or errors have been detected in the last 24 hours.",
    hardwareFault: "No hardware problems detected. All physical components are working correctly."
  },
  statuses: {
    hardware: { state: "good", message: "Physical components are working correctly." },
    software: { state: "good", message: "Applications are stable and up to date." },
    security: { state: "good", message: "No security risks or suspicious activity detected." }
  },
  actions: [
    { id: 1, text: "No action required at this time.", icon: "✅" },
    { id: 2, text: "We'll notify you if anything needs attention.", icon: "🔔" }
  ],
  notifications: [
    { id: 1, title: "Scheduled Maintenance", message: "Routine maintenance is planned for this weekend. No action needed.", timestamp: "2 hours ago", icon: "🔧" },
    { id: 2, title: "System Update Complete", message: "Your system was updated successfully overnight.", timestamp: "1 day ago", icon: "✅" }
  ]
};

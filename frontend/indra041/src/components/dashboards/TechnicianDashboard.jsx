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

/* ==============================
   DUMMY DATA
============================== */

const ASSIGNMENTS = [
  {
    id: "SYS-8472",
    owner: "Manufacturing / Line B",
    severity: "Critical",
    aiRootCause: "Disk Failure",
    confidence: 94,
    slaMinutesRemaining: 45,
    healthScore: 42,
    status: "pending",
  },
  {
    id: "SYS-9031",
    owner: "Data Center / Rack 7",
    severity: "High",
    aiRootCause: "Service Crash",
    confidence: 78,
    slaMinutesRemaining: 180,
    healthScore: 68,
    status: "in-progress",
  },
  {
    id: "SYS-3344",
    owner: "Support Floor",
    severity: "Critical",
    aiRootCause: "Network Packet Loss",
    confidence: 91,
    slaMinutesRemaining: -30,
    healthScore: 38,
    status: "overdue",
  },
];

const ACTIVITY = [
  { id: 1, action: "Investigation started", system: "SYS-9031", time: "15m ago" },
  { id: 2, action: "Evidence uploaded", system: "SYS-8472", time: "45m ago" },
  { id: 3, action: "New assignment", system: "SYS-5566", time: "2h ago" },
];

const AI_GUIDANCE = [
  {
    id: 1,
    system: "SYS-8472",
    summary: "Disk SMART warnings detected",
    confidence: 94,
  },
  {
    id: 2,
    system: "SYS-3344",
    summary: "Network packet loss from switch",
    confidence: 91,
  },
];

/* ==============================
   UTIL
============================== */

function severityColor(sev) {
  if (sev === "Critical") return "bg-red-100 text-red-700";
  if (sev === "High") return "bg-orange-100 text-orange-700";
  return "bg-yellow-100 text-yellow-700";
}

function healthColor(score) {
  if (score >= 70) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

/* ==============================
   COMPONENT
============================== */

export default function TechnicianDashboard() {
  const [assignments] = useState(ASSIGNMENTS);

  const metrics = useMemo(() => {
    const critical = assignments.filter(a => a.severity === "Critical").length;
    const overdue = assignments.filter(a => a.slaMinutesRemaining < 0).length;
    const inProgress = assignments.filter(a => a.status === "in-progress").length;

    return {
      critical,
      overdue,
      inProgress,
      total: assignments.length,
    };
  }, [assignments]);

  return (
    <div className="p-6 space-y-8">

      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Technician Dashboard
        </h1>
        <p className="text-sm text-gray-600">
          Assigned investigations and system monitoring
        </p>
      </div>

      {/* KPI CARDS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <MetricCard
          icon={<Cpu size={20} />}
          title="Assigned Systems"
          value={metrics.total}
        />

        <MetricCard
          icon={<AlertTriangle size={20} />}
          title="Critical Alerts"
          value={metrics.critical}
        />

        <MetricCard
          icon={<Clock size={20} />}
          title="SLA Breaches"
          value={metrics.overdue}
        />

        <MetricCard
          icon={<CheckCircle size={20} />}
          title="In Progress"
          value={metrics.inProgress}
        />

      </div>

      {/* MAIN GRID */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* LEFT */}

        <div className="xl:col-span-2 space-y-6">

          {/* AI GUIDANCE */}

          <div className="bg-white border rounded-lg p-5">

            <div className="flex items-center gap-2 mb-4">
              <Brain size={20} />
              <h2 className="font-semibold text-gray-900">
                AI Investigation Guidance
              </h2>
            </div>

            <div className="space-y-3">

              {AI_GUIDANCE.map(item => (

                <div
                  key={item.id}
                  className="border rounded-lg p-3 flex justify-between items-center"
                >

                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {item.system}
                    </p>

                    <p className="text-xs text-gray-600">
                      {item.summary}
                    </p>
                  </div>

                  <div className="text-right text-sm font-semibold">
                    {item.confidence}%
                  </div>

                </div>

              ))}

            </div>

          </div>

          {/* PRIORITY QUEUE */}

          <div className="bg-white border rounded-lg p-5">

            <h2 className="font-semibold text-gray-900 mb-4">
              Priority Investigation Queue
            </h2>

            <div className="overflow-x-auto">

              <table className="min-w-full text-sm">

                <thead className="text-gray-600 border-b">
                  <tr>
                    <th className="text-left py-2">System</th>
                    <th className="text-left py-2">Severity</th>
                    <th className="text-left py-2">Root Cause</th>
                    <th className="text-left py-2">Health</th>
                    <th className="text-left py-2">Action</th>
                  </tr>
                </thead>

                <tbody>

                  {assignments.map(sys => (

                    <tr key={sys.id} className="border-b">

                      <td className="py-3">

                        <div>
                          <p className="font-semibold">{sys.id}</p>
                          <p className="text-xs text-gray-500">{sys.owner}</p>
                        </div>

                      </td>

                      <td>

                        <span
                          className={`px-2 py-1 text-xs rounded ${severityColor(
                            sys.severity
                          )}`}
                        >
                          {sys.severity}
                        </span>

                      </td>

                      <td className="text-gray-700">
                        {sys.aiRootCause}
                      </td>

                      <td>

                        <div className="flex items-center gap-2">

                          <div className="w-24 bg-gray-200 rounded-full h-2">

                            <div
                              className={`h-2 rounded-full ${healthColor(
                                sys.healthScore
                              )}`}
                              style={{ width: `${sys.healthScore}%` }}
                            />

                          </div>

                          <span className="text-xs">
                            {sys.healthScore}
                          </span>

                        </div>

                      </td>

                      <td>

                        <button className="flex items-center gap-1 text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">
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

        <div className="bg-white border rounded-lg p-5 h-fit">

          <h2 className="font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>

          <div className="space-y-4">

            {ACTIVITY.map(item => (

              <div key={item.id} className="flex gap-3">

                <Activity size={18} className="text-blue-500 mt-1" />

                <div>

                  <p className="text-sm font-medium">
                    {item.action}
                  </p>

                  <p className="text-xs text-gray-500">
                    {item.system} • {item.time}
                  </p>

                </div>

              </div>

            ))}

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
    <div className="bg-white border rounded-lg p-4 flex items-center justify-between">

      <div>
        <p className="text-xs text-gray-500">{title}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>

      <div className="p-2 bg-gray-100 rounded">
        {icon}
      </div>

    </div>
  );
}
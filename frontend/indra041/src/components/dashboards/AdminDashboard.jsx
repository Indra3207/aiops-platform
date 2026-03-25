import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import {
  Monitor,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  ClipboardList
} from "lucide-react";

/* ================================
   KPI DATA
================================ */

const dummyKPIData = {
  totalSystems: { value: 847, delta: 12, trend: "up", deltaPercent: 1.4 },
  healthySystems: { value: 623, delta: 8, trend: "up", deltaPercent: 1.3 },
  warningSystems: { value: 189, delta: 15, trend: "up", deltaPercent: 8.6 },
  criticalSystems: { value: 35, delta: -3, trend: "down", deltaPercent: 7.9 },
  pendingApprovals: { value: 12, delta: 2, trend: "up", deltaPercent: 20.0 }
};

const dummyRiskDistribution = [
  { name: "Healthy", value: 623, color: "#10b981", percentage: 73.6 },
  { name: "Warning", value: 189, color: "#f59e0b", percentage: 22.3 },
  { name: "Critical", value: 35, color: "#ef4444", percentage: 4.1 }
];

const dummyHealthTrend = [
  { date: "Jan 12", score: 87.2 },
  { date: "Jan 13", score: 86.8 },
  { date: "Jan 14", score: 85.5 },
  { date: "Jan 15", score: 84.9 },
  { date: "Jan 16", score: 86.1 },
  { date: "Jan 17", score: 87.3 },
  { date: "Jan 18", score: 88.1 },
  { date: "Jan 19", score: 87.9 }
];

const dummyAIInsights = [
  {
    id: 1,
    type: "prediction",
    severity: "high",
    message:
      "5 systems predicted to fail within 14 days based on degradation patterns"
  },
  {
    id: 2,
    type: "analysis",
    severity: "medium",
    message:
      "Hardware issues account for 62% of critical alerts (disk I/O & memory pressure)"
  },
  {
    id: 3,
    type: "trend",
    severity: "medium",
    message:
      "Security-related performance anomalies increased by 12% over last 30 days"
  },
  {
    id: 4,
    type: "improvement",
    severity: "positive",
    message:
      "Average MTTR improved by 18% this week compared to previous month"
  }
];

/* ================================
   ADMIN DASHBOARD
================================ */

function AdminDashboard() {
  const [selectedTimeRange] = useState("7d");

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard Overview
        </h1>
        <p className="text-sm text-gray-600">
          AI-powered maintenance intelligence and system monitoring
        </p>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">

        <KPICard
          title="Total Systems"
          value={dummyKPIData.totalSystems.value}
          delta={dummyKPIData.totalSystems.delta}
          trend={dummyKPIData.totalSystems.trend}
          deltaPercent={dummyKPIData.totalSystems.deltaPercent}
          icon={Monitor}
        />

        <KPICard
          title="Healthy Systems"
          value={dummyKPIData.healthySystems.value}
          delta={dummyKPIData.healthySystems.delta}
          trend={dummyKPIData.healthySystems.trend}
          deltaPercent={dummyKPIData.healthySystems.deltaPercent}
          icon={CheckCircle}
        />

        <KPICard
          title="Warning Systems"
          value={dummyKPIData.warningSystems.value}
          delta={dummyKPIData.warningSystems.delta}
          trend={dummyKPIData.warningSystems.trend}
          deltaPercent={dummyKPIData.warningSystems.deltaPercent}
          icon={AlertTriangle}
        />

        <KPICard
          title="Critical Systems"
          value={dummyKPIData.criticalSystems.value}
          delta={dummyKPIData.criticalSystems.delta}
          trend={dummyKPIData.criticalSystems.trend}
          deltaPercent={dummyKPIData.criticalSystems.deltaPercent}
          icon={AlertCircle}
        />

        <KPICard
          title="Pending Approvals"
          value={dummyKPIData.pendingApprovals.value}
          delta={dummyKPIData.pendingApprovals.delta}
          trend={dummyKPIData.pendingApprovals.trend}
          deltaPercent={dummyKPIData.pendingApprovals.deltaPercent}
          icon={ClipboardList}
        />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* RISK DISTRIBUTION */}
        <div className="bg-white rounded-xl border shadow-sm p-6">

          <h3 className="text-lg font-semibold mb-4">
            Risk Distribution
          </h3>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dummyRiskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  dataKey="value"
                >
                  {dummyRiskDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* HEALTH TREND */}
        <div className="bg-white rounded-xl border shadow-sm p-6">

          <h3 className="text-lg font-semibold mb-4">
            Health Score Trend
          </h3>

          <div className="h-72">

            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dummyHealthTrend}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="date" />

                <YAxis domain={[80, 90]} />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={3}
                />

              </LineChart>
            </ResponsiveContainer>

          </div>

        </div>

      </div>

      {/* AI INSIGHTS */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">

        <h3 className="text-lg font-semibold mb-4">
          AI Operational Insights
        </h3>

        <div className="grid md:grid-cols-2 gap-4">

          {dummyAIInsights.map((insight) => (

            <div
              key={insight.id}
              className="bg-white border rounded-lg p-4 shadow-sm"
            >

              <p className="text-sm text-gray-800">
                {insight.message}
              </p>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}

/* ================================
   KPI CARD
================================ */

function KPICard({
  title,
  value,
  delta,
  trend,
  deltaPercent,
  icon: Icon
}) {

  return (
    <div className="bg-white border rounded-xl shadow-sm p-5 hover:shadow-md transition">

      <div className="flex items-center justify-between mb-3">

        <div>

          <p className="text-sm text-gray-500">{title}</p>

          <p className="text-2xl font-bold">
            {value.toLocaleString()}
          </p>

        </div>

        <Icon size={26} className="text-blue-600" />

      </div>

      <div className="flex items-center gap-2 text-sm">

        <span
          className={`font-semibold ${
            trend === "up"
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {trend === "up" ? "↑" : "↓"} {Math.abs(delta)}
        </span>

        <span className="text-gray-500">
          {deltaPercent}% vs last period
        </span>

      </div>

    </div>
  );
}

export default AdminDashboard;
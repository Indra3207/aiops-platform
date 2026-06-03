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
  ClipboardList,
  Loader2
} from "lucide-react";

import { useSystemData } from "../../context/SystemDataContext";

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



/* ================================
   ADMIN DASHBOARD
================================ */

function AdminDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const { getAllSystems, isUsingMockData } = useSystemData();
  const systems = getAllSystems();

  // Calculate live KPIs
  const healthyCount = systems.filter(s => s.status === "healthy").length;
  const warningCount = systems.filter(s => s.status === "warning").length;
  const criticalCount = systems.filter(s => s.status === "critical").length;

  const liveKPIData = {
    totalSystems: { value: systems.length, delta: 0, trend: "up", deltaPercent: 0 },
    healthySystems: { value: healthyCount, delta: 0, trend: "up", deltaPercent: 0 },
    warningSystems: { value: warningCount, delta: 0, trend: "up", deltaPercent: 0 },
    criticalSystems: { value: criticalCount, delta: 0, trend: "down", deltaPercent: 0 },
    pendingApprovals: { value: criticalCount > 0 ? 1 : 0, delta: 0, trend: "up", deltaPercent: 0 }
  };

  const riskDistribution = [
    { name: "Healthy", value: healthyCount, color: "#10b981", percentage: Math.round((healthyCount/systems.length)*100) || 0 },
    { name: "Warning", value: warningCount, color: "#f59e0b", percentage: Math.round((warningCount/systems.length)*100) || 0 },
    { name: "Critical", value: criticalCount, color: "#ef4444", percentage: Math.round((criticalCount/systems.length)*100) || 0 }
  ];

  // Calculate dynamic health trend
  const avgHealth = systems.length > 0 
    ? Math.round(systems.reduce((acc, sys) => acc + (sys.healthScore || 100), 0) / systems.length)
    : 100;
    
  const healthTrend = isUsingMockData ? [
    { date: "Jan 12", score: 87.2 }, { date: "Jan 13", score: 86.8 }, { date: "Jan 14", score: 85.5 },
    { date: "Jan 15", score: 84.9 }, { date: "Jan 16", score: 86.1 }, { date: "Jan 17", score: 87.3 },
    { date: "Jan 18", score: 88.1 }, { date: "Jan 19", score: 87.9 }
  ] : [
    { date: "1h ago", score: avgHealth + 2 },
    { date: "45m ago", score: avgHealth + 1 },
    { date: "30m ago", score: avgHealth },
    { date: "15m ago", score: avgHealth - 1 },
    { date: "Now", score: avgHealth }
  ];

  // Extract AI insights from live systems
  const aiInsights = systems
    .filter(s => s.status !== "healthy" && s.liveData?.explanations?.admin_assessments?.hardware)
    .map(s => ({
       id: s.id,
       system: s.id,
       summary: `${s.liveData.explanations.admin_assessments.hardware} ${s.liveData.explanations.admin_assessments.software}`
    }))
    .slice(0, 4); // Show top 4

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-600">
            AI-powered maintenance intelligence and system monitoring
          </p>
        </div>
        {!isUsingMockData && (
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 shadow-sm">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
             LIVE DATA
          </div>
        )}
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">

        <KPICard
          title="Total Systems"
          value={liveKPIData.totalSystems.value}
          delta={liveKPIData.totalSystems.delta}
          trend={liveKPIData.totalSystems.trend}
          deltaPercent={liveKPIData.totalSystems.deltaPercent}
          icon={Monitor}
        />

        <KPICard
          title="Healthy Systems"
          value={liveKPIData.healthySystems.value}
          delta={liveKPIData.healthySystems.delta}
          trend={liveKPIData.healthySystems.trend}
          deltaPercent={liveKPIData.healthySystems.deltaPercent}
          icon={CheckCircle}
        />

        <KPICard
          title="Warning Systems"
          value={liveKPIData.warningSystems.value}
          delta={liveKPIData.warningSystems.delta}
          trend={liveKPIData.warningSystems.trend}
          deltaPercent={liveKPIData.warningSystems.deltaPercent}
          icon={AlertTriangle}
        />

        <KPICard
          title="Critical Systems"
          value={liveKPIData.criticalSystems.value}
          delta={liveKPIData.criticalSystems.delta}
          trend={liveKPIData.criticalSystems.trend}
          deltaPercent={liveKPIData.criticalSystems.deltaPercent}
          icon={AlertCircle}
        />

        <KPICard
          title="Pending Approvals"
          value={liveKPIData.pendingApprovals.value}
          delta={liveKPIData.pendingApprovals.delta}
          trend={liveKPIData.pendingApprovals.trend}
          deltaPercent={liveKPIData.pendingApprovals.deltaPercent}
          icon={ClipboardList}
        />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* RISK DISTRIBUTION */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Risk Distribution
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" className="bg-transparent">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  dataKey="value"
                  stroke="none"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* HEALTH TREND */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Health Score Trend
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" className="bg-transparent">
              <LineChart data={healthTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis domain={[80, 90]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#4f46e5', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* AI INSIGHTS */}
      <div className="bg-white border text-gray-900 border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          AI Operational Insights
        </h3>

        {aiInsights.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {aiInsights.map((insight) => (
              <div
                key={insight.id}
                className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-2">
                  <span className="flex-shrink-0 bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded flex items-center">
                    AI
                  </span>
                  <span className="text-sm font-medium text-gray-900">System {insight.system}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {insight.summary}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
             {!isUsingMockData && systems.some(s => s.status !== "healthy") ? (
               <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                  <span className="text-sm font-medium">Generating AI insights...</span>
               </div>
             ) : (
               <div className="text-center">
                 <CheckCircle className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                 <span className="text-sm font-medium">All systems healthy. No critical insights generated.</span>
               </div>
             )}
          </div>
        )}
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow duration-150">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-gray-700">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {value.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-50 text-indigo-600 p-2 rounded-lg">
          <Icon size={24} />
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span
          className={`font-medium flex items-center gap-0.5 ${
            trend === "up" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {trend === "up" ? (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
          ) : (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
          )} 
          {Math.abs(delta)}
        </span>
        <span className="text-gray-500">
          {deltaPercent}% vs last period
        </span>
      </div>
    </div>
  );
}

export default AdminDashboard;
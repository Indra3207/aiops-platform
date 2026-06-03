import React, { useState } from "react";
import { REPORT_DATA } from "../../data/mockData";
import { useSystemData } from "../../context/SystemDataContext";

/* ==============================
   REUSABLE COMPONENTS
============================== */

const currency = (v) =>
  v.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

export default function Reports() {
  const [range, setRange] = useState("Quarterly");
  const [exporting, setExporting] = useState(null);
  
  const handleExport = (type) => {
    setExporting(type);
    setTimeout(() => {
      setExporting(null);
      alert(`${type} export complete!`);
    }, 1500);
  };

  const { getAllSystems, isUsingMockData } = useSystemData();
  const systems = getAllSystems();

  // If using live data, derive metrics from live systems length, otherwise use mock.
  const kpis = isUsingMockData ? REPORT_DATA.kpis : {
    totalCostSaved: systems.length * 1500 + 400,
    replacementsPrevented: Math.floor(systems.length / 2),
    downtimeAvoidedHours: systems.length * 4.5,
    falseClaimsDetected: 0,
    avgLifespanExtensionYears: 1.2
  };

  const costComparison = isUsingMockData ? REPORT_DATA.costComparison : {
    blindReplacementCost: systems.length * 2000,
    aiOptimizedCost: systems.length * 500,
  };

  const costByRootCause = isUsingMockData ? REPORT_DATA.costByRootCause : [
    { label: "Hardware Degradation", value: 4000 },
    { label: "User Error", value: 1200 },
    { label: "Software Conflict", value: 600 }
  ];

  const decisionEffectiveness = isUsingMockData ? REPORT_DATA.decisionEffectiveness : {
    approved: systems.filter(s => s.status === 'critical').length,
    rejected: 0,
    deferred: systems.filter(s => s.status === 'warning').length,
    accuracy: 94
  };

  const departmentCosts = isUsingMockData ? REPORT_DATA.departmentCosts : [
    { department: "Engineering", systems: systems.length, requests: 1, costIncurred: 500, costSaved: 1500 },
  ];

  const lifecycle = REPORT_DATA.lifecycle;

  const efficiency = Math.round(
    (1 - costComparison.aiOptimizedCost / (costComparison.blindReplacementCost || 1)) * 100
  );

  const maxCost = Math.max(
    costComparison.blindReplacementCost,
    costComparison.aiOptimizedCost
  );

  return (
    <div className="space-y-8 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Reports & Cost Analysis
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Financial impact of AI-driven maintenance decisions
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option>Monthly</option>
            <option>Quarterly</option>
            <option>Yearly</option>
          </select>
          <button 
             onClick={() => handleExport("PDF")}
             className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-indigo-700 transition-colors">
              {exporting === "PDF" ? "Exporting..." : "Export Report"}
            </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Total Cost Saved" value={currency(kpis.totalCostSaved)} highlight />
        <KpiCard label="Replacements Prevented" value={kpis.replacementsPrevented} />
        <KpiCard label="Downtime Avoided" value={`${kpis.downtimeAvoidedHours} hrs`} />
        <KpiCard label="False Claims Detected" value={kpis.falseClaimsDetected} />
        <KpiCard label="Avg Lifespan Ext" value={`+${kpis.avgLifespanExtensionYears} yrs`} />
        <KpiCard label="Cost Efficiency" value={`${efficiency}%`} highlight />
      </div>

      {/* COST COMPARISON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-6">
            Replace vs Repair Cost Comparison
          </h3>
          <Bar
            label="Blind Replacement"
            value={costComparison.blindReplacementCost}
            max={maxCost}
            color="bg-gray-300"
          />
          <Bar
            label="AI Optimized Decisions"
            value={costComparison.aiOptimizedCost}
            max={maxCost}
            color="bg-emerald-500"
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-6">
            Cost by Root Cause
          </h3>
          <div className="space-y-5">
            {costByRootCause.map((c) => (
              <Bar
                key={c.label}
                label={c.label}
                value={c.value}
                max={100}
                color="bg-indigo-500"
                percent
              />
            ))}
          </div>
        </div>
      </div>

      {/* DECISION & LIFECYCLE ROW */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-5">
            Decision Effectiveness
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Metric label="Approved" value={decisionEffectiveness.approved} />
            <Metric label="Rejected" value={decisionEffectiveness.rejected} />
            <Metric label="Deferred" value={decisionEffectiveness.deferred} />
            <Metric label="Accuracy" value={`${decisionEffectiveness.accuracy}%`} highlight />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-5">
            Hardware Lifecycle Optimization
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Metric label="Before AI" value={`${lifecycle.beforeAI} yrs`} />
            <Metric label="Current Lifespan" value={`${lifecycle.afterAI} yrs`} highlight />
            <Metric label="Forecast Savings" value={currency(lifecycle.forecastSavings)} />
          </div>
        </div>
      </div>

      {/* DEPARTMENT TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 leading-none">
          <h3 className="text-base font-semibold text-gray-900">
            Department Cost Attribution
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
              <tr>
                <th className="text-left py-3 px-6 whitespace-nowrap">Department</th>
                <th className="text-right py-3 px-6 whitespace-nowrap">Systems</th>
                <th className="text-right py-3 px-6 whitespace-nowrap">Requests</th>
                <th className="text-right py-3 px-6 whitespace-nowrap">Cost Incurred</th>
                <th className="text-right py-3 px-6 whitespace-nowrap">Cost Saved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {departmentCosts.map((d) => (
                <tr key={d.department} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-6 text-gray-900 font-medium">{d.department}</td>
                  <td className="py-3 px-6 text-right text-gray-600">{d.systems}</td>
                  <td className="py-3 px-6 text-right text-gray-600">{d.requests}</td>
                  <td className="py-3 px-6 text-right text-gray-900">{currency(d.costIncurred)}</td>
                  <td className="py-3 px-6 text-right text-emerald-600 font-medium">
                    {currency(d.costSaved)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EXPORT */}
      <div className="flex flex-wrap gap-3 mt-4">
        <button 
            onClick={() => handleExport("Executive PDF")}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-indigo-700 transition-colors">
            {exporting === "Executive PDF" ? "Generating..." : "Download Executive PDF"}
          </button>
        <button 
            onClick={() => handleExport("CSV")}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors">
            {exporting === "CSV" ? "Processing..." : "Export CSV"}
          </button>
        <button 
            onClick={() => handleExport("Schedule")}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors">
            {exporting === "Schedule" ? "Saved ✓" : "Schedule Monthly Report"}
          </button>
      </div>
    </div>
  );
}

/* COMPONENTS */
const KpiCard = ({ label, value, highlight }) => (
  <div className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm ${highlight ? 'ring-1 ring-indigo-500/10 bg-indigo-50/10' : ''}`}>
    <div className="text-xs font-medium text-gray-500 mb-2">{label}</div>
    <div className={`text-2xl font-bold ${highlight ? 'text-indigo-600' : 'text-gray-900'}`}>{value}</div>
  </div>
);

const Metric = ({ label, value, highlight }) => (
  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
    <div className="text-sm text-gray-500 mb-1">{label}</div>
    <div className={`text-lg font-semibold ${highlight ? 'text-indigo-600' : 'text-gray-900'}`}>{value}</div>
  </div>
);

const Bar = ({ label, value, max, color, percent }) => (
  <div className="mb-5 last:mb-0">
    <div className="flex justify-between text-sm mb-2 font-medium">
      <span className="text-gray-700">{label}</span>
      <span className="text-gray-900">{percent ? `${value}%` : currency(value)}</span>
    </div>
    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  </div>
);
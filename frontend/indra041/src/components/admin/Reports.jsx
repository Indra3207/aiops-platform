import React, { useState } from "react";

const REPORT_DATA = {
  kpis: {
    totalCostSaved: 148000,
    replacementsPrevented: 312,
    downtimeAvoidedHours: 1840,
    falseClaimsDetected: 96,
    avgLifespanExtensionYears: 1.8,
  },

  costComparison: {
    blindReplacementCost: 420000,
    aiOptimizedCost: 272000,
  },

  costByRootCause: [
    { label: "Hardware", value: 58 },
    { label: "Software", value: 27 },
    { label: "Security", value: 15 },
  ],

  decisionEffectiveness: {
    approved: 412,
    rejected: 288,
    deferred: 94,
    accuracy: 92,
  },

  departmentCosts: [
    {
      department: "Manufacturing",
      systems: 120,
      requests: 84,
      costIncurred: 94000,
      costSaved: 62000,
    },
    {
      department: "Finance",
      systems: 64,
      requests: 32,
      costIncurred: 38000,
      costSaved: 29000,
    },
    {
      department: "R&D",
      systems: 98,
      requests: 54,
      costIncurred: 56000,
      costSaved: 41000,
    },
  ],

  lifecycle: {
    beforeAI: 3.4,
    afterAI: 5.2,
    forecastSavings: 210000,
  },
};

const currency = (v) =>
  v.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

export default function Reports() {

  const [range, setRange] = useState("Quarterly");

  const {
    kpis,
    costComparison,
    costByRootCause,
    decisionEffectiveness,
    departmentCosts,
    lifecycle,
  } = REPORT_DATA;

  const efficiency = Math.round(
    (1 - costComparison.aiOptimizedCost / costComparison.blindReplacementCost) *
      100
  );

  const maxCost = Math.max(
    costComparison.blindReplacementCost,
    costComparison.aiOptimizedCost
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">

        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Reports & Cost Analysis
          </h1>

          <p className="text-sm text-slate-600">
            Financial impact of AI-driven maintenance decisions
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">

          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white text-sm"
          >
            <option>Monthly</option>
            <option>Quarterly</option>
            <option>Yearly</option>
          </select>

          <button className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm">
            Export Report
          </button>

        </div>

      </div>

      {/* KPI CARDS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">

        <KpiCard label="Total Cost Saved" value={currency(kpis.totalCostSaved)} />
        <KpiCard label="Replacements Prevented" value={kpis.replacementsPrevented} />
        <KpiCard label="Downtime Avoided" value={`${kpis.downtimeAvoidedHours} hrs`} />
        <KpiCard label="False Claims Detected" value={kpis.falseClaimsDetected} />
        <KpiCard label="Avg Lifespan Extension" value={`${kpis.avgLifespanExtensionYears} yrs`} />
        <KpiCard label="Cost Efficiency" value={`${efficiency}%`} />

      </div>

      {/* COST COMPARISON */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

        <div className="bg-white border rounded-lg p-5">

          <h3 className="text-sm font-semibold text-slate-800 mb-4">
            Replace vs Repair Cost Comparison
          </h3>

          <Bar
            label="Blind Replacement"
            value={costComparison.blindReplacementCost}
            max={maxCost}
            color="bg-red-500"
          />

          <Bar
            label="AI Optimized Decisions"
            value={costComparison.aiOptimizedCost}
            max={maxCost}
            color="bg-green-600"
          />

        </div>

        <div className="bg-white border rounded-lg p-5">

          <h3 className="text-sm font-semibold text-slate-800 mb-4">
            Cost by Root Cause
          </h3>

          <div className="space-y-4">

            {costByRootCause.map((c) => (
              <Bar
                key={c.label}
                label={c.label}
                value={c.value}
                max={100}
                color="bg-slate-700"
                percent
              />
            ))}

          </div>

        </div>

      </div>

      {/* DECISION EFFECTIVENESS */}

      <div className="bg-white border rounded-lg p-6 mb-10">

        <h3 className="text-sm font-semibold text-slate-800 mb-4">
          Decision Effectiveness
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <Metric label="Approved" value={decisionEffectiveness.approved} />
          <Metric label="Rejected" value={decisionEffectiveness.rejected} />
          <Metric label="Deferred" value={decisionEffectiveness.deferred} />
          <Metric label="Accuracy" value={`${decisionEffectiveness.accuracy}%`} />

        </div>

      </div>

      {/* DEPARTMENT TABLE */}

      <div className="bg-white border rounded-lg p-6 mb-10 overflow-x-auto">

        <h3 className="text-sm font-semibold text-slate-800 mb-4">
          Department Cost Attribution
        </h3>

        <table className="min-w-full text-sm">

          <thead className="text-gray-500 border-b">
            <tr>
              <th className="text-left py-2">Department</th>
              <th className="text-right">Systems</th>
              <th className="text-right">Requests</th>
              <th className="text-right">Cost Incurred</th>
              <th className="text-right">Cost Saved</th>
            </tr>
          </thead>

          <tbody>

            {departmentCosts.map((d) => (

              <tr key={d.department} className="border-b">

                <td className="py-2">{d.department}</td>
                <td className="text-right">{d.systems}</td>
                <td className="text-right">{d.requests}</td>
                <td className="text-right">{currency(d.costIncurred)}</td>
                <td className="text-right text-green-700">
                  {currency(d.costSaved)}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* HARDWARE LIFECYCLE */}

      <div className="bg-white border rounded-lg p-6 mb-10">

        <h3 className="text-sm font-semibold text-slate-800 mb-4">
          Hardware Lifecycle Optimization
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <Metric label="Before AI" value={`${lifecycle.beforeAI} yrs`} />
          <Metric label="Current Lifespan" value={`${lifecycle.afterAI} yrs`} />
          <Metric label="Forecast Savings" value={currency(lifecycle.forecastSavings)} />

        </div>

      </div>

      {/* EXPORT */}

      <div className="flex flex-wrap gap-3">

        <button className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm">
          Download Executive PDF
        </button>

        <button className="px-4 py-2 border rounded-md text-sm">
          Export CSV
        </button>

        <button className="px-4 py-2 border rounded-md text-sm">
          Schedule Monthly Report
        </button>

      </div>

    </div>
  );
}

/* COMPONENTS */

const KpiCard = ({ label, value }) => (
  <div className="bg-white border rounded-lg p-4">
    <div className="text-xs text-slate-500">{label}</div>
    <div className="text-xl font-semibold mt-1">{value}</div>
  </div>
);

const Metric = ({ label, value }) => (
  <div className="bg-gray-50 rounded-md p-3 text-sm">
    <div className="text-slate-500">{label}</div>
    <div className="font-semibold mt-1">{value}</div>
  </div>
);

const Bar = ({ label, value, max, color, percent }) => (
  <div className="mb-4">

    <div className="flex justify-between text-sm mb-1">
      <span>{label}</span>
      <span>{percent ? `${value}%` : currency(value)}</span>
    </div>

    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">

      <div
        className={`h-3 ${color}`}
        style={{ width: `${(value / max) * 100}%` }}
      />

    </div>

  </div>
);
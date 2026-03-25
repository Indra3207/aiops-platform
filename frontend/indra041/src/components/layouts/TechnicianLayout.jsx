import { useState } from "react";
import {
  LayoutDashboard,
  Laptop,
  ClipboardList,
  Camera,
  FileText,
  LogOut
} from "lucide-react";

import TechnicianDashboard from "../dashboards/TechnicianDashboard";
import AssignedSystems from "../technician/AssignedSystems";
import InvestigationLogs from "../technician/InvestigationLogs";

export default function TechnicianLayout({ onLogout }) {

  const [activeNav, setActiveNav] = useState("dashboard");
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const pendingCounts = {
    dashboard: 0,
    assigned: 8,
    logs: 2
  };

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: pendingCounts.dashboard
    },
    {
      id: "assigned",
      label: "Assigned Systems",
      icon: Laptop,
      badge: pendingCounts.assigned
    },
    {
      id: "logs",
      label: "Investigation Logs",
      icon: ClipboardList,
      badge: pendingCounts.logs
    }
  ];

  const renderContent = () => {
    switch (activeNav) {
      case "dashboard":
        return <TechnicianDashboard />;
      case "assigned":
        return <AssignedSystems />;
      case "logs":
        return <InvestigationLogs />;
      default:
        return <TechnicianDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col">

        {/* Logo */}

        <div className="h-16 flex items-center px-6 border-b border-gray-700">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold">
              M
            </div>

            <div>
              <p className="font-semibold">
                MaintenanceAI
              </p>
              <p className="text-xs text-gray-400">
                Technician Portal
              </p>
            </div>

          </div>

        </div>


        {/* NAVIGATION */}

        <nav className="flex-1 p-4 space-y-2">

          {navItems.map((item) => {

            const Icon = item.icon;

            return (

              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition ${
                  activeNav === item.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
              >

                <div className="flex items-center gap-3">

                  <Icon size={18} />

                  <span>{item.label}</span>

                </div>

                {item.badge > 0 && (
                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}

              </button>

            );

          })}

        </nav>


        {/* QUICK ACTIONS */}

        <div className="p-4 border-t border-gray-700 space-y-2">

          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
            Quick Actions
          </p>

          <button
            onClick={() => setEvidenceOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg"
          >
            <Camera size={16} />
            Capture Evidence
          </button>

          <button
            className="w-full flex items-center gap-3 px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg"
          >
            <FileText size={16} />
            Submit Report
          </button>

        </div>


        {/* SIGN OUT BUTTON */}

        <div className="p-4 border-t border-gray-700">

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
          >
            <LogOut size={16} />
            Sign Out
          </button>

        </div>

      </aside>


      {/* ======================================================
          MAIN AREA
      ====================================================== */}

      <div className="flex-1 flex flex-col">

        {/* HEADER */}

        <header className="h-16 bg-white border-b flex items-center px-6">

          <h1 className="text-lg font-semibold text-gray-900">
            Technician Workspace
          </h1>

        </header>


        {/* CONTENT */}

        <main className="flex-1 overflow-y-auto p-6">

          {renderContent()}

        </main>


        {/* FOOTER */}

        <footer className="border-t bg-white px-6 py-3 text-sm text-gray-600 flex justify-between">

          <span>MaintenanceAI Technician Console</span>

          <span>Platform v1.0.0</span>

        </footer>

      </div>


      {/* ======================================================
          CAPTURE EVIDENCE MODAL
      ====================================================== */}

      {evidenceOpen && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white rounded-lg w-[480px] p-6">

            <h2 className="text-lg font-semibold mb-4">
              Capture Evidence
            </h2>

            <div className="space-y-4">

              <input
                type="file"
                className="w-full border rounded-lg p-2 text-sm"
              />

              <textarea
                rows={4}
                placeholder="Add description or notes..."
                className="w-full border rounded-lg p-3 text-sm"
              />

            </div>

            <div className="flex justify-end gap-3 mt-5">

              <button
                onClick={() => setEvidenceOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                Cancel
              </button>

              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                Upload Evidence
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}
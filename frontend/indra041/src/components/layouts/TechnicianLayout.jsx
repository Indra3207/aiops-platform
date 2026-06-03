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
import { useSystemData } from "../../context/SystemDataContext";


export default function TechnicianLayout({ userData, onLogout }) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmitReport = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Report submitted successfully.");
    }, 1000);
  };

  const handleUploadEvidence = () => {
    if (!evidenceFile) {
        alert("Please select a file first.");
        return;
    }
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setEvidenceOpen(false);
      setEvidenceFile(null);
      setEvidenceNotes("");
      alert("Evidence uploaded successfully.");
    }, 1500);
  };

  const { getAssignedSystems, getAllSystems } = useSystemData();
  
  const assignedCount = getAssignedSystems().length;
  // Investigation logs are generated for any system that's not healthy
  const logsCount = getAllSystems().filter(sys => sys.status !== "healthy").length;

  const pendingCounts = {
    dashboard: 0,
    assigned: assignedCount,
    logs: logsCount
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
        return <TechnicianDashboard navigateTo={(id) => setActiveNav(id)} />;
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
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200 gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
          <div>
            <h1 className="text-lg font-bold text-indigo-600">NexusOps</h1>
            <p className="text-xs text-gray-500">Technician Portal</p>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm rounded-lg transition-colors ${
                  activeNav === item.id
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 font-medium px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* QUICK ACTIONS */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <p className="text-xs text-gray-400 font-medium tracking-wide mb-2">
            Quick Actions
          </p>

          <button
            onClick={() => setEvidenceOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors shadow-sm"
          >
            <Camera size={16} />
            Capture Evidence
          </button>

          <button
              onClick={handleSubmitReport}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors shadow-sm"
            >
              <FileText size={16} />
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
        </div>

        {/* FOOTER & SIGN OUT */}
        <div className="p-4 border-t border-gray-200">
          <div className="mb-3 text-xs text-gray-500 truncate">
            {userData?.email}
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ================= MAIN AREA ================= */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
          <h1 className="text-lg font-semibold text-gray-900">
            Technician Workspace
          </h1>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderContent()}
        </main>

        {/* FOOTER */}
        <footer className="border-t border-gray-200 bg-white px-6 py-3 text-xs text-gray-500 flex justify-between">
          <span>© 2026 NexusOps Platform</span>
          <span>v1.0.0</span>
        </footer>
      </div>

      {/* ================= CAPTURE EVIDENCE MODAL ================= */}
      {evidenceOpen && (
        <div className="fixed inset-0 bg-gray-900/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-[480px] p-6 max-w-[90vw]">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Capture Evidence
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Upload File
                </label>
                <input
                  type="file"
                  onChange={(e) => setEvidenceFile(e.target.files[0])}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Add description or notes..."
                  value={evidenceNotes}
                  onChange={(e) => setEvidenceNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => setEvidenceOpen(false)}
                className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              <button
                  onClick={handleUploadEvidence}
                  className={`px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors ${!evidenceFile ? "opacity-60" : "hover:bg-indigo-700 shadow-sm"}`}
                >
                  {isUploading ? "Uploading..." : "Upload Evidence"}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
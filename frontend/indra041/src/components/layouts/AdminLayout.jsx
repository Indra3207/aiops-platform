import { useState } from "react";
import UserManagement from "../admin/UserManagement";
import SystemDetail from "../admin/SystemDetail";
import AdminDashboard from "../dashboards/AdminDashboard";
import SystemsOverview from "../admin/SystemsOverview";
import Decisions from "../admin/Decisions";
import Reports from "../admin/Reports";
import {
  LayoutDashboard,
  Monitor,
  ClipboardList,
  BarChart3,
  Users
} from "lucide-react";


function AdminLayout({ userData, onLogout }) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState("global");
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSystem, setSelectedSystem] = useState(null);

  {/* TODO: pass filters to child components when API is wired */}

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "systems", label: "Systems", icon: Monitor },
    { id: "decisions", label: "Decisions", icon: ClipboardList },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users }
  ];

  const renderContent = () => {
    switch (activeNav) {
      case "dashboard":
        return <AdminDashboard />;
      case "systems":
        return selectedSystem ? (
          <SystemDetail
            system={selectedSystem}
            goBack={() => setSelectedSystem(null)}
          />
        ) : (
          <SystemsOverview openSystem={setSelectedSystem} />
        );
      case "decisions":
        return <Decisions />;
      case "reports":
        return <Reports />;
      case "users":
        return <UserManagement />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-200 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
          <div>
            <h1 className="text-lg font-bold text-indigo-600">NexusOps</h1>
            <p className="text-xs text-gray-500">Platform Admin</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors ${
                activeNav === item.id
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            Agents Connected
          </div>
          v1.0.0
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ================= HEADER ================= */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="global">Global</option>
              <option value="na">North America</option>
              <option value="emea">EMEA</option>
            </select>

            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>

            <input
              type="text"
              placeholder="Search system ID or owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* USER MENU */}
          <div className="relative self-end md:self-auto">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-9 h-9 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white rounded-full font-medium"
            >
              {userData?.email?.[0]?.toUpperCase() || "A"}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-sm z-50 overflow-hidden">
                <div className="p-3 border-b border-gray-100 text-sm">
                  <div className="font-semibold text-gray-900 truncate">{userData?.email}</div>
                  <div className="text-xs text-gray-500 capitalize">{userData?.role}</div>
                </div>

                <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">
                    Profile
                  </button>

                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-red-600 font-medium"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ================= CONTENT ================= */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>

        {/* ================= FOOTER ================= */}
        <footer className="bg-white border-t border-gray-200 px-4 md:px-6 py-3 text-xs text-gray-500 flex flex-col md:flex-row justify-between gap-2">
          <span>© 2026 NexusOps Platform</span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            All agents operational
          </span>
        </footer>
      </div>
    </div>
  );
}

export default AdminLayout;
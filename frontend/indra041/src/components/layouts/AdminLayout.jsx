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
      <aside className="w-64 bg-gray-900 text-white flex flex-col hidden md:flex">

        <div className="p-6 border-b border-gray-800">
          <h1 className="text-lg font-bold">MaintenanceAI</h1>
          <p className="text-xs text-gray-400">Intelligence Platform</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeNav === item.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 text-xs text-gray-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Agents Connected
          </div>
          Platform v1.0.0
        </div>

      </aside>


      {/* ================= MAIN ================= */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ================= HEADER ================= */}
        <header className="bg-white border-b px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">

            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="global">Global</option>
              <option value="na">North America</option>
              <option value="emea">EMEA</option>
            </select>

            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
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
              className="border rounded px-3 py-2 text-sm w-full md:w-64"
            />

          </div>


          {/* USER MENU */}
          <div className="relative self-end md:self-auto">

            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-9 h-9 bg-blue-600 text-white rounded-full font-bold"
            >
              {userData?.email?.[0]?.toUpperCase() || "A"}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow z-50">

                <div className="p-3 border-b text-sm">
                  <div className="font-semibold">{userData?.email}</div>
                  <div className="text-xs text-gray-500 capitalize">
                    {userData?.role}
                  </div>
                </div>

                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
                  Profile
                </button>

                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
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
        <footer className="bg-white border-t px-4 md:px-6 py-3 text-sm text-gray-500 flex flex-col md:flex-row justify-between gap-2">

          <span>© 2025 Company Name</span>

          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            All agents operational
          </span>

        </footer>

      </div>

    </div>
  );
}

export default AdminLayout;
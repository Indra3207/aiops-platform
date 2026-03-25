// src/components/layouts/UserLayout.jsx
import React, { useState } from "react";
import UserDashboard from "../dashboards/UserDashboard";
import MySystemDetail from "../user/MySystemDetail";

import {
  LayoutDashboard,
  Monitor,
  MessageCircle,
  LogOut,
} from "lucide-react";

/* ================= SUPPORT PAGE ================= */

function SupportRequestPage({ user }) {
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();

    if (!message.trim()) {
      setError("Please describe the issue before submitting.");
      return;
    }

    if (message.length < 10) {
      setError("Please provide more details (at least 10 characters).");
      return;
    }

    setSubmitted(true);
  };

  const reset = () => {
    setMessage("");
    setSubmitted(false);
    setError("");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Support Request
        </h2>
        <p className="text-sm text-slate-600">
          Tell us what’s wrong and a technician will assist you.
        </p>
      </div>

      {!submitted ? (
        <div className="bg-white border rounded-lg p-6 space-y-4">
          <textarea
            rows={6}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError("");
            }}
            className="w-full border rounded-lg p-3 text-sm"
            placeholder="Describe your issue..."
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={submit}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Submit Request
            </button>

            <button
              onClick={() => setMessage("")}
              className="px-5 py-2 border rounded-lg text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border rounded-lg p-8 text-center">
          <h3 className="text-lg font-semibold">Request Submitted</h3>
          <p className="text-sm text-slate-600 mt-2">
            A technician will review your request shortly.
          </p>

          <button
            onClick={reset}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Submit Another
          </button>
        </div>
      )}
    </div>
  );
}

/* ================= USER LAYOUT ================= */

export default function UserLayout({ userData, onLogout }) {
  const [active, setActive] = useState("dashboard");

  const user = {
    firstName: userData?.email?.split("@")[0] || "User",
    avatar: userData?.email?.[0]?.toUpperCase() || "U",
  };

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "mysystem", label: "My System", icon: Monitor },
    { id: "support", label: "Support", icon: MessageCircle },
  ];

  const renderContent = () => {
    switch (active) {
      case "dashboard":
        return <UserDashboard user={user} onNavigate={setActive} />;

      case "mysystem":
        return <MySystemDetail />;

      case "support":
        return <SupportRequestPage user={user} />;

      default:
        return <UserDashboard user={user} onNavigate={setActive} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* HEADER */}

      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">
              M
            </div>

            <div className="hidden sm:block">
              <div className="font-semibold text-slate-900">
                MaintenanceAI
              </div>
              <div className="text-xs text-slate-500">
                Employee Portal
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">

            <div className="hidden md:block text-sm text-slate-600">
              Signed in as <strong>{user.firstName}</strong>
            </div>

            <div className="w-9 h-9 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
              {user.avatar}
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-sm text-red-600 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50"
            >
              <LogOut size={16} />
              Logout
            </button>

          </div>
        </div>
      </header>

      {/* NAVIGATION */}

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-3 sm:gap-6 h-12 items-center overflow-x-auto">

          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => setActive(n.id)}
              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md transition
                ${
                  active === n.id
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-slate-600 hover:bg-slate-100"
                }
              `}
            >
              <n.icon size={18} />
              <span className="whitespace-nowrap">{n.label}</span>
            </button>
          ))}

        </div>
      </nav>

      {/* MAIN CONTENT */}

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {renderContent()}
        </div>
      </main>

      {/* FOOTER */}

      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-slate-600 flex flex-col sm:flex-row justify-between gap-2">

          <span>Need help? support@company.com</span>

          <span>
            © {new Date().getFullYear()} MaintenanceAI
          </span>

        </div>
      </footer>

    </div>
  );
}
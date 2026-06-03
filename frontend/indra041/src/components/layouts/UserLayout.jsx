// src/components/layouts/UserLayout.jsx
import React, { useState } from "react";
import UserDashboard from "../dashboards/UserDashboard";
import MySystemDetail from "../user/MySystemDetail";
import { useSystemData } from "../../context/SystemDataContext";

import {
  LayoutDashboard,
  Monitor,
  MessageCircle,
  LogOut,
} from "lucide-react";

/* ================= SUPPORT PAGE ================= */

function SupportRequestPage({ user }) {
  const [email, setEmail] = useState(user?.email || "");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { requestSupport, getUserSystemDetail } = useSystemData();
  const systemHealth = getUserSystemDetail();

  const submit = (e) => {
    e.preventDefault();

    if (!email.trim() || !message.trim()) {
      setError("Please describe the issue and provide an email.");
      return;
    }

    if (message.length < 10) {
      setError("Please provide more details (at least 10 characters).");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
        setIsSubmitting(false);
        setSubmitted(true);
        if (systemHealth?.systemId) {
            requestSupport(systemHealth.systemId);
        }
    }, 1000);
  };

  const reset = () => {
    setMessage("");
    setSubmitted(false);
    setError("");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Support Request
        </h2>
        <p className="text-sm text-gray-600">
          Tell us what’s wrong and a technician will assist you.
        </p>
      </div>

      {!submitted ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Your Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Description
            </label>
            <textarea
              rows={6}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setError("");
              }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Describe your issue..."
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
               onClick={submit}
               disabled={isSubmitting}
               className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>

            <button
              onClick={reset}
              className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Request Submitted</h3>
          <p className="text-sm text-gray-600 mt-2">
            Your request has been submitted. A technician will contact you shortly.
          </p>

          <button
            onClick={reset}
            className="mt-6 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
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
    email: userData?.email,
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
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
            <div className="hidden sm:block">
              <div className="font-bold text-lg text-indigo-600 leading-tight">
                NexusOps
              </div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 leading-tight block -mt-1 hidden">
                Employee Portal
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-sm text-gray-600">
              {user.email}
            </div>

            <div className="w-8 h-8 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full flex items-center justify-center font-semibold text-sm">
              {user.avatar}
            </div>

            <button
              onClick={onLogout}
              className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* NAVIGATION */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-8 h-12 items-center overflow-x-auto">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => setActive(n.id)}
              className={`flex items-center gap-2 text-sm font-medium h-full border-b-2 transition-colors px-1
                ${
                  active === n.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
                }
              `}
            >
              <n.icon size={16} />
              <span className="whitespace-nowrap">{n.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-xs text-gray-500 flex justify-between">
          <span>Need help? support@company.com</span>
          <span>© 2026 NexusOps Platform</span>
        </div>
      </footer>
    </div>
  );
}
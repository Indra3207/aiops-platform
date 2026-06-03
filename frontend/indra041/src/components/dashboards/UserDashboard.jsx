import { useSystemData } from "../../context/SystemDataContext";

function UserDashboard({ user, onNavigate }) {
  const { getUserSystemDetail, userNotifications, requestSupport } = useSystemData();
  const systemHealth = getUserSystemDetail("SYS-1049"); // Assuming a fixed system ID for the demo user
  
  // Combine custom interactive notifications with default ones
  const defaultNotifications = [
    {
      id: 1,
      title: "System Scan Complete",
      message: "Daily health check completed successfully.",
      timestamp: "Today, 08:30 AM",
      icon: "✅"
    }
  ];
  
  const notifications = [...userNotifications, ...defaultNotifications];
  const recommendations = systemHealth.actions || [];

  const getHealthStyle = (status) => {
    switch (status) {
      case "healthy":
      case "good":
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          text: "text-emerald-700",
          iconBg: "bg-emerald-100",
          label: "Healthy",
        };
      case "warning":
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-700",
          iconBg: "bg-amber-100",
          label: "Needs Attention",
        };
      case "critical":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-700",
          iconBg: "bg-red-100",
          label: "Critical",
        };
      default:
        return {
          bg: "bg-gray-50",
          border: "border-gray-200",
          text: "text-gray-700",
          iconBg: "bg-gray-100",
          label: "Unknown",
        };
    }
  };

  const healthStyle = getHealthStyle(systemHealth.overallStatus);

  // Determine stroke color for health ring
  const getRingColor = (score) => {
    if (score >= 75) return "stroke-emerald-500";
    if (score >= 50) return "stroke-amber-500";
    return "stroke-red-500";
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-1">
          My System Dashboard
        </h1>
        <p className="text-sm text-gray-600">
          System health overview and notifications
        </p>
      </div>

      {/* SYSTEM HEALTH CARD */}
      <div
        className={`${healthStyle.bg} ${healthStyle.border} border rounded-xl p-6 shadow-sm`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            
            {/* SVG Health Ring */}
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="stroke-gray-200"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className={`${getRingColor(systemHealth.healthScore)} transition-all duration-1000 ease-out`}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(systemHealth.healthScore / 100) * 283} 283`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">
                  {systemHealth.overallStatus === "healthy" ? "100" : "75"}
                </span>
              </div>
            </div>

            <div>
              <h2 className={`text-2xl font-bold ${healthStyle.text} mb-1`}>
                {healthStyle.label}
              </h2>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-gray-700 font-medium">
                  {systemHealth.systemName}
                </p>
                <span className="text-xs text-gray-400">
                  System ID: {systemHealth.systemId}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                Last checked {systemHealth.lastCheckTime}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 text-sm">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
               <span className={`w-2 h-2 rounded-full bg-emerald-500`}></span>
               <span className="font-medium text-gray-700">Agent running</span>
            </div>
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      <div className="bg-white border text-gray-900 border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Notifications
        </h2>

        {notifications.length === 0 ? (
          <p className="text-sm text-gray-600">No notifications</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="border border-gray-100 rounded-lg p-4 flex gap-4 hover:bg-gray-50 transition-colors"
              >
                <div className="text-2xl bg-gray-50 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                  {n.icon}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-0.5">{n.title}</h3>
                  <p className="text-sm text-gray-600 mb-1">{n.message}</p>
                  <p className="text-xs text-gray-400">{n.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECOMMENDED ACTIONS */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Recommended Actions
        </h2>

        <div className="space-y-3">
          {recommendations.map((action) => (
            <div
              key={action.id}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                {action.icon}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{action.text}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* VIEW SYSTEM DETAILS */}
          <button
            onClick={() => onNavigate("mysystem")}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            <span className="text-lg">💻</span>
            View System Details
          </button>

          {/* SUPPORT */}
          <button
            onClick={() => requestSupport(systemHealth.systemId)}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            <span className="text-lg">💬</span>
            Request Support
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
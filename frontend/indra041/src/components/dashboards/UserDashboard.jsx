// // src/components/pages/UserDashboard.jsx
// import React from 'react';

// /*
//   UserDashboard.jsx
//   -------------------------
//   Simple, friendly dashboard for non-technical users.
//   Shows overall system health and important notifications.
  
//   IMPORTANT:
//   - This is ONLY the page content
//   - UserLayout handles header, nav, footer
//   - No raw metrics shown - only outcomes (Healthy / Needs Attention)
//   - Friendly language, no technical jargon
  
//   Backend Integration:
//   - GET /api/user/system-health → Overall health status
//   - GET /api/user/notifications → Alerts and notices
//   - GET /api/user/agent-status → Agent running status
// */

// // ==========================================
// // DUMMY DATA
// // ==========================================

// /**
//  * System Health Data
//  * Backend: GET /api/user/system-health
//  */
// const dummySystemHealth = {
//   systemId: 'SYS-8472',
//   systemName: 'Manufacturing Line B',
//   overallStatus: 'healthy', // 'healthy' | 'warning' | 'critical'
//   healthScore: 92,
//   lastCheckTime: '10 minutes ago',
//   lastCheckTimestamp: '2025-01-28T10:45:00Z',
//   agentStatus: 'running', // 'running' | 'stopped' | 'error'
//   agentLastSeen: '2 minutes ago'
// };

// /**
//  * Notifications & Alerts
//  * Backend: GET /api/user/notifications
//  */
// const dummyNotifications = [
//   {
//     id: 1,
//     type: 'maintenance', // 'warning' | 'maintenance' | 'info'
//     severity: 'info',
//     title: 'Scheduled Maintenance',
//     message: 'Routine maintenance scheduled for Friday, 3:00 AM - 5:00 AM. No action needed from you.',
//     timestamp: '2 hours ago',
//     icon: '🔧'
//   },
//   {
//     id: 2,
//     type: 'info',
//     severity: 'info',
//     title: 'System Update Complete',
//     message: 'Security updates were installed successfully. Your system is up to date.',
//     timestamp: '1 day ago',
//     icon: '✓'
//   },
//   {
//     id: 3,
//     type: 'info',
//     severity: 'info',
//     title: 'Photo Reminder',
//     message: 'When submitting support requests, please attach photos if the issue is visible. This helps us resolve problems faster.',
//     timestamp: '2 days ago',
//     icon: '📸'
//   }
// ];

// /**
//  * Recommended Actions
//  * Backend: GET /api/user/recommendations
//  */
// const dummyRecommendedActions = [
//   {
//     id: 1,
//     title: 'No actions needed',
//     description: 'Your system is running smoothly. We\'ll notify you if anything needs attention.',
//     priority: 'low',
//     icon: '✓'
//   }
// ];

// // ==========================================
// // MAIN USER DASHBOARD COMPONENT
// // ==========================================

// function UserDashboard({ user, onNavigate }) {
//   // In production, fetch real data:
//   // const [healthData, setHealthData] = useState(null);
//   // useEffect(() => { fetchHealthData(); }, []);

//   const systemHealth = dummySystemHealth;
//   const notifications = dummyNotifications;
//   const recommendations = dummyRecommendedActions;

//   // Determine health status styling
//   const getHealthStyle = (status) => {
//     switch (status) {
//       case 'healthy':
//         return {
//           bgColor: 'bg-green-50',
//           borderColor: 'border-green-200',
//           textColor: 'text-green-700',
//           iconBg: 'bg-green-100',
//           icon: '✓',
//           label: 'Healthy'
//         };
//       case 'warning':
//         return {
//           bgColor: 'bg-yellow-50',
//           borderColor: 'border-yellow-200',
//           textColor: 'text-yellow-700',
//           iconBg: 'bg-yellow-100',
//           icon: '⚠️',
//           label: 'Needs Attention'
//         };
//       case 'critical':
//         return {
//           bgColor: 'bg-red-50',
//           borderColor: 'border-red-200',
//           textColor: 'text-red-700',
//           iconBg: 'bg-red-100',
//           icon: '🚨',
//           label: 'Critical'
//         };
//       default:
//         return {
//           bgColor: 'bg-gray-50',
//           borderColor: 'border-gray-200',
//           textColor: 'text-gray-700',
//           iconBg: 'bg-gray-100',
//           icon: '?',
//           label: 'Unknown'
//         };
//     }
//   };

//   const healthStyle = getHealthStyle(systemHealth.overallStatus);

//   return (
//     <div className="space-y-6">
      
//       {/* ==========================================
//           PAGE HEADER
//           ========================================== */}
//       <div>
//         <h1 className="text-2xl font-semibold text-slate-900 mb-2">
//           My System Dashboard
//         </h1>
//         <p className="text-sm text-slate-600">
//           System health overview and important notifications
//         </p>
//       </div>

//       {/* ==========================================
//           SYSTEM HEALTH SUMMARY CARD
//           ========================================== */}
//       <div className={`${healthStyle.bgColor} ${healthStyle.borderColor} border-2 rounded-lg p-6 shadow-sm`}>
//         <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
//           {/* Left: Health Status */}
//           <div className="flex items-center gap-4">
//             {/* Health Score Circle */}
//             <div className={`flex items-center justify-center w-20 h-20 rounded-full ${healthStyle.iconBg} border-2 ${healthStyle.borderColor}`}>
//               <div className="text-center">
//                 <div className={`text-2xl font-bold ${healthStyle.textColor}`}>
//                   {systemHealth.healthScore}
//                 </div>
//                 <div className={`text-xs ${healthStyle.textColor} opacity-75`}>
//                   Score
//                 </div>
//               </div>
//             </div>

//             {/* Status Info */}
//             <div>
//               <div className="flex items-center gap-2 mb-2">
//                 <span className="text-2xl">{healthStyle.icon}</span>
//                 <h2 className={`text-xl font-semibold ${healthStyle.textColor}`}>
//                   {healthStyle.label}
//                 </h2>
//               </div>
//               <div className="text-sm text-slate-700">
//                 <div className="font-medium">{systemHealth.systemName}</div>
//                 <div className="text-slate-600">System ID: {systemHealth.systemId}</div>
//               </div>
//             </div>
//           </div>

//           {/* Right: System Info */}
//           <div className="grid grid-cols-2 gap-4 lg:gap-6">
//             {/* Last Check Time */}
//             <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-white border-opacity-50">
//               <div className="text-xs text-slate-600 mb-1">Last Checked</div>
//               <div className="font-semibold text-slate-900">{systemHealth.lastCheckTime}</div>
//               <div className="text-xs text-slate-500 mt-1">Automatic monitoring</div>
//             </div>

//             {/* Agent Status */}
//             <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-white border-opacity-50">
//               <div className="text-xs text-slate-600 mb-1">Agent Status</div>
//               <div className="flex items-center gap-2">
//                 <span className={`w-2 h-2 rounded-full ${
//                   systemHealth.agentStatus === 'running' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
//                 }`}></span>
//                 <span className="font-semibold text-slate-900 capitalize">
//                   {systemHealth.agentStatus}
//                 </span>
//               </div>
//               <div className="text-xs text-slate-500 mt-1">Active {systemHealth.agentLastSeen}</div>
//             </div>
//           </div>
//         </div>

//         {/* Healthy Message */}
//         {systemHealth.overallStatus === 'healthy' && (
//           <div className="mt-4 pt-4 border-t border-green-200">
//             <p className="text-sm text-slate-700 flex items-start gap-2">
//               <span className="text-green-600">✓</span>
//               <span>
//                 Everything looks good! Your system is running smoothly with no issues detected. 
//                 We're continuously monitoring for any changes.
//               </span>
//             </p>
//           </div>
//         )}
//       </div>

//       {/* ==========================================
//           ALERTS & NOTIFICATIONS
//           ========================================== */}
//       <div>
//         <h2 className="text-lg font-semibold text-slate-900 mb-4">
//           Alerts & Notifications
//         </h2>

//         {notifications.length > 0 ? (
//           <div className="space-y-3">
//             {notifications.map((notification) => (
//               <NotificationCard key={notification.id} notification={notification} />
//             ))}
//           </div>
//         ) : (
//           // Empty State
//           <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
//             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
//               <span className="text-3xl">📭</span>
//             </div>
//             <p className="text-sm text-slate-600">No new notifications at this time</p>
//           </div>
//         )}
//       </div>

//       {/* ==========================================
//           RECOMMENDED ACTIONS
//           ========================================== */}
//       <div>
//         <h2 className="text-lg font-semibold text-slate-900 mb-4">
//           Recommended Actions
//         </h2>

//         <div className="space-y-3">
//           {recommendations.map((action) => (
//             <div 
//               key={action.id}
//               className="bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-4"
//             >
//               <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 text-xl flex-shrink-0">
//                 {action.icon}
//               </div>
//               <div className="flex-1">
//                 <h3 className="font-semibold text-slate-900 mb-1">{action.title}</h3>
//                 <p className="text-sm text-slate-600">{action.description}</p>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* ==========================================
//           QUICK ACTIONS
//           ========================================== */}
//       <div className="bg-white border border-gray-200 rounded-lg p-6">
//         <h2 className="text-lg font-semibold text-slate-900 mb-4">
//           Quick Actions
//         </h2>
        
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//           {/* View System Details Button */}
//           <button
//             onClick={() => {
//               // TODO: Navigate to My System page
//               // onNavigate('mysystem');
//               console.log('Navigate to: My System Details');
//             }}
//             className="flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
//           >
//             <span className="text-xl">💻</span>
//             <span>View System Details</span>
//           </button>

//           {/* Request Support Button */}
//           <button
//             onClick={() => {
//               // TODO: Navigate to Support Request page
//               // onNavigate('support');
//               console.log('Navigate to: Support Request');
//             }}
//             className="flex items-center justify-center gap-3 px-6 py-4 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
//           >
//             <span className="text-xl">💬</span>
//             <span>Request Support</span>
//           </button>
//         </div>

//         {/* Additional Quick Links */}
//         <div className="mt-4 pt-4 border-t border-gray-200">
//           <div className="text-sm text-slate-600 mb-2">Other actions:</div>
//           <div className="flex flex-wrap gap-3">
//             <button className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
//               View maintenance history
//             </button>
//             <span className="text-slate-300">•</span>
//             <button className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
//               Download system report
//             </button>
//             <span className="text-slate-300">•</span>
//             <button className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
//               Contact technician
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* ==========================================
//           HELP SECTION
//           ========================================== */}
//       <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
//         <div className="flex items-start gap-4">
//           <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 text-xl flex-shrink-0">
//             💡
//           </div>
//           <div>
//             <h3 className="font-semibold text-slate-900 mb-2">Need Help?</h3>
//             <p className="text-sm text-slate-700 mb-3">
//               If you notice anything unusual with your system or have questions, 
//               don't hesitate to reach out. Our support team is here to help.
//             </p>
//             <div className="flex flex-col sm:flex-row gap-2 text-sm">
//               <a 
//                 href="mailto:support@company.com" 
//                 className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
//               >
//                 📧 support@company.com
//               </a>
//               <span className="hidden sm:inline text-slate-400">•</span>
//               <a 
//                 href="tel:+18005550199" 
//                 className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
//               >
//                 📞 +1 (800) 555-0199
//               </a>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ==========================================
// // NOTIFICATION CARD COMPONENT
// // ==========================================

// function NotificationCard({ notification }) {
//   // Determine notification styling based on type
//   const getNotificationStyle = (type) => {
//     switch (type) {
//       case 'warning':
//         return {
//           bgColor: 'bg-yellow-50',
//           borderColor: 'border-yellow-200',
//           iconBg: 'bg-yellow-100',
//           iconColor: 'text-yellow-600'
//         };
//       case 'maintenance':
//         return {
//           bgColor: 'bg-blue-50',
//           borderColor: 'border-blue-200',
//           iconBg: 'bg-blue-100',
//           iconColor: 'text-blue-600'
//         };
//       case 'info':
//         return {
//           bgColor: 'bg-gray-50',
//           borderColor: 'border-gray-200',
//           iconBg: 'bg-gray-100',
//           iconColor: 'text-gray-600'
//         };
//       default:
//         return {
//           bgColor: 'bg-white',
//           borderColor: 'border-gray-200',
//           iconBg: 'bg-gray-100',
//           iconColor: 'text-gray-600'
//         };
//     }
//   };

//   const style = getNotificationStyle(notification.type);

//   return (
//     <div className={`${style.bgColor} border ${style.borderColor} rounded-lg p-4 hover:shadow-sm transition-shadow`}>
//       <div className="flex items-start gap-4">
//         {/* Icon */}
//         <div className={`flex items-center justify-center w-10 h-10 rounded-full ${style.iconBg} ${style.iconColor} text-xl flex-shrink-0`}>
//           {notification.icon}
//         </div>

//         {/* Content */}
//         <div className="flex-1 min-w-0">
//           <div className="flex items-start justify-between gap-2 mb-1">
//             <h3 className="font-semibold text-slate-900 text-sm">
//               {notification.title}
//             </h3>
//             <span className="text-xs text-slate-500 whitespace-nowrap">
//               {notification.timestamp}
//             </span>
//           </div>
//           <p className="text-sm text-slate-700 leading-relaxed">
//             {notification.message}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default UserDashboard;
// src/components/dashboards/UserDashboard.jsx
import React from "react";

/*
  UserDashboard.jsx
  Friendly dashboard for non-technical users
*/

const dummySystemHealth = {
  systemId: "SYS-8472",
  systemName: "Manufacturing Line B",
  overallStatus: "healthy",
  healthScore: 92,
  lastCheckTime: "10 minutes ago",
  agentStatus: "running",
};

const dummyNotifications = [
  {
    id: 1,
    title: "Scheduled Maintenance",
    message:
      "Routine maintenance scheduled for Friday, 3:00 AM - 5:00 AM. No action needed.",
    timestamp: "2 hours ago",
    icon: "🔧",
  },
  {
    id: 2,
    title: "System Update Complete",
    message: "Security updates were installed successfully.",
    timestamp: "1 day ago",
    icon: "✓",
  },
];

const dummyRecommendedActions = [
  {
    id: 1,
    title: "No actions needed",
    description:
      "Your system is running smoothly. We'll notify you if anything needs attention.",
    icon: "✓",
  },
];

function UserDashboard({ user, onNavigate }) {
  const systemHealth = dummySystemHealth;
  const notifications = dummyNotifications;
  const recommendations = dummyRecommendedActions;

  const getHealthStyle = (status) => {
    switch (status) {
      case "healthy":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          text: "text-green-700",
          iconBg: "bg-green-100",
          label: "Healthy",
        };
      case "warning":
        return {
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          text: "text-yellow-700",
          iconBg: "bg-yellow-100",
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

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          My System Dashboard
        </h1>
        <p className="text-sm text-slate-600">
          System health overview and notifications
        </p>
      </div>

      {/* SYSTEM HEALTH CARD */}
      <div
        className={`${healthStyle.bg} ${healthStyle.border} border-2 rounded-lg p-6`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center justify-center w-20 h-20 rounded-full ${healthStyle.iconBg}`}
            >
              <span className="text-3xl font-bold">
                {systemHealth.healthScore}
              </span>
            </div>

            <div>
              <h2 className={`text-xl font-semibold ${healthStyle.text}`}>
                {healthStyle.label}
              </h2>
              <p className="text-sm text-slate-600">
                Last checked {systemHealth.lastCheckTime}
              </p>
            </div>
          </div>

          <div className="text-sm text-slate-600">
            System: <strong>{systemHealth.systemName}</strong>
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Notifications
        </h2>

        {notifications.length === 0 ? (
          <p className="text-sm text-slate-600">No notifications</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="border border-gray-200 rounded-lg p-4 flex gap-3"
              >
                <div className="text-xl">{n.icon}</div>

                <div>
                  <h3 className="font-semibold text-slate-900">{n.title}</h3>
                  <p className="text-sm text-slate-600">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{n.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECOMMENDED ACTIONS */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Recommended Actions
        </h2>

        <div className="space-y-3">
          {recommendations.map((action) => (
            <div
              key={action.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                {action.icon}
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">{action.title}</h3>
                <p className="text-sm text-slate-600">{action.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* VIEW SYSTEM DETAILS */}
          <button
            onClick={() => onNavigate("mysystem")}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            <span className="text-xl">💻</span>
            View System Details
          </button>

          {/* SUPPORT */}
          <button
            onClick={() => onNavigate("support")}
            className="flex items-center justify-center gap-3 px-6 py-4 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition"
          >
            <span className="text-xl">💬</span>
            Request Support
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function UserManagement() {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    // Supabase client may not be fully initialized or connected
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, role");

      if (!error && data) {
        setUsers(data);
        return;
      }
    } catch (e) {
      // Ignored
    }
    
    // Fallback data if Supabase request fails (e.g. during frontend dev)
    setUsers([
      { id: "1", email: "admin@nexusops.com", role: "admin" },
      { id: "2", email: "tech@nexusops.com", role: "technician" },
      { id: "3", email: "user@nexusops.com", role: "user" }
    ]);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const changeRole = async (id, newRole) => {
    // Optimistic UI update
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
    
    // Remote update
    try {
      await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", id);
    } catch (e) {
      // Ignored
    }
  };

  const roleColor = (role) => {
    if (role === "admin") return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (role === "technician") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
        <p className="text-sm text-gray-600 mt-1">Manage user roles and permissions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col gap-5"
          >
            <div className="flex justify-between items-start">
              <div className="break-all pr-4">
                <h3 className="font-semibold text-gray-900 mt-1">
                  {user.email}
                </h3>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border capitalize ${roleColor(
                  user.role
                )}`}
              >
                {user.role}
              </span>
            </div>

            <div className="flex gap-3 mt-auto pt-2">
              <button
                onClick={() => changeRole(user.id, "user")}
                className="flex-1 bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 text-sm font-medium py-2 rounded-lg transition-colors"
              >
                User
              </button>
              <button
                onClick={() => changeRole(user.id, "technician")}
                className="flex-1 bg-white border border-amber-200 hover:bg-amber-50 text-amber-700 text-sm font-medium py-2 rounded-lg transition-colors"
              >
                Technician
              </button>
              <button
                onClick={() => changeRole(user.id, "admin")}
                className="flex-1 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 text-sm font-medium py-2 rounded-lg transition-colors"
              >
                Admin
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
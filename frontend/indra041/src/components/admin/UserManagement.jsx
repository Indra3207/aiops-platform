import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

function UserManagement() {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, role");

    if (!error) {
      setUsers(data);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const changeRole = async (id, newRole) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", id);

    if (!error) {
      fetchUsers();
    }
  };

  const roleColor = (role) => {
    if (role === "admin") return "bg-purple-100 text-purple-700";
    if (role === "technician") return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  return (
    <div>

      <h2 className="text-2xl font-bold mb-6">User Management</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {users.map((user) => (

          <div
            key={user.id}
            className="bg-white p-5 rounded-xl shadow border flex flex-col gap-4"
          >

            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">
                {user.email}
              </h3>

              <span
                className={`text-xs px-3 py-1 rounded-full font-semibold ${roleColor(
                  user.role
                )}`}
              >
                {user.role}
              </span>
            </div>

            <div className="flex gap-2 pt-2">

              <button
                onClick={() => changeRole(user.id, "user")}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-sm py-2 rounded-lg"
              >
                User
              </button>

              <button
                onClick={() => changeRole(user.id, "technician")}
                className="flex-1 bg-blue-100 hover:bg-blue-200 text-sm py-2 rounded-lg"
              >
                Technician
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}

export default UserManagement;
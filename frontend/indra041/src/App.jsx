import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import AdminLayout from "./components/layouts/AdminLayout";
import TechnicianLayout from "./components/layouts/TechnicianLayout";
import UserLayout from "./components/layouts/UserLayout";

import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {

  const [page, setPage] = useState("login");
  const [isAuth, setIsAuth] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const checkSession = async () => {

      const { data } = await supabase.auth.getSession();

      if (data.session) {

        const user = data.session.user;

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile && !error) {
          setIsAuth(true);
          setUserRole(profile.role);

          setUserData({
            email: user.email,
            role: profile.role
          });
        }
      }

      setLoading(false);
    };

    checkSession();

  }, []);

  const loginSuccess = (role, email) => {

    setIsAuth(true);
    setUserRole(role);

    setUserData({
      role,
      email
    });

  };

  const signupSuccess = (data) => {

    setIsAuth(true);
    setUserRole(data.role);

    setUserData(data);

  };

  const logout = async () => {

    await supabase.auth.signOut();

    setIsAuth(false);
    setUserRole(null);
    setUserData(null);
    setPage("login");

  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (!isAuth) {

    return page === "login" ? (

      <Login
        onLoginSuccess={loginSuccess}
        goToSignup={() => setPage("signup")}
      />

    ) : (

      <Signup
        onSignupSuccess={signupSuccess}
        goToLogin={() => setPage("login")}
      />

    );

  }

  if (userRole === "admin") {
    return (
      <ProtectedRoute userRole={userRole} allowedRole="admin">
        <AdminLayout userData={userData} onLogout={logout} />
      </ProtectedRoute>
    );
  }

  if (userRole === "technician") {
    return (
      <ProtectedRoute userRole={userRole} allowedRole="technician">
        <TechnicianLayout userData={userData} onLogout={logout} />
      </ProtectedRoute>
    );
  }

  return <UserLayout userData={userData} onLogout={logout} />;

}

export default App;
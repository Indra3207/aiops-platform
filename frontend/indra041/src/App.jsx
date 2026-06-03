import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import AdminLayout from "./components/layouts/AdminLayout";
import TechnicianLayout from "./components/layouts/TechnicianLayout";
import UserLayout from "./components/layouts/UserLayout";
import { SystemDataProvider } from "./context/SystemDataContext";

import ProtectedRoute from "./components/auth/ProtectedRoute";

const App = () => {

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
    setUserData({ role, email });
  };

  const signupSuccess = (data) => {
    setIsAuth(true);
    setUserRole(data.role);
    setUserData(data);
  };

  const handleLogout = async () => {

    await supabase.auth.signOut();

    setIsAuth(false);
    setUserRole(null);
    setUserData(null);
    setPage("login");

  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  let content = null;
  switch (userRole) {
    case "admin":
      content = (
        <ProtectedRoute userRole={userRole} allowedRole="admin">
          <SystemDataProvider>
            <AdminLayout userData={userData} onLogout={handleLogout} />
          </SystemDataProvider>
        </ProtectedRoute>
      );
      break;
    case "technician":
      content = (
        <ProtectedRoute userRole={userRole} allowedRole="technician">
          <SystemDataProvider>
            <TechnicianLayout userData={userData} onLogout={handleLogout} />
          </SystemDataProvider>
        </ProtectedRoute>
      );
      break;
    case "user":
      content = (
        <ProtectedRoute userRole={userRole} allowedRole="user">
          <SystemDataProvider>
            <UserLayout userData={userData} onLogout={handleLogout} />
          </SystemDataProvider>
        </ProtectedRoute>
      );
      break;
    default:
      content = !isAuth ? (
        page === "login" ? (
          <Login
            onLoginSuccess={loginSuccess}
            goToSignup={() => setPage("signup")}
          />
        ) : (
          <Signup
            onSignupSuccess={signupSuccess}
            goToLogin={() => setPage("login")}
          />
        )
      ) : null;
  }

  return (
    <Routes>
      <Route path="/" element={content} />
    </Routes>
  );
};

export default App;
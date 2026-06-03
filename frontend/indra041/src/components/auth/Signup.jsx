import { useState } from "react";
import { supabase } from "../../supabaseClient";

function Signup({ onSignupSuccess, goToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async () => {
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password
    });

    if (signupError) {
      setError(signupError.message);
      return;
    }

    const user = data.user;

    if (!user) {
      setError("Signup failed");
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: user.id,
        email: email,
        role: "user"
      }
    ]);

    if (profileError) {
      setError(profileError.message);
      return;
    }

    onSignupSuccess({
      email,
      role: "user"
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-bold text-indigo-600 mb-2">
          NexusOps Platform
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Register to start using MaintenanceAI
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Create password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSignup}
            className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Account
          </button>
        </div>

        <div className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <button
            onClick={goToLogin}
            className="text-indigo-600 font-medium hover:underline"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}

export default Signup;
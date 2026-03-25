// import { useState } from "react";
// import { supabase } from "../../supabaseClient";

// function Login({ onLoginSuccess, goToSignup }) {

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");

//   const handleLogin = async () => {

//     setError("");

//     if (!email || !password) {
//       setError("Please enter email and password");
//       return;
//     }

//     const { data, error } = await supabase.auth.signInWithPassword({
//       email,
//       password
//     });

//     if (error) {
//       setError(error.message);
//       return;
//     }

//     const user = data.user;

//     const { data: profile } = await supabase
//       .from("profiles")
//       .select("role")
//       .eq("id", user.id)
//       .single();

//     onLoginSuccess(profile.role, user.email);
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-100">

//       <div className="bg-white w-full max-w-md p-8 rounded-xl shadow-lg">

//         <h1 className="text-2xl font-bold text-gray-800 mb-2">
//           MaintenanceAI
//         </h1>

//         <p className="text-sm text-gray-500 mb-6">
//           Sign in to access the monitoring platform
//         </p>

//         <div className="space-y-4">

//           <div>
//             <label className="text-sm font-medium text-gray-700">
//               Email
//             </label>

//             <input
//               type="email"
//               placeholder="example@email.com"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
//             />
//           </div>

//           <div>
//             <label className="text-sm font-medium text-gray-700">
//               Password
//             </label>

//             <input
//               type="password"
//               placeholder="Enter password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
//             />
//           </div>

//           {error && (
//             <div className="text-red-600 text-sm">
//               {error}
//             </div>
//           )}

//           <button
//             onClick={handleLogin}
//             className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
//           >
//             Sign In
//           </button>

//         </div>

//         <div className="text-center text-sm text-gray-500 mt-6">
//           Don’t have an account?{" "}
//           <button
//             onClick={goToSignup}
//             className="text-blue-600 font-semibold hover:underline"
//           >
//             Create account
//           </button>
//         </div>

//       </div>

//     </div>
//   );
// }

// export default Login;
import { useState } from "react";
import { supabase } from "../../supabaseClient";

function Login({ onLoginSuccess, goToSignup }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {

    setError("");

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (loginError) {
      setError(loginError.message);
      return;
    }

    const user = data.user;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      setError("User profile not found. Please contact admin.");
      return;
    }

    onLoginSuccess(profile.role, user.email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white w-full max-w-md p-8 rounded-xl shadow-lg">

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          MaintenanceAI
        </h1>

        <p className="text-sm text-gray-500 mb-6">
          Sign in to access the monitoring platform
        </p>

        <div className="space-y-4">

          <div>
            <label className="text-sm font-medium text-gray-700">
              Email
            </label>

            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
          >
            Sign In
          </button>

        </div>

        <div className="text-center text-sm text-gray-500 mt-6">
          Don’t have an account?{" "}
          <button
            onClick={goToSignup}
            className="text-blue-600 font-semibold hover:underline"
          >
            Create account
          </button>
        </div>

      </div>

    </div>
  );
}

export default Login;
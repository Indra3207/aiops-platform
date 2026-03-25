// import { useState } from "react";
// import { supabase } from "../../supabaseClient";

// function Signup({ onSignupSuccess, goToLogin }) {

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");

//   const handleSignup = async () => {

//     setError("");

//     if (!email || !password) {
//       setError("Please fill in all fields");
//       return;
//     }

//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password
//     });

//     if (error) {
//       setError(error.message);
//       return;
//     }

//     const user = data.user;

//     await supabase.from("profiles").insert([
//       {
//         id: user.id,
//         email,
//         role: "user"
//       }
//     ]);

//     onSignupSuccess({
//       email,
//       role: "user"
//     });
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-100">

//       <div className="bg-white w-full max-w-md p-8 rounded-xl shadow-lg">

//         <h1 className="text-2xl font-bold text-gray-800 mb-2">
//           Create Account
//         </h1>

//         <p className="text-sm text-gray-500 mb-6">
//           Register to start using MaintenanceAI
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
//               placeholder="Create password"
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
//             onClick={handleSignup}
//             className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
//           >
//             Create Account
//           </button>

//         </div>

//         <div className="text-center text-sm text-gray-500 mt-6">
//           Already have an account?{" "}
//           <button
//             onClick={goToLogin}
//             className="text-blue-600 font-semibold hover:underline"
//           >
//             Sign in
//           </button>
//         </div>

//       </div>

//     </div>
//   );
// }

// export default Signup;
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white w-full max-w-md p-8 rounded-xl shadow-lg">

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Create Account
        </h1>

        <p className="text-sm text-gray-500 mb-6">
          Register to start using MaintenanceAI
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
              placeholder="Create password"
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
            onClick={handleSignup}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
          >
            Create Account
          </button>

        </div>

        <div className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <button
            onClick={goToLogin}
            className="text-blue-600 font-semibold hover:underline"
          >
            Sign in
          </button>
        </div>

      </div>

    </div>
  );
}

export default Signup;
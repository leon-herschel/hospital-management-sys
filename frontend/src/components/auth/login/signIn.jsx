import { useState } from "react";
import { Navigate } from "react-router-dom";
import { doSignInWithEmailAndPassword } from "../../../firebase/auth";
import { useAuth } from "../../../context/authContext/authContext";
import bgImage from "../../../assets/logo.jpg";
import { EyeSlashIcon, EyeIcon } from "@heroicons/react/24/solid";

const SignIn = () => {
  const { userLoggedIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "email") setEmail(value);
    if (name === "password") setPassword(value);

    setErrorMessage("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isSigningIn) {
      setIsSigningIn(true);
      try {
        await doSignInWithEmailAndPassword(email, password);
      } catch (error) {
        let message = "An error occurred. Please try again.";
        if (error.code === "auth/invalid-credential") {
          message = "Invalid password or email.";
        }
        setErrorMessage(message);
        setIsSigningIn(false);
      }
    }
  };

  return (
    <div className="bg-slate-900 flex justify-center items-center h-screen">
      {userLoggedIn && <Navigate to={"/dashboard"} replace={true} />}

      {/* Left: Image */}
      <div className="w-1/2 h-screen hidden lg:block">
        <img
          src={bgImage}
          alt="Southwestern University Hospital"
          className="object-cover w-full h-full"
        />
      </div>

      {/* Right: Login Form */}
      <div className="lg:p-36 md:p-52 sm:p-20 p-8 w-full lg:w-1/2">
        <h1 className="text-white text-3xl font-semibold mb-4">Login</h1>
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-white">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-400"
              autoComplete="email"
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-white">
              Password
            </label>
            <div className="relative w-full">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 pr-10 focus:outline-none focus:border-blue-400"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="text-red-500 mb-4">{errorMessage}</div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSigningIn}
            className={`w-full px-4 py-2 text-white font-medium rounded-lg ${isSigningIn ? "bg-blue-900 cursor-not-allowed" : "bg-blue-800 hover:bg-blue-900 hover:shadow-xl transition duration-300"}`}
          >
            {isSigningIn ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignIn;

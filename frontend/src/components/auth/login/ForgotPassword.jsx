import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../firebase/firebase";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset link has been sent to your email.");
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No user found with this email.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="flex-1 bg-gradient-to-br from-gray-100 to-white flex items-center justify-center p-8">
        <div className="text-center">
          {/* Odyssey Logo */}
          <div className="mb-8">
            <img 
              src="/public/logo.jpg" 
              alt="Odyssey ODC Logo" 
              className="mx-auto mb-4 w-64 h-auto"
            />
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 bg-slate-800 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
            <p className="text-gray-400">Enter your email to reset your password</p>
          </div>

          <form onSubmit={handleReset} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-gray-300 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your email address"
              />
            </div>

            {message && (
              <div className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                {message}
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-200"
            >
              Send Reset Link
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              to="/" 
              className="text-orange-400 hover:text-orange-300 text-sm transition-colors duration-200"
            >
              Back to Login
            </Link>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-xs">
              Secure reset powered by Odyssey encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
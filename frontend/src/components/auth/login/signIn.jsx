import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { doSignInWithEmailAndPassword } from '../../../firebase/auth';
import { useAuth } from '../../../context/authContext/authContext';
import bgImage from '../../../assets/logo.jpg';

const SignIn = () => {
  const { userLoggedIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isSigningIn) {
      setIsSigningIn(true);
      try {
        await doSignInWithEmailAndPassword(email, password);
      } catch (error) {
        setErrorMessage(error.message);
        setIsSigningIn(false);
      }
    }
  };

  return (
    <div className="bg-red-900 flex justify-center items-center h-screen">
      {userLoggedIn && <Navigate to={'/home'} replace={true} />}

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
            <label htmlFor="email" className="block text-white">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              autoComplete="email"
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-white">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 mb-2 focus:outline-none focus:border-blue-500"
              autoComplete="current-password"
              required
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="text-red-600 font-bold mb-4">{errorMessage}</div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSigningIn}
            className={`w-full px-4 py-2 text-white font-medium rounded-lg ${isSigningIn ? 'bg-red-950 cursor-not-allowed' : 'bg-red-600 hover:bg-red-950 hover:shadow-xl transition duration-300'}`}
          >
            {isSigningIn ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignIn;

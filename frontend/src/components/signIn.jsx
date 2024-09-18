import bgImage from '../assets/logo.jpg';

const SignIn = () => {
  return (
    <div className="bg-red-900 flex justify-center items-center h-screen">
      {/* Left: Image */}
      <div className="w-1/2 h-screen hidden lg:block">
        <img 
          src={bgImage} 
          alt="Southwestern University Hospital" 
          className="object-cover w-full h-full"
        />
      </div>
      {/* Right: Login Form */}
      <div className="lg:p-36 md:p-52 sm:20 p-8 w-full lg:w-1/2">
        <h1 className="text-white text-3xl font-semibold mb-4">Login</h1>
        <form action="#" method="POST">
          {/* Username Input */}
          <div className="mb-4">
            <label htmlFor="username" className="block text-white">Username</label>
            <input 
              type="text" 
              id="username" 
              name="username" 
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500" 
              autoComplete="off"
            />
          </div>
          {/* Password Input */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-white">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500" 
              autoComplete="off"
            />
          </div>
          {/* Forgot Password Link */}
          <div className="mb-6 text-blue-200">
            <a href="#" className="hover:underline">Forgot Password?</a>
          </div>
          {/* Login Button */}
          <button 
            type="submit" 
            className="bg-red-600 hover:bg-red-950 text-white font-semibold rounded-md py-2 px-4 w-full"
          >
            Login Test
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignIn;

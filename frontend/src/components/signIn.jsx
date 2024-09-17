const SignIn = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="xl:w-[700px] px-10 h-[400px] rounded-3xl xl:shadow-xl bg-red-900 bg-opacity-80">
        <h1 className="text-center text-white text-3xl font-bold mt-5 mb-4 ">LOGIN</h1>
        <div className="flex justify-center mt-10">
          <form>
            <input
              type="text"
              className="py-3 p-5 rounded-2xl bg-white md:w-[500px] w-[300px] outline-indigo-400"
              placeholder="Enter your email"
            />
            <br />
            <br />
            <input
              type="password"
              className="py-3 p-5 rounded-2xl bg-white md:w-[500px] w-[300px] outline-indigo-400"
              placeholder="Enter your password"
            />
            <div className="flex justify-end mt-3 mb-4">
              <a href="#" className="text-zinc-300">
                Forgot Password?
              </a>
            </div>
            <button
              type="submit"
              className="py-3 bg-white text-black w-full rounded-2xl font-bold text-lg"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;

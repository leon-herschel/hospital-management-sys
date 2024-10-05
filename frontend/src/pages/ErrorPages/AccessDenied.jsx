import { useNavigate } from "react-router-dom";

const AccessDenied = () => {
  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate("/dashboard");
  };

  return (
    <div className="text-center mt-10">
      <h1 className="text-6xl font-bold text-gray-900">Sorry!</h1>
      <p className="mt-4 text-xl text-gray-900">
        You are not authorized to access this page.
      </p>
      <button
        onClick={handleRedirect}
        className="mt-6 inline-block px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition duration-200"
      >
        Return to Homepage
      </button>
    </div>
  );
};

export default AccessDenied;

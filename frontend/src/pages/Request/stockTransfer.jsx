import React from "react";
import { useNavigate } from "react-router-dom";

function StockTransfer() {
  const navigate = useNavigate(); // Hook to navigate programmatically

  const handleViewRequest = () => {
    navigate("/request"); // Redirect to the Request component
  };

  const handleViewTransfer = () => {
    navigate("/transfer"); // Redirect to the Request component
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div
        className="grid grid-cols-2 gap-4 cursor-pointer"
        onClick={handleViewTransfer}
      >
        <div className="bg-white shadow-lg rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold">Transfer</h2>
        </div>

        <div
          className="bg-white shadow-lg rounded-lg p-6 text-center cursor-pointer"
          onClick={handleViewRequest}
        >
          <h2 className="text-xl font-semibold">View Request</h2>
        </div>
      </div>
    </div>
  );
}

export default StockTransfer;

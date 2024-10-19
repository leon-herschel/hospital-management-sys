import React from 'react';
import { useNavigate } from 'react-router-dom';

function StockTransfer() {
  const navigate = useNavigate(); // Hook to navigate programmatically


const handleViewTransferHistory = () => {
  navigate('/CsrTransferHistory');
}
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="grid grid-cols-2 gap-4">



        <div
          className="bg-white shadow-lg rounded-lg p-6 text-center cursor-pointer"
          onClick={handleViewTransferHistory}
        >
          <h2 className="text-xl font-semibold">View Transfer History</h2>
        </div>
        <div
          className="bg-white shadow-lg rounded-lg p-6 text-center cursor-pointer"
          onClick={handleViewTransferHistory}
        >
          <h2 className="text-xl font-semibold">View Transfer History</h2>
        </div>
        <div
          className="bg-white shadow-lg rounded-lg p-6 text-center cursor-pointer"
          onClick={handleViewTransferHistory}
        >
          <h2 className="text-xl font-semibold">View Transfer History</h2>
        </div>
      </div>
    </div>
  );
}

export default StockTransfer;

import React from 'react';
import { useNavigate } from 'react-router-dom';

function RequestStock() {
  const navigate = useNavigate(); // Hook to navigate programmatically

  const handleViewRequest = () => {
    navigate('/requestS'); // Redirect to the Request component
  };

  const handleViewInventoryStock = () => {
    navigate('/inventoryStock'); // Redirect to the Inventory component
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="grid grid-cols-2 gap-4">
        <div
          className="bg-white shadow-lg rounded-lg p-6 text-center cursor-pointer"
          onClick={handleViewRequest} // Click handler for Request Stock
        >
          <h2 className="text-xl font-semibold">Request Stock</h2>
        </div>

        <div
          className="bg-white shadow-lg rounded-lg p-6 text-center cursor-pointer"
          onClick={handleViewInventoryStock} // Click handler for Inventory
        >
          <h2 className="text-xl font-semibold">Inventory</h2>
        </div>
      </div>
    </div>
  );
}

export default RequestStock;

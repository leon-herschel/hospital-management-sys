// src/pages/Inventory/StockInModal.js
import React, { useState } from "react";
import { update, ref } from "firebase/database";
import { database } from "../../firebase/firebase";
import { calculateStatus } from "../Inventory/CalculateStatusLogic"; // Ensure this is available in your project

function StockInModal({ isOpen, toggleModal, currentItem, department, role, selectedTab }) {
  const [stockQuantity, setStockQuantity] = useState(0);

  const handleStockIn = async (event) => {
    event.preventDefault();

    const newQuantity = Number(currentItem.quantity) + Number(stockQuantity);
    const maxQuantity = currentItem.maxQuantity || newQuantity;
    const updatedStatus = calculateStatus(newQuantity, maxQuantity);

    const updatedItem = {
      ...currentItem,
      quantity: newQuantity,
      status: updatedStatus,
    };

    const itemType = selectedTab === "medicine" ? "localMeds" : "localSupplies";
    const updatePath =
      role === "admin"
        ? `departments/${selectedTab === "medicine" ? "Pharmacy" : "CSR"}/${itemType}/${currentItem.id}`
        : `departments/${department}/${itemType}/${currentItem.id}`;

    await update(ref(database, updatePath), updatedItem);
    toggleModal(); // Close the modal after updating
  };

  return (
    isOpen && (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 sm:w-2/3 md:w-1/2 lg:w-1/3">
          <h2 className="text-lg font-bold mb-4">Stock In - {currentItem.itemName}</h2>
          <form onSubmit={handleStockIn}>
            <div className="mb-4">
              <label className="block mb-2">Add Quantity</label>
              <input
                type="number"
                name="stockQuantity"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="border px-4 py-2 w-full"
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={toggleModal}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200 mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
              >
                Stock In
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );
}

export default StockInModal;

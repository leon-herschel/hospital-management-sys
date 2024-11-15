import React, { useState, useEffect } from "react";
import { update, ref, push, get } from "firebase/database";
import { getAuth } from "firebase/auth";
import { database } from "../../firebase/firebase";
import { calculateStatus } from "../Inventory/CalculateStatusLogic";

function StockInModal({ isOpen, toggleModal, currentItem, department, role, selectedTab }) {
  const [user, setUser] = useState(null);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [fetchedItem, setFetchedItem] = useState(null);

  useEffect(() => {
    // Fetch the authenticated user using Firebase Auth
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
    } else {
      console.warn("User is not authenticated.");
    }
  }, []);

  useEffect(() => {
    const fetchItemData = async () => {
      if (isOpen && currentItem) {
        try {
          const itemType = selectedTab === "medicine" ? "localMeds" : "localSupplies";
          const itemPath =
            role === "admin"
              ? `departments/${selectedTab === "medicine" ? "Pharmacy" : "CSR"}/${itemType}/${currentItem.id}`
              : `departments/${department}/${itemType}/${currentItem.id}`;

          const itemRef = ref(database, itemPath);
          const itemSnapshot = await get(itemRef);

          if (itemSnapshot.exists()) {
            setFetchedItem(itemSnapshot.val());
          } else {
            setFetchedItem(null);
          }
        } catch (error) {
          console.error("Error fetching item data:", error);
        }
      }
    };

    fetchItemData();
  }, [isOpen, currentItem, department, role, selectedTab]);

  const handleStockIn = async (event) => {
    event.preventDefault();
    if (!fetchedItem) return;
    if (!user) {
      console.warn("User is not authenticated. Please sign in.");
      return;
    }

    try {
      const newQuantity = Number(fetchedItem.quantity) + Number(stockQuantity);
      const maxQuantity = fetchedItem.maxQuantity || newQuantity;
      const updatedStatus = calculateStatus(newQuantity, maxQuantity);

      const updatedItem = {
        ...fetchedItem,
        quantity: newQuantity,
        status: updatedStatus,
      };

      const itemType = selectedTab === "medicine" ? "localMeds" : "localSupplies";
      const updatePath =
        role === "admin"
          ? `departments/${selectedTab === "medicine" ? "Pharmacy" : "CSR"}/${itemType}/${currentItem.id}`
          : `departments/${department}/${itemType}/${currentItem.id}`;

      await update(ref(database, updatePath), updatedItem);

      // Determine the history path based on the selectedTab
      const historyPath = selectedTab === "medicine"
        ? "medicineStockInHistory"
        : "supplyStockInHistory";

      const stockInHistoryRef = ref(database, historyPath);
      const historyEntry = {
        itemName: fetchedItem.itemName,
        quantityAdded: stockQuantity,
        newQuantity: newQuantity,
        email: user.email || "Unknown Email",
        department: department,
        timestamp: new Date().toISOString(),
      };

      await push(stockInHistoryRef, historyEntry);

      toggleModal();
    } catch (error) {
      console.error("Error updating stock or pushing to history:", error);
    }
  };

  return (
    isOpen && (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 sm:w-2/3 md:w-1/2 lg:w-1/3">
          <h2 className="text-lg font-bold mb-4">
            Stock In - {fetchedItem ? fetchedItem.itemName : "Loading..."}
          </h2>
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

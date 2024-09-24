import React, { useState } from "react";
import { ref, push, set } from "firebase/database";
import { database } from "../../firebase/firebase";

const calculateStatus = (quantity, maxQuantity) => {
  const percentage = (quantity / maxQuantity) * 100;

  if (percentage > 70) {
    return "Good";
  } else if (percentage > 50) {
    return "Low";
  } else {
    return "Very Low";
  }
};

function AddSupplies({ isOpen, toggleModal }) {
  const [supplyName, setSupplyName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [brand, setBrand] = useState("");

  const handleSubmit = async () => {
    if (!supplyName || !quantity || !brand) {
      alert("Please fill in all the required fields");
      return;
    }

    const supplyRef = ref(database, "supplies");
    const newSupplyRef = push(supplyRef);

    const maxQuantity = Number(quantity);
    const status = calculateStatus(maxQuantity, maxQuantity);

    try {
      const supplyData = {
        supplyName: supplyName,
        quantity: maxQuantity,
        maxQuantity: maxQuantity,
        brand: brand,
        status: status,
      };

      await set(newSupplyRef, supplyData);
      alert(`Supply has been added successfully! Status: ${status}`);
      setSupplyName("");
      setQuantity("");
      setBrand("");
      toggleModal();
    } catch (error) {
      console.error("Error adding supply:", error);
      alert("Error adding supply.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
          onClick={toggleModal}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center">Add New Supply</h2>

        <div className="mb-4">
          <label htmlFor="supply" className="block text-gray-700 mb-2">
            Supply Name
          </label>
          <input
            type="text"
            id="supply"
            name="supply"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            value={supplyName}
            onChange={(e) => setSupplyName(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="quantity" className="block text-gray-700 mb-2">
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="brand" className="block text-gray-700 mb-2">
            Brand
          </label>
          <input
            type="text"
            id="brand"
            name="brand"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </div>

        <button
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export default AddSupplies;
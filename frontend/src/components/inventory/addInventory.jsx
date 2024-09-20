import React, { useState } from "react";
import { ref, push, set } from "firebase/database";
import { database } from "../dbconfig/db";

function AddInventory({ isOpen, toggleModal }) {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");

  const handlesubmit = () => {
    if (!itemName || !quantity || !department || !status) {
      alert("Please fill in all the required fields");
      return;
    }

    const inventoryRef = ref(database, "inventory");
    const NewInventoryRef = push(inventoryRef);

    if (NewInventoryRef) {
      set(NewInventoryRef, {
        itemName: itemName,
        quantity: quantity,
        department: department,
        status: status,
      })
        .then(() => {
          alert("Inventory has been updated successfully!");
          setItemName("");
          setQuantity("");
          setStatus("");
          setDepartment("");
          toggleModal();
        })
        .catch((error) => {
          alert("Error updating inventory: ", error);
        });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
          onClick={toggleModal}
        >
          &times;
        </button>

        {/* Modal content */}
        <h2 className="text-2xl font-bold mb-6 text-center">Add New Item</h2>

        <div className="mb-4">
          <label htmlFor="item" className="block text-gray-700 mb-2">
            Item Name
          </label>
          <input
            type="text"
            id="item"
            name="item"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
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
          <label htmlFor="department" className="block text-gray-700 mb-2">
            Department
          </label>
          <select
            id="department"
            name="department"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="" disabled>
              Select Department
            </option>
            <option value="IT">IT</option>
            <option value="Nursing">Nursing</option>
            <option value="MedTech">Medical Technology</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="status" className="block text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="" disabled>
              Select Status
            </option>
            <option value="ok">Ok</option>
            <option value="low">Low</option>
            <option value="verylow">Very Low</option>
          </select>
        </div>

        <button
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
          onClick={handlesubmit}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export default AddInventory;

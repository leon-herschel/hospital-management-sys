import React, { useState } from "react";
import { ref, push, set } from "firebase/database";
import QRCode from "qrcode";
import { database } from "../../firebase/firebase";

// Helper function to generate a random alphanumeric string
const generateRandomKey = (length) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Function to calculate status based on quantity and maxQuantity
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

function AddInventory({ isOpen, toggleModal }) {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [loading, setLoading] = useState(false); // New state to track loading

  const [itemNameError, setItemNameError] = useState(false);
  const [quantityError, setQuantityError] = useState(false);
  const [costPriceError, setCostPriceError] = useState(false);
  const [retailPriceError, setRetailPriceError] = useState(false);

  const handlesubmit = async () => {
    setItemNameError(false);
    setQuantityError(false);
    setCostPriceError(false);
    setRetailPriceError(false);

    let hasError = false;

    if (!itemName) {
      setItemNameError(true);
      hasError = true;
    }
    if (!quantity) {
      setQuantityError(true);
      hasError = true;
    }
    if (!costPrice) {
      setCostPriceError(true);
      hasError = true;
    }
    if (!retailPrice) {
      setRetailPriceError(true);
      hasError = true;
    }
    if (hasError) {
      return;
    }
    const inventoryRef = ref(database, "medicine");
    const newInventoryRef = push(inventoryRef);

    const qrKey = generateRandomKey(20);
    const maxQuantity = Number(quantity);
    const status = calculateStatus(maxQuantity, maxQuantity);

    try {
      const qrCodeDataUrl = await QRCode.toDataURL(qrKey, { width: 100 });

      const inventoryData = {
        itemName: itemName,
        quantity: maxQuantity,
        maxQuantity: maxQuantity,
        costPrice: Number(costPrice),
        retailPrice: Number(retailPrice),
        status: status,
        qrCode: qrCodeDataUrl,
      };

      await set(newInventoryRef, inventoryData);

      alert("Inventory has been added successfully!");
      setItemName("");
      setQuantity("");
      setCostPrice("");
      setRetailPrice("");
      toggleModal();
    } catch (error) {
      alert("Error adding inventory: " + error);
    } finally {
      setLoading(false); // Reset loading to false when submission is done
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
            disabled={loading} // Disable the input while loading
          />
          {itemNameError && (
            <p className="text-red-500 mt-1">Item name is required</p>
          )}
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
            disabled={loading} // Disable the input while loading
          />
          {quantityError && (
            <p className="text-red-500 mt-1">Quantity is required</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="costPrice" className="block text-gray-700 mb-2">
            Cost Price
          </label>
          <input
            type="number"
            id="costPrice"
            name="costPrice"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            disabled={loading} // Disable the input while loading
          />
          {costPriceError && (
            <p className="text-red-500 mt-1">Cost price is required</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="retailPrice" className="block text-gray-700 mb-2">
            Retail Price
          </label>
          <input
            type="number"
            id="retailPrice"
            name="retailPrice"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            value={retailPrice}
            onChange={(e) => setRetailPrice(e.target.value)}
            disabled={loading} // Disable the input while loading
          />
          {retailPriceError && (
            <p className="text-red-500 mt-1">Retail price is required</p>
          )}
        </div>

        <button
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
          onClick={handlesubmit}
          disabled={loading} // Disable button while loading
        >
          {loading ? (
            <span>Loading...</span> // Display loading text while submitting
          ) : (
            "Submit"
          )}
        </button>
      </div>
    </div>
  );
}

export default AddInventory;

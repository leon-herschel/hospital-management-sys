import React, { useState } from "react";
import { ref, push, set } from "firebase/database";
import QRCode from "qrcode";
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

const generateRandomKey = (length) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

function AddSupplies({ isOpen, toggleModal }) {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [brand, setBrand] = useState("");
  const [costPrice, setCostPrice] = useState(""); // New state for cost price
  const [retailPrice, setRetailPrice] = useState(""); // New state for retail price

  const [itemNameError, setItemNameError] = useState(false);
  const [quantityError, setQuantityError] = useState(false);
  const [brandError, setBrandError] = useState(false);
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
    if (!brand) {
      setBrandError(true);
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

    const supplyRef = ref(database, "supplies");
    const newSupplyRef = push(supplyRef);

    const maxQuantity = Number(quantity);

    const status = calculateStatus(maxQuantity, maxQuantity);

    // Generate a random key for QR code
    const qrKey = generateRandomKey(20);

    try {
      // Generate QR code with the random QR key as data
      const qrCodeDataUrl = await QRCode.toDataURL(qrKey, { width: 100 });

      const supplyData = {
        itemName: itemName,
        quantity: maxQuantity,
        maxQuantity: maxQuantity,
        brand: brand,
        costPrice: Number(costPrice), // Convert cost price to a number
        retailPrice: Number(retailPrice), // Convert retail price to a number
        status: status,
        qrCode: qrCodeDataUrl, // Storing the QR code image as a data URL
      };

      set(newSupplyRef, supplyData)
        .then(() => {
          alert("Supply has been added successfully!");
          setItemName("");
          setQuantity("");
          setBrand("");
          setCostPrice(""); // Reset cost price field
          setRetailPrice(""); // Reset retail price field
          toggleModal();
        })
        .catch((error) => {
          alert("Error adding supply: " + error);
        });
    } catch (error) {
      console.error("Error generating QR code:", error);
      alert("Error generating QR code.");
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
        <h2> Add New Supply</h2>

        <div className="mb-4">
          <label htmlFor="itemName" className="block text-gray-700 mb-2">
            Supply Name
          </label>
          <input
            type="text"
            id="itemName"
            name="itemName"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          {itemNameError && (
            <p className="text-red-500 mt-1">Supply name is required</p>
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
          />
          {quantityError && (
            <p className="text-red-500 mt-1">Quantity is required</p>
          )}
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
          {brandError && <p className="text-red-500 mt-1">Brand is required</p>}
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
            onChange={(e) => setCostPrice(e.target.value)} // Update state with cost price
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
            onChange={(e) => setRetailPrice(e.target.value)} // Update state with retail price
          />
          {retailPriceError && (
            <p className="text-red-500 mt-1">Retail price is required</p>
          )}
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

export default AddSupplies;

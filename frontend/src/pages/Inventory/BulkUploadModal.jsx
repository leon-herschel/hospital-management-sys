import React, { useState } from "react";
import Papa from "papaparse";
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

function BulkUploadModal({ isOpen, toggleModal }) {
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;

        for (const row of rows) {
          try {
            // Sanitize and validate numeric fields
            const rawQuantity = row.quantity ? row.quantity.trim() : "0";
            const quantityValue = Number(rawQuantity);

            const costPriceValue = Number(row.costPrice);
            const retailPriceValue = Number(row.retailPrice);

            if (
              isNaN(quantityValue) ||
              isNaN(costPriceValue) ||
              isNaN(retailPriceValue)
            ) {
              console.error("Invalid row skipped:", row);
              continue; // Skip invalid rows
            }

            const qrKey = generateRandomKey(20);
            const qrCodeDataUrl = await QRCode.toDataURL(qrKey, { width: 100 });

            const supplyRef = ref(database, "departments/CSR/localSupplies");
            const newSupplyRef = push(supplyRef);

            const supplyData = {
              itemName: row.itemName || "",
              quantity: quantityValue,
              maxQuantity: quantityValue,
              brand: row.brand || "",
              costPrice: costPriceValue,
              retailPrice: retailPriceValue,
              status: calculateStatus(quantityValue, quantityValue),
              qrCode: qrCodeDataUrl,
            };

            await set(newSupplyRef, supplyData);
          } catch (error) {
            console.error("Failed to process row:", row, error);
          }
        }

        alert("Bulk supplies uploaded successfully!");
        setLoading(false);
        toggleModal();
      },
      error: (err) => {
        console.error("CSV Parsing Error:", err);
        alert("Failed to parse CSV file.");
        setLoading(false);
      },
    });
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

        <h2 className="text-xl font-bold mb-4 text-center">Bulk Upload Supplies</h2>

        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={loading}
          className="w-full border border-gray-300 px-4 py-2 rounded-md"
        />

        <p className="mt-2 text-sm text-gray-600">
          Please upload a CSV file containing the following columns: <br />
          <strong>itemName, quantity, brand, costPrice, retailPrice</strong>
        </p>

        {loading && (
          <p className="text-blue-500 font-semibold mt-4">Uploading...</p>
        )}
      </div>
    </div>
  );
}

export default BulkUploadModal;

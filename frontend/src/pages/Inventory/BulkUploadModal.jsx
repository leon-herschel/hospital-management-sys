import React, { useState } from "react";
import Papa from "papaparse";
import { ref, set } from "firebase/database";
import { database } from "../../firebase/firebase";

// Generate random 20-character key
const generateRandomKey = (length = 20) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join("");
};

const BulkUploadModal = ({ isOpen, toggleModal, itemGroup }) => {
  const [csvData, setCsvData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        setCsvData(results.data);
      },
    });
  };

  const handleSubmit = async () => {
    if (csvData.length === 0) {
      alert("No CSV data to upload.");
      return;
    }

    setLoading(true);
    try {
      for (let row of csvData) {
        const key = generateRandomKey(20);
        const refPath = ref(database, `inventoryItems/${key}`);

        const baseData = {
          itemName: row.itemName || "",
          itemCategory: row.itemCategory || "",
          itemGroup: itemGroup,
          defaultCostPrice: parseFloat(row.defaultCostPrice || 0),
          defaultRetailPrice: parseFloat(row.defaultRetailPrice || 0),
          specifications: row.specifications || "",
          quantity: parseInt(row.quantity || 0),
          createdAt: new Date().toISOString(),
        };

        if (itemGroup === "Medicine") {
          baseData.brand = row.brand || "";
          baseData.genericName = row.genericName || "";
          baseData.defaultDosage = row.defaultDosage || "";
          baseData.unitOfMeasure = {
            bigUnit: row.bigUnit || "",
            smallUnit: row.smallUnit || "",
            conversionFactor: parseInt(row.conversionFactor || 1),
          };
        }

        await set(refPath, baseData);
      }

      alert("Bulk upload successful!");
      toggleModal();
    } catch (error) {
      console.error("Upload error:", error);
      alert("There was an error uploading your CSV.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-xl">
        <h2 className="text-xl font-bold mb-4">Upload {itemGroup} CSV</h2>
        <input
          type="file"
          accept=".csv"
          onChange={handleCSVUpload}
          className="mb-4"
        />
        <div className="flex justify-end gap-4">
          <button
            onClick={toggleModal}
            className="px-4 py-2 bg-gray-500 text-white rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;

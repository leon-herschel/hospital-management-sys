import React, { useState } from "react";
import Papa from "papaparse";
import { ref, push, set } from "firebase/database";
import { database } from "../../firebase/firebase";

function BulkUploadInventory({ isOpen, toggleModal }) {
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const handleCSVUpload = () => {
    if (!csvFile) {
      alert("Please select a CSV file.");
      return;
    }

    setLoading(true);

    Papa.parse(csvFile, {
      header: true,
      complete: async (results) => {
        const inventoryRef = ref(database, "departments/Pharmacy/localMeds");

        for (const row of results.data) {
          if (!row.shortDesc) continue; // Skip incomplete rows

          const newInventoryRef = push(inventoryRef);

          const inventoryData = {
            shortDesc: row.shortDesc || "",
            standardDesc: row.standardDesc || "",
            customDesc: row.customDesc || "",
            genericName: row.genericName || "",
            specifications: row.specifications || "",
            itemGroup: row.itemGroup || "",
            itemCategory: row.itemCategory || "",
            examinationType: row.examinationType || "",
            nhipCategory: row.nhipCategory || "",
            drugAdminGroup: row.drugAdminGroup || "",
            smallUnit: row.smallUnit || "",
            conversion: row.conversion || "",
            bigUnit: row.bigUnit || "",
            expiryDate: row.expiryDate || "",
            quantity: row.quantity || "",
          };

          await set(newInventoryRef, inventoryData);
        }

        setLoading(false);
        alert("Bulk upload completed!");
        toggleModal();
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
        <h2 className="text-xl font-bold mb-4">Upload Inventory CSV</h2>

        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={loading}
        />

        <div className="flex justify-end mt-4 space-x-2">
          <button
            onClick={handleCSVUpload}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
          >
            {loading ? "Uploading..." : "Upload CSV"}
          </button>

          <button
            onClick={toggleModal}
            disabled={loading}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default BulkUploadInventory;

import React, { useState } from "react";
import { get, ref as dbRef, set } from "firebase/database";
import { database } from "../../firebase/firebase";
import Papa from "papaparse";
import { useEffect } from "react";
const generateRandomKey = (length = 20) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join("");
};

function AddSupplyModal({ isOpen, toggleModal }) {
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [defaultCostPrice, setDefaultCostPrice] = useState("");
  const [defaultRetailPrice, setDefaultRetailPrice] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [loading, setLoading] = useState(false);

  // Bulk Upload States
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");

 useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const snapshot = await get(dbRef(database, "suppliers"));
        if (snapshot.exists()) {
          const data = snapshot.val();
          const supplierList = Object.entries(data).map(([id, value]) => ({
            id,
            name: value.name || id,
          }));
          setSuppliers(supplierList);
        }
      } catch (error) {
        console.error("Failed to fetch suppliers:", error);
      }
    };

    fetchSuppliers();
  }, []);

  const handleSubmit = async () => {
    if (
      !itemName ||
      !itemCategory ||
      !defaultCostPrice ||
      !defaultRetailPrice ||
      !specifications
    ) {
      alert("Please fill out all required fields.");
      return;
    }

    try {
      setLoading(true);
      const uniqueKey = generateRandomKey(20);
      const inventoryRef = ref(database, `inventoryItems/${uniqueKey}`);
      const inventoryData = {
        itemName,
        itemCategory,
        itemGroup: "Supply",
        defaultCostPrice: parseFloat(defaultCostPrice),
        defaultRetailPrice: parseFloat(defaultRetailPrice),
        specifications,
        supplierName: selectedSupplier,
        createdAt: new Date().toISOString(),
      };

      await set(inventoryRef, inventoryData);
      alert("Supply item added successfully!");
      clearForm();
      toggleModal();
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Error adding item.");
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setItemName("");
    setItemCategory("");
    setDefaultCostPrice("");
    setDefaultRetailPrice("");
    setSpecifications("");
  };

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

  const handleBulkSubmit = async () => {
    if (csvData.length === 0) {
      alert("No CSV data to upload.");
      return;
    }

    setLoading(true);
    try {
      for (let row of csvData) {
        const key = generateRandomKey(20);
        const refPath = ref(database, `inventoryItems/${key}`);
        const data = {
          itemName: row.itemName || "",
          itemCategory: row.itemCategory || "",
          itemGroup: "Supply",
          defaultCostPrice: parseFloat(row.defaultCostPrice || 0),
          defaultRetailPrice: parseFloat(row.defaultRetailPrice || 0),
          specifications: row.specifications || "",
           supplierName: row.supplierName || "",
          createdAt: new Date().toISOString(),
        };

        await set(refPath, data);
      }

      alert("Bulk upload successful!");
      setCsvData([]);
      toggleModal();
    } catch (error) {
      console.error("Upload error:", error);
      alert("There was an error uploading your CSV.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleDownloadSampleCSV = () => {
    const headers = [
      "itemName",
      "itemCategory",
      "defaultCostPrice",
      "defaultRetailPrice",
      "specifications",
      "supplierName",
    ];

    const sampleRow = {
      itemName: "Syringe 5ml",
      itemCategory: "Syringes",
      defaultCostPrice: 3.5,
      defaultRetailPrice: 5.0,
      specifications: "Sterile, individually packed",
      supplierName: "SWU Pharmacy",
    };

    const csvContent =
      headers.join(",") + "\n" + headers.map((h) => sampleRow[h]).join(",");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "supply_sample_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-center">Add Supply</h2>
          <button
            className="text-sm text-blue-600 underline"
            onClick={() => setIsBulkMode((prev) => !prev)}
          >
            {isBulkMode ? "Switch to Manual Entry" : "Bulk Upload via CSV"}
          </button>
        </div>

        {!isBulkMode ? (
          // Manual Entry Form
          <>
            <div className="grid grid-cols-2 gap-4">
              <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="" disabled>
                Select Supplier
              </option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.name}>
                  {supplier.name}
                </option>
              ))}
            </select>
              <input
                type="text"
                placeholder="Item Name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="border p-2 rounded"
              />
              <select
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value)}
                className="border p-2 rounded"
              >
                <option value="" disabled>
                  Select Item Category
                </option>
                <option value="Syringes">Syringes</option>
                <option value="Cotton and Gauze">Cotton and Gauze</option>
                <option value="Surgical Tools">Surgical Tools</option>
                <option value="Bandages and Tape">Bandages and Tape</option>
                <option value="IV Sets">IV Sets</option>
              </select>
              <input
                type="number"
                placeholder="Cost Price"
                value={defaultCostPrice}
                onChange={(e) => setDefaultCostPrice(e.target.value)}
                className="border p-2 rounded"
              />
              <input
                type="number"
                placeholder="Retail Price"
                value={defaultRetailPrice}
                onChange={(e) => setDefaultRetailPrice(e.target.value)}
                className="border p-2 rounded"
              />
              <input
                type="text"
                placeholder="Specifications"
                value={specifications}
                onChange={(e) => setSpecifications(e.target.value)}
                className="border p-2 rounded"
              />
            </div>

            <div className="flex justify-end mt-6 gap-2">
              <button
                onClick={handleDownloadSampleCSV}
                className="mb-2 text-sm text-blue-600 underline"
              >
                Download Sample CSV Template
              </button>
              <button
                onClick={toggleModal}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </>
        ) : (
          // Bulk Upload Mode
          <>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="border p-2 rounded w-full mb-4"
            />
            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={toggleModal}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkSubmit}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                {loading ? "Uploading..." : "Upload CSV"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AddSupplyModal;

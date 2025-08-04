import React, { useState } from "react";
import { ref, set } from "firebase/database";
import { database } from "../../firebase/firebase";
import Papa from "papaparse";

const generateRandomKey = (length = 20) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join("");
};

function AddMedicineModal({ isOpen, toggleModal }) {
  const [itemName, setItemName] = useState("");
  const [brand, setBrand] = useState("");
  const [genericName, setGenericName] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [bigUnit, setBigUnit] = useState("");
  const [smallUnit, setSmallUnit] = useState("");
  const [conversionFactor, setConversionFactor] = useState("");
  const [defaultDosage, setDefaultDosage] = useState("");
  const [defaultCostPrice, setDefaultCostPrice] = useState("");
  const [defaultRetailPrice, setDefaultRetailPrice] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [loading, setLoading] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [csvData, setCsvData] = useState([]);

  const handleSubmit = async () => {
    if (
      !itemName ||
      !itemCategory ||
      !defaultCostPrice ||
      !defaultRetailPrice ||
      !specifications ||
      !brand ||
      !genericName ||
      !bigUnit ||
      !smallUnit ||
      !conversionFactor ||
      !defaultDosage
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
        itemGroup: "Medicine",
        brand,
        genericName,
        defaultDosage,
        defaultCostPrice: parseFloat(defaultCostPrice),
        defaultRetailPrice: parseFloat(defaultRetailPrice),
        specifications,
        unitOfMeasure: {
          bigUnit,
          smallUnit,
          conversionFactor: parseInt(conversionFactor),
        },
        createdAt: new Date().toISOString(),
      };

      await set(inventoryRef, inventoryData);
      alert("Medicine item added successfully!");
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
    setBrand("");
    setGenericName("");
    setItemCategory("");
    setBigUnit("");
    setSmallUnit("");
    setConversionFactor("");
    setDefaultDosage("");
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
      complete: (results) => {
        setCsvData(results.data);
      },
    });
  };

  const handleBulkSubmit = async () => {
    if (!csvData.length) {
      alert("Please upload a valid CSV.");
      return;
    }

    setLoading(true);
    try {
      for (const row of csvData) {
        const key = generateRandomKey(20);
        const data = {
          itemName: row.itemName || "",
          itemCategory: row.itemCategory || "",
          itemGroup: "Medicine",
          brand: row.brand || "",
          genericName: row.genericName || "",
          defaultDosage: row.defaultDosage || "",
          defaultCostPrice: parseFloat(row.defaultCostPrice || 0),
          defaultRetailPrice: parseFloat(row.defaultRetailPrice || 0),
          specifications: row.specifications || "",
          unitOfMeasure: {
            bigUnit: row.bigUnit || "",
            smallUnit: row.smallUnit || "",
            conversionFactor: parseInt(row.conversionFactor || 1),
          },
          createdAt: new Date().toISOString(),
        };

        await set(ref(database, `inventoryItems/${key}`), data);
      }

      alert("Bulk medicine upload successful!");
      setCsvData([]);
      toggleModal();
    } catch (error) {
      console.error("CSV Upload Error:", error);
      alert("There was an error during CSV upload.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleDownloadSampleCSV = () => {
    const headers = [
      "itemName",
      "itemCategory",
      "brand",
      "genericName",
      "bigUnit",
      "smallUnit",
      "conversionFactor",
      "defaultDosage",
      "defaultCostPrice",
      "defaultRetailPrice",
      "specifications",
    ];

    const sampleRow = {
      itemName: "Paracetamol",
      itemCategory: "Tablets and Capsules",
      brand: "Biogesic",
      genericName: "Paracetamol",
      bigUnit: "Box",
      smallUnit: "Tablet",
      conversionFactor: 10,
      defaultDosage: "500mg",
      defaultCostPrice: 2.5,
      defaultRetailPrice: 5,
      specifications: "Used for fever and pain",
    };

    const csvContent =
      headers.join(",") + "\n" + headers.map((h) => sampleRow[h]).join(",");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = "medicine_sample_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative">
        <button
          className="absolute top-4 left-4 text-sm text-blue-600 underline"
          onClick={() => setIsBulkMode(!isBulkMode)}
        >
          {isBulkMode ? "Switch to Manual Entry" : "Bulk Upload via CSV"}
        </button>

        <h2 className="text-2xl font-bold mb-4 text-center">Add Medicine</h2>

        {!isBulkMode ? (
          <>
            <div className="grid grid-cols-2 gap-4">
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
                <option value="Nebules and Sprays">Nebules and Sprays</option>
                <option value="Tablets and Capsules">
                  Tablets and Capsules
                </option>
                <option value="Syrup, Suspension and Drops">
                  Syrup, Suspension and Drops
                </option>
                <option value="Creams and Ointments">
                  Creams and Ointments
                </option>
                <option value="Ampoules and Vials">Ampoules and Vials</option>
                <option value="Eye and Ear Preparation">
                  Eye and Ear Preparation
                </option>
                <option value="I.V Fluids">I.V Fluids</option>
                <option value="Suppositories">Suppositories</option>
                <option value="Oxygen">Oxygen</option>
              </select>
              <input
                type="text"
                placeholder="Brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="border p-2 rounded"
              />
              <input
                type="text"
                placeholder="Generic Name"
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
                className="border p-2 rounded"
              />
              <input
                type="text"
                placeholder="Big Unit"
                value={bigUnit}
                onChange={(e) => setBigUnit(e.target.value)}
                className="border p-2 rounded"
              />
              <input
                type="text"
                placeholder="Small Unit"
                value={smallUnit}
                onChange={(e) => setSmallUnit(e.target.value)}
                className="border p-2 rounded"
              />
              <input
                type="number"
                placeholder="Conversion Factor"
                value={conversionFactor}
                onChange={(e) => setConversionFactor(e.target.value)}
                className="border p-2 rounded"
              />
              <input
                type="text"
                placeholder="Default Dosage (e.g. 200mg)"
                value={defaultDosage}
                onChange={(e) => setDefaultDosage(e.target.value)}
                className="border p-2 rounded"
              />
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

export default AddMedicineModal;

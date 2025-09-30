import React, { useState, useEffect } from "react";
import { get, ref, set } from "firebase/database";
import { database } from "../../firebase/firebase";
import Papa from "papaparse";
import { X, Upload, Download, Package, Plus } from "lucide-react";

const generateRandomKey = (length = 20) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join("");
};

function AddSupplyModal({ isOpen, toggleModal, onSuccess }) {
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [defaultCostPrice, setDefaultCostPrice] = useState("");
  const [defaultRetailPrice, setDefaultRetailPrice] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [loading, setLoading] = useState(false);

  // Bulk Upload
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const snapshot = await get(ref(database, "suppliers"));
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

    if (isOpen) {
      fetchSuppliers();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!itemName || !itemCategory || !defaultCostPrice || !defaultRetailPrice || !specifications) {
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
        supplierName: selectedSupplier || "",
        createdAt: new Date().toISOString(),
      };

      await set(inventoryRef, inventoryData);
      
      // Clear form and trigger success callback
      clearForm();
      if (onSuccess) {
        onSuccess(itemName);
      }
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
    setSelectedSupplier("");
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

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          setCsvData(results.data);
        },
      });
    }
  };

  const handleBulkSubmit = async () => {
    if (csvData.length === 0) {
      alert("No CSV data to upload.");
      return;
    }

    // Validate headers
    const requiredHeaders = ["itemName", "itemCategory", "defaultCostPrice", "defaultRetailPrice", "specifications", "supplierName"];
    const csvHeaders = Object.keys(csvData[0]);
    const missingHeaders = requiredHeaders.filter((h) => !csvHeaders.includes(h));
    if (missingHeaders.length > 0) {
      alert(`Missing required columns in CSV: ${missingHeaders.join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      let successCount = 0;
      for (let row of csvData) {
        const key = generateRandomKey(20);
        const supplierExists = suppliers.some((s) => s.name === row.supplierName?.trim());

        const data = {
          itemName: (row.itemName || "").trim(),
          itemCategory: (row.itemCategory || "").trim(),
          itemGroup: "Supply",
          defaultCostPrice: parseFloat(row.defaultCostPrice || 0),
          defaultRetailPrice: parseFloat(row.defaultRetailPrice || 0),
          specifications: (row.specifications || "").trim(),
          supplierName: supplierExists ? row.supplierName.trim() : "",
          createdAt: new Date().toISOString(),
        };

        await set(ref(database, `inventoryItems/${key}`), data);
        successCount++;
      }

      setCsvData([]);
      if (onSuccess) {
        onSuccess(`${successCount} supplies`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("There was an error uploading your CSV.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSampleCSV = () => {
    const headers = ["itemName", "itemCategory", "defaultCostPrice", "defaultRetailPrice", "specifications", "supplierName"];
    const exampleSupplier = suppliers.length > 0 ? suppliers[0].name : "Example Supplier";

    const sampleRow = {
      itemName: "Syringe 5ml",
      itemCategory: "Syringes",
      defaultCostPrice: 3.5,
      defaultRetailPrice: 5.0,
      specifications: "Sterile, individually packed",
      supplierName: exampleSupplier,
    };

    const supplierNames = suppliers.map((s) => s.name).join(" | ");
    const notesRow = {
      itemName: "Available suppliers:",
      itemCategory: "",
      defaultCostPrice: "",
      defaultRetailPrice: "",
      specifications: "",
      supplierName: supplierNames,
    };

    const csvContent =
      headers.join(",") +
      "\n" +
      headers.map((h) => sampleRow[h]).join(",") +
      "\n" +
      headers.map((h) => notesRow[h]).join(",");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "supply_sample_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Add Supply Item</h2>
                <p className="text-blue-100 text-sm">
                  {isBulkMode ? "Upload multiple items via CSV" : "Add a single supply item"}
                </p>
              </div>
            </div>
            <button
              onClick={toggleModal}
              className="hover:bg-white/20 p-2 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="mt-4 flex bg-white/10 rounded-xl p-1">
            <button
              onClick={() => setIsBulkMode(false)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                !isBulkMode 
                  ? "bg-white text-blue-700 shadow-sm" 
                  : "text-blue-100 hover:text-white"
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Manual Entry
            </button>
            <button
              onClick={() => setIsBulkMode(true)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                isBulkMode 
                  ? "bg-white text-blue-700 shadow-sm" 
                  : "text-blue-100 hover:text-white"
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Bulk Upload
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {!isBulkMode ? (
            <div className="space-y-6">
              {/* Supplier Selection */}
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Supplier
                </label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="" disabled>Select a supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter item name"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Item Category *
                  </label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="" disabled>Select category</option>
                    <option value="Syringes">Syringes</option>
                    <option value="Cotton and Gauze">Cotton and Gauze</option>
                    <option value="Surgical Tools">Surgical Tools</option>
                    <option value="Bandages and Tape">Bandages and Tape</option>
                    <option value="IV Sets">IV Sets</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Cost Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500">₱</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={defaultCostPrice}
                      onChange={(e) => setDefaultCostPrice(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Retail Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500">₱</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={defaultRetailPrice}
                      onChange={(e) => setDefaultRetailPrice(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Specifications *
                </label>
                <textarea
                  placeholder="Enter item specifications..."
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Download Template */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-900">CSV Template</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Download the template to ensure proper formatting
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadSampleCSV}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Template</span>
                  </button>
                </div>
              </div>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  dragActive
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-300 hover:border-blue-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="space-y-4">
                  <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-700">
                      Drop your CSV file here
                    </p>
                    <p className="text-gray-500 text-sm">
                      or click to browse your files
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="inline-flex items-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    <span>Choose File</span>
                  </label>
                </div>
              </div>

              {/* Preview */}
              {csvData.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h3 className="font-semibold text-green-900 mb-2">
                    Preview ({csvData.length} items)
                  </h3>
                  <div className="text-sm text-green-700">
                    Ready to upload {csvData.length} supply items
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              * Required fields
            </p>
            <div className="flex space-x-3">
              <button
                onClick={toggleModal}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={isBulkMode ? handleBulkSubmit : handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{isBulkMode ? "Uploading..." : "Saving..."}</span>
                  </>
                ) : (
                  <span>{isBulkMode ? "Upload Supplies" : "Save Item"}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddSupplyModal;
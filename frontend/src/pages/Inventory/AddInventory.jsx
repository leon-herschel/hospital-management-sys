import React, { useState } from "react";
import { ref, set } from "firebase/database";
import { database } from "../../firebase/firebase";
import BulkUploadModal from "./BulkUploadModal";

const generateRandomKey = (length = 20) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join("");
};

async function AddInventory({ isOpen, toggleModal }) {
  const [itemName, setItemName] = useState("");
  const [brand, setBrand] = useState("");
  const [genericName, setGenericName] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemGroup, setItemGroup] = useState("");
  const [bigUnit, setBigUnit] = useState("");
  const [smallUnit, setSmallUnit] = useState("");
  const [conversionFactor, setConversionFactor] = useState("");
  const [defaultDosage, setDefaultDosage] = useState("");
  const [defaultCostPrice, setDefaultCostPrice] = useState("");
  const [defaultRetailPrice, setDefaultRetailPrice] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Before saving to Firebase
const maxQuantity = formData.quantity; // initial max quantity is the starting quantity

// Status calculation
let status = "Good";
if (formData.quantity < maxQuantity / 2) {
  status = "Low";
}

await set(newRef, {
  ...formData,
  maxQuantity: maxQuantity,
  status: status,
  createdAt: Date.now(),
});


  const handleSubmit = async () => {
    if (!itemName || !itemCategory || !itemGroup || !defaultCostPrice || !defaultRetailPrice || !specifications) {
      alert("Please fill out all required fields.");
      return;
    }

    if (itemGroup === "Medicine" && (!brand || !genericName || !bigUnit || !smallUnit || !conversionFactor || !defaultDosage)) {
      alert("Please fill out all medicine fields.");
      return;
    }

    try {
      setLoading(true);
      const uniqueKey = generateRandomKey(20);
      const inventoryRef = ref(database, `inventoryItems/${uniqueKey}`);
      const inventoryData = {
        itemName,
        itemCategory,
        itemGroup,
        defaultCostPrice: parseFloat(defaultCostPrice),
        defaultRetailPrice: parseFloat(defaultRetailPrice),
        specifications,
        createdAt: new Date().toISOString(),
      };

      if (itemGroup === "Medicine") {
        inventoryData.brand = brand;
        inventoryData.genericName = genericName;
        inventoryData.defaultDosage = defaultDosage;
        inventoryData.unitOfMeasure = {
          bigUnit,
          smallUnit,
          conversionFactor: parseInt(conversionFactor),
        };
      }

      await set(inventoryRef, inventoryData);
      alert("Inventory item added successfully!");
      clearForm();
      toggleModal();
    } catch (error) {
      console.error("Error adding inventory item:", error);
      alert("Error adding inventory item.");
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setItemName("");
    setBrand("");
    setGenericName("");
    setItemCategory("");
    setItemGroup("");
    setBigUnit("");
    setSmallUnit("");
    setConversionFactor("");
    setDefaultDosage("");
    setDefaultCostPrice("");
    setDefaultRetailPrice("");
    setSpecifications("");
  };

  const downloadCSVTemplate = () => {
    let csvContent = "";
    if (itemGroup === "Medicine") {
      csvContent =
        "itemName,brand,genericName,itemCategory,bigUnit,smallUnit,conversionFactor,defaultDosage,defaultCostPrice,defaultRetailPrice,specifications\n";
    } else {
      csvContent =
        "itemName,itemCategory,defaultCostPrice,defaultRetailPrice,specifications\n";
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      itemGroup === "Medicine" ? "medicine_template.csv" : "supply_template.csv"
    );
    link.click();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
          <h2 className="text-2xl font-bold mb-4 text-center">Add Inventory Item</h2>

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
              <option value="" disabled>Select Item Category</option>
              {itemGroup === "Medicine" ? (
                <>
                  <option value="Nebules and Sprays">Nebules and Sprays</option>
                  <option value="Tablets and Capsules">Tablets and Capsules</option>
                  <option value="Syrup, Suspension and Drops">Syrup, Suspension and Drops</option>
                  <option value="Creams and Ointments">Creams and Ointments</option>
                  <option value="Ampoules and Vials">Ampoules and Vials</option>
                  <option value="Eye and Ear Preparation">Eye and Ear Preparation</option>
                  <option value="I.V Fluids">I.V Fluids</option>
                  <option value="Suppositories">Suppositories</option>
                  <option value="Oxygen">Oxygen</option>
                </>
              ) : (
                <>
                  <option value="Syringes">Syringes</option>
                  <option value="Cotton and Gauze">Cotton and Gauze</option>
                  <option value="Surgical Tools">Surgical Tools</option>
                  <option value="Bandages and Tape">Bandages and Tape</option>
                  <option value="IV Sets">IV Sets</option>
                </>
              )}
            </select>

            <select
              value={itemGroup}
              onChange={(e) => setItemGroup(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="" disabled>Select Item Group</option>
              <option value="Medicine">Medicine</option>
              <option value="Supply">Supply</option>
            </select>

            {itemGroup === "Medicine" && (
              <>
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
              </>
            )}

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

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setShowBulkModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Upload Bulk Items
            </button>
            <div className="flex gap-2">
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
          </div>
        </div>
      </div>

      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-xl relative">
            <button
              onClick={() => setShowBulkModal(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              ✕
            </button>
            <BulkUploadModal
              isOpen={showBulkModal}
              toggleModal={() => setShowBulkModal(false)}
              itemGroup={itemGroup}
            />
            <div className="mt-4 text-center">
              <button
                onClick={downloadCSVTemplate}
                className="mt-2 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
              >
                Download CSV Template
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AddInventory;

import React, { useState } from "react";
import { ref, set } from "firebase/database";
import { database } from "../../firebase/firebase";

// Helper function to generate a random alphanumeric key
const generateRandomKey = (length = 20) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join("");
};

function AddInventory({ isOpen, toggleModal }) {
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

  const handleSubmit = async () => {
    if (
      !itemName ||
      !brand ||
      !genericName ||
      !itemCategory ||
      !itemGroup ||
      !bigUnit ||
      !smallUnit ||
      !conversionFactor ||
      !defaultDosage ||
      !defaultCostPrice ||
      !defaultRetailPrice ||
      !specifications
    ) {
      alert("Please fill out all fields.");
      return;
    }

    try {
      setLoading(true);
      const uniqueKey = generateRandomKey(20);
      const inventoryRef = ref(database, `inventoryItems/${uniqueKey}`);
      const inventoryData = {
        itemName,
        brand,
        genericName,
        itemCategory,
        itemGroup,
        unitOfMeasure: {
          bigUnit,
          smallUnit,
          conversionFactor: parseInt(conversionFactor),
        },
        defaultDosage,
        defaultCostPrice: parseFloat(defaultCostPrice),
        defaultRetailPrice: parseFloat(defaultRetailPrice),
        specifications,
        createdAt: new Date().toISOString(),
      };

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

  if (!isOpen) return null;

  return (
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

          {/* Item Category as dropdown */}
          <select
            value={itemCategory}
            onChange={(e) => setItemCategory(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="" disabled>Select Item Category</option>
            <option value="Nebules and Sprays">Nebules and Sprays</option>
            <option value="Tablets and Capsules">Tablets and Capsules</option>
            <option value="Syrup, Suspension and Drops">Syrup, Suspension and Drops</option>
            <option value="Creams and Ointments">Creams and Ointments</option>
            <option value="Ampoules and Vials">Ampoules and Vials</option>
            <option value="Eye and Ear Preparation">Eye and Ear Preparation</option>
            <option value="I.V Fluids">I.V Fluids</option>
            <option value="Suppositories">Suppositories</option>
            <option value="Oxygen">Oxygen</option>
          </select>

          {/* Item Group dropdown (Medicine/Supply only) */}
          <select
            value={itemGroup}
            onChange={(e) => setItemGroup(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="" disabled>Select Item Group</option>
            <option value="Medicine">Medicine</option>
            <option value="Supply">Supply</option>
          </select>

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
            placeholder="Default Cost Price"
            value={defaultCostPrice}
            onChange={(e) => setDefaultCostPrice(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="number"
            placeholder="Default Retail Price"
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

        <div className="flex justify-end mt-6 space-x-4">
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
  );
}

export default AddInventory;

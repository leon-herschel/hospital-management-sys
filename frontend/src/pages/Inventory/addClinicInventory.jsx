import React, { useState, useEffect } from "react";
import { ref, onValue, set, get } from "firebase/database";
import { getAuth } from "firebase/auth";
import { database } from "../../firebase/firebase";

function AddClinicInventory() {
  const [clinicId, setClinicId] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch all inventory items
    const inventoryRef = ref(database, "inventoryItems");
    onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val() || {};
      const items = Object.entries(data).map(([id, details]) => ({
        id,
        name: details.itemName,
      }));
      setInventoryItems(items);
    });

    // Fetch logged-in user and clinic affiliation
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const userRef = ref(database, `users/${user.uid}`);
      get(userRef).then((snapshot) => {
        const userData = snapshot.val();
        if (userData?.clinicAffiliation) {
          setClinicId(userData.clinicAffiliation);

          // Also fetch the clinic name for display
          const clinicRef = ref(database, `clinics/${userData.clinicAffiliation}`);
          get(clinicRef).then((clinicSnap) => {
            const clinicData = clinicSnap.val();
            if (clinicData?.name) {
              setClinicName(clinicData.name);
            }
          });
        }
      });
    }
  }, []);

  const handleSubmit = async () => {
    if (!clinicId || !selectedItemId || !quantity) {
      alert("Please complete all required fields.");
      return;
    }

    const itemRef = ref(
      database,
      `clinicInventoryStock/${clinicId}/${selectedItemId}`
    );

    const payload = {
      quantity: parseInt(quantity),
      lastUpdated: new Date().toISOString(),
      status: "Good", // Placeholder — you’ll apply threshold logic later
      departmentStock: {}, // Placeholder — used for future stock transfer feature
    };

    setLoading(true);
    try {
      await set(itemRef, payload);
      alert("Clinic inventory added successfully.");
      setSelectedItemId("");
      setQuantity("");
    } catch (error) {
      console.error(error);
      alert("Failed to save clinic inventory.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-center">
        Add Clinic Inventory
      </h2>

      {/* Display clinic name in disabled select */}
      <label className="block text-sm font-medium mb-1">Clinic</label>
      <select
        value={clinicId}
        disabled
        className="w-full p-2 mb-4 border rounded bg-gray-100 cursor-not-allowed"
      >
        <option value={clinicId}>{clinicName || "Loading..."}</option>
      </select>

      {/* Searchable inventory input */}
      <label className="block text-sm font-medium mb-1">Inventory Item</label>
      <input
        list="inventory-options"
        placeholder="Type or select inventory item"
        className="w-full p-2 mb-4 border rounded"
        onChange={(e) => {
          const selected = inventoryItems.find(item => item.name === e.target.value);
          setSelectedItemId(selected ? selected.id : "");
        }}
      />
      <datalist id="inventory-options">
        {inventoryItems.map((item) => (
          <option key={item.id} value={item.name} />
        ))}
      </datalist>

      {/* Quantity input */}
      <input
        type="number"
        placeholder="Total Quantity"
        className="w-full p-2 mb-4 border rounded"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded mt-4"
        disabled={loading}
      >
        {loading ? "Saving..." : "Add to Clinic Inventory"}
      </button>
    </div>
  );
}

export default AddClinicInventory;

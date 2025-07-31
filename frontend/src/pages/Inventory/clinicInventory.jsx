import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";
import QRCode from "react-qr-code";
import AddClinicInventory from "./addClinicInventory";

function ClinicInventory() {
  const [inventory, setInventory] = useState([]);
  const [inventoryNames, setInventoryNames] = useState({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const toggleModal = () => setIsAddModalOpen(!isAddModalOpen);

  useEffect(() => {
    // Fetch inventory item names
    const inventoryRef = ref(database, "inventoryItems");
    onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val() || {};
      const nameMap = {};
      Object.entries(data).forEach(([id, details]) => {
        nameMap[id] = details.itemName;
      });
      setInventoryNames(nameMap);
    });

    // Fetch all clinic inventory
    const clinicInventoryRef = ref(database, "clinicInventoryStock");
    onValue(clinicInventoryRef, (snapshot) => {
      const data = snapshot.val() || {};
      const formattedData = [];

      Object.entries(data).forEach(([clinicId, clinicItems]) => {
        Object.entries(clinicItems).forEach(([itemId, itemDetails]) => {
          formattedData.push({
            clinicId,
            itemId,
            ...itemDetails,
          });
        });
      });

      setInventory(formattedData);
    });
  }, []);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Clinic Inventory</h2>
        <button
          onClick={toggleModal}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Item to Clinic Inventory
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-md shadow-md">
        <table className="w-full border text-center">
          <thead className="bg-slate-200">
            <tr>
              <th className="px-4 py-2">Item Name</th>
              <th className="px-4 py-2">Quantity</th>
              <th className="px-4 py-2">Last Updated</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">QR Code</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length > 0 ? (
              inventory.map((item) => (
                <tr key={`${item.clinicId}-${item.itemId}`} className="border-t">
                  <td className="px-4 py-2">
                    {inventoryNames[item.itemId] || item.itemId}
                  </td>
                  <td className="px-4 py-2">{item.quantity}</td>
                  <td className="px-4 py-2">{item.lastUpdated}</td>
                  <td className="px-4 py-2">{item.status}</td>
                  <td className="px-4 py-2">
                    <QRCode value={item.itemId} size={50} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-4">
                  No clinic inventory data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl relative">
            <button
              onClick={toggleModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              ✕
            </button>
            <AddClinicInventory />
          </div>
        </div>
      )}
    </div>
  );
}

export default ClinicInventory;

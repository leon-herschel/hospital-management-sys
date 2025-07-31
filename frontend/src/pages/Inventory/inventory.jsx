import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";
import AddInventory from "./AddInventory";
import QRCode from "react-qr-code";
import ViewMedicineModal from "./ViewMedicineModal";
import { TrashIcon, PencilSquareIcon, EyeIcon } from "@heroicons/react/24/outline";

const Inventory = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedTab, setSelectedTab] = useState("Medicine");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    const inventoryRef = ref(database, "inventoryItems");
    const unsubscribe = onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const items = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        setInventoryItems(items);
      }
    });

    return () => unsubscribe();
  }, []);

  const filteredItems = inventoryItems.filter(
    (item) =>
      item.itemGroup === selectedTab &&
      item.itemName.toLowerCase().includes(search.toLowerCase())
  );

  const toggleModal = () => {
    setShowAddModal(!showAddModal);
  };

  const handleView = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  return (
    <div className="w-full">
      {/* Tab and Search */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedTab("Medicine")}
            className={`px-6 py-2 rounded-md ${
              selectedTab === "Medicine"
                ? "bg-slate-900 text-white font-bold"
                : "bg-slate-200 text-gray-900"
            }`}
          >
            Medicine
          </button>
          <button
            onClick={() => setSelectedTab("Supply")}
            className={`px-6 py-2 rounded-md ${
              selectedTab === "Supply"
                ? "bg-slate-900 text-white font-bold"
                : "bg-slate-200 text-gray-900"
            }`}
          >
            Supply
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search by item name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-slate-300 px-4 py-2 rounded-md"
          />
          <button
            onClick={toggleModal}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
          >
            Add New Item
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto rounded-md shadow-sm">
        <table className="w-full text-sm text-center border border-slate-200">
          <thead className="bg-slate-200 text-gray-700">
            <tr>
              <th className="px-4 py-2">Item Name</th>
              <th className="px-4 py-2">Brand</th>
              <th className="px-4 py-2">QR Code</th>
              <th className="px-4 py-2">Quantity</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-4 text-center">
                  No items found.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className="bg-white border-t hover:bg-slate-100"
                >
                  <td className="px-4 py-2">{item.itemName}</td>
                  <td className="px-4 py-2">{item.brand || "-"}</td>
                  <td className="px-4 py-2 flex justify-center">
                    <QRCode value={item.id} size={50} />
                  </td>
                  <td className="px-4 py-2">{item.quantity || 0}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded-md flex items-center space-x-1"
                        onClick={() => handleView(item)}
                      >
                        <EyeIcon className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md flex items-center space-x-1">
                        <PencilSquareIcon className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md flex items-center space-x-1">
                        <TrashIcon className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AddInventory isOpen={showAddModal} toggleModal={toggleModal} />
      {showViewModal && selectedItem && (
        <ViewMedicineModal
          item={selectedItem}
          onClose={() => setShowViewModal(false)}
        />
      )}
    </div>
  );
};

export default Inventory;

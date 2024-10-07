import { useState, useEffect } from "react";
import { ref, onValue, remove, update } from "firebase/database";
import { database } from "../../firebase/firebase";
import QRCode from "react-qr-code";

function IcuLocalInventory() {
  const [localSuppliesList, setLocalSuppliesList] = useState([]);
  const [localMedsList, setLocalMedsList] = useState([]);
  const [selectedTab, setSelectedTab] = useState("localSupplies"); // State for selected tab
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // References to the ICU localSupplies and localMeds in the database
  const localSuppliesCollection = ref(database, "departments/ICU/localSupplies");
  const localMedsCollection = ref(database, "departments/ICU/localMeds");

  const toggleEditModal = () => setEditModal(!editModal);
  const toggleDeleteModal = () => setDeleteModal(!deleteModal);

  const handleEdit = (item) => {
    setCurrentItem(item);
    toggleEditModal();
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    const { itemName, quantity, retailPrice, costPrice } = event.target.elements;

    const updatedSupply = {
      itemName: itemName.value,
      quantity: Number(quantity.value),
      retailPrice: Number(retailPrice.value),
      costPrice: Number(costPrice.value),
    };

    // Update the item in the local supplies or meds based on the selected tab
    await update(ref(database, `departments/ICU/${selectedTab}/${currentItem.itemKey}`), updatedSupply);
    toggleEditModal();
  };

  useEffect(() => {
    // Fetch the data from "departments/ICU/localSupplies"
    const unsubscribeSupplies = onValue(localSuppliesCollection, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const suppliesData = Object.keys(data).map((key) => ({
          ...data[key],
          itemKey: key,
        }));
        suppliesData.sort((a, b) => a.itemName.localeCompare(b.itemName));
        setLocalSuppliesList(suppliesData);
      } else {
        setLocalSuppliesList([]);
      }
    });

    // Fetch the data from "departments/ICU/localMeds"
    const unsubscribeMeds = onValue(localMedsCollection, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const medsData = Object.keys(data).map((key) => ({
          ...data[key],
          itemKey: key,
        }));
        medsData.sort((a, b) => a.itemName.localeCompare(b.itemName));
        setLocalMedsList(medsData);
      } else {
        setLocalMedsList([]);
      }
    });

    return () => {
      unsubscribeSupplies();
      unsubscribeMeds();
    };
  }, []);

  const confirmDelete = (item) => {
    setCurrentItem(item);
    toggleDeleteModal();
  };

  const handleDelete = async () => {
    await remove(ref(database, `departments/ICU/${selectedTab}/${currentItem.itemKey}`));
    toggleDeleteModal();
  };

  const filteredList =
    selectedTab === "localSupplies"
      ? localSuppliesList.filter((item) =>
          item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : localMedsList.filter((item) =>
          item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
        );

  return (
    <div className="w-full">
      <div className="flex justify-between items-center">
        <div className="flex">
          <button
            onClick={() => setSelectedTab("localMeds")}
            className={`space-x-4 px-6 py-2 rounded-md transition duration-200 ${
              selectedTab === "localMeds"
                ? "bg-slate-900 text-white font-bold"
                : "bg-slate-200 text-gray-900"
            }`}
          >
            Medicine Inventory
          </button>
          <button
            onClick={() => setSelectedTab("localSupplies")}
            className={`space-x-4 px-6 py-2 rounded-md transition duration-200 ${
              selectedTab === "localSupplies"
                ? "bg-slate-900 text-white font-bold"
                : "bg-slate-200 text-gray-900"
            }`}
          >
            Supplies Inventory
          </button>
        </div>
        <div>
          <input
            type="text"
            placeholder="Search by item name..."
            className="border px-4 py-2 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="relative overflow-x-auto rounded-md shadow-sm mt-4">
        <table className="w-full text-md text-gray-900 text-center border">
          <thead className="bg-slate-200">
            <tr>
              <th className="px-6 py-3">Item Name</th>
              <th className="px-6 py-3">Quantity</th>
              <th className="px-6 py-3">Cost Price (₱)</th>
              <th className="px-6 py-3">Retail Price (₱)</th>
              <th className="px-6 py-3">QR Code</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length > 0 ? (
              filteredList.map((item) => (
                <tr key={item.itemKey} className="bg-white border-b">
                  <td className="px-6 py-3">{item.itemName}</td>
                  <td className="px-6 py-3">{item.quantity}</td>
                  <td className="px-6 py-3">{item.costPrice.toFixed(2)}</td>
                  <td className="px-6 py-3">{item.retailPrice.toFixed(2)}</td>
                  <td className="px-6 py-3">
                    <QRCode size={50} value={item.itemKey} />
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => handleEdit(item)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDelete(item)}
                      className="ml-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-3">No items available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 sm:w-2/3 md:w-1/2 lg:w-1/3">
            <h2 className="text-lg font-bold mb-4">Edit Item</h2>
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label className="block mb-2">Item Name</label>
                <input
                  type="text"
                  name="itemName"
                  defaultValue={currentItem?.itemName || ""}
                  className="border px-4 py-2 w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  defaultValue={currentItem?.quantity || ""}
                  className="border px-4 py-2 w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Cost Price (₱)</label>
                <input
                  type="number"
                  name="costPrice"
                  defaultValue={currentItem?.costPrice || ""}
                  className="border px-4 py-2 w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Retail Price (₱)</label>
                <input
                  type="number"
                  name="retailPrice"
                  defaultValue={currentItem?.retailPrice || ""}
                  className="border px-4 py-2 w-full"
                  required
                />
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={toggleEditModal}
                  className="mr-2 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 sm:w-2/3 md:w-1/2 lg:w-1/3">
            <h2 className="text-lg font-bold mb-4">Delete Item</h2>
            <p>Are you sure you want to delete "{currentItem?.itemName}"?</p>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={toggleDeleteModal}
                className="mr-2 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IcuLocalInventory;

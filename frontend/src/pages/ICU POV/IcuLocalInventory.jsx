import { useState, useEffect } from "react";
import { ref, onValue, remove, update } from "firebase/database";
import { database } from "../../firebase/firebase";
import QRCode from "react-qr-code";

const calculateStatus = (quantity, maxQuantity) => {
  const percentage = (quantity / maxQuantity) * 100;
  if (percentage > 70) {
    return "Good";
  } else if (percentage > 50) {
    return "Low";
  } else {
    return "Very Low";
  }
};

function IcuLocalInventory() {
  const [localSuppliesList, setLocalSuppliesList] = useState([]);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Reference to the ICU localSupplies in the database
  const localSuppliesCollection = ref(database, "departments/ICU/localSupplies");

  const toggleEditModal = () => setEditModal(!editModal);
  const toggleDeleteModal = () => setDeleteModal(!deleteModal);

  const handleEdit = (item) => {
    setCurrentItem(item);
    toggleEditModal();
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    const { itemName, quantity, retailPrice, costPrice } = event.target.elements;

    const updatedQuantity = Number(quantity.value);
    const maxQuantity = currentItem.maxQuantity || updatedQuantity;
    const updatedStatus = calculateStatus(updatedQuantity, maxQuantity);

    const updatedSupply = {
      itemName: itemName.value,
      quantity: updatedQuantity,
      maxQuantity,
      retailPrice: Number(retailPrice.value),
      costPrice: Number(costPrice.value),
      status: updatedStatus,
    };

    // Update the item in the local supplies
    await update(ref(database, `departments/ICU/localSupplies/${currentItem.itemKey}`), updatedSupply);
    toggleEditModal();
  };

  useEffect(() => {
    // Fetch the data from "departments/ICU/localSupplies"
    const unsubscribe = onValue(localSuppliesCollection, (snapshot) => {
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

    return () => unsubscribe();
  }, []);

  const confirmDelete = (item) => {
    setCurrentItem(item);
    toggleDeleteModal();
  };

  const handleDelete = async () => {
    await remove(ref(database, `departments/ICU/localSupplies/${currentItem.itemKey}`));
    toggleDeleteModal();
  };

  const filteredList = localSuppliesList.filter((item) =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="flex justify-between items-center">
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
              <th className="px-6 py-3">Status</th>
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
                  <td className="px-6 py-3">{item.status}</td>
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
                <td colSpan="7" className="px-6 py-3">No supplies available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 sm:w-2/3 md:w-1/2 lg:w-1/3">
            <h2 className="text-lg font-bold mb-4">Edit Supply Item</h2>
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
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={toggleEditModal}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200 mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
                >
                  Update Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 sm:w-2/3 md:w-1/2 lg:w-1/3">
            <h2 className="text-lg font-bold mb-4">Delete Confirmation</h2>
            <p>Are you sure you want to delete this item?</p>
            <div className="flex justify-end mt-4">
              <button
                onClick={toggleDeleteModal}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200 mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IcuLocalInventory;

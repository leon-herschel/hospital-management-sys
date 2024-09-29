import { useState, useEffect } from "react";
import { ref, onValue, remove, update } from "firebase/database";
import { database } from "../../firebase/firebase";
import AddInventory from "./AddInventory";
import AddSupply from "./AddSupplies";
import QRCode from "react-qr-code";
import Notification from "./Notification";

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

function Inventory() {
  const [inventoryList, setInventoryList] = useState([]);
  const [suppliesList, setSuppliesList] = useState([]);
  const [modal, setModal] = useState(false);
  const [supplyModal, setSupplyModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false); // New state for delete confirmation
  const [currentItem, setCurrentItem] = useState(null);
  const [selectedTab, setSelectedTab] = useState("medicine");
  const [searchTerm, setSearchTerm] = useState("");

  const inventoryCollection = ref(database, "medicine");
  const suppliesCollection = ref(database, "supplies");

  const toggleModal = () => {
    setModal(!modal);
  };

  const toggleSupplyModal = () => {
    setSupplyModal(!supplyModal);
  };

  const toggleEditModal = () => {
    setEditModal(!editModal);
  };

  const toggleDeleteModal = () => {
    setDeleteModal(!deleteModal);
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    toggleEditModal();
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    const { itemName, quantity, retailPrice, costPrice } =
      event.target.elements;

    const updatedQuantity = Number(quantity.value);
    const maxQuantity = currentItem.maxQuantity || updatedQuantity;
    const updatedStatus = calculateStatus(updatedQuantity, maxQuantity);

    const updatedInventory = {
      itemName: itemName.value,
      quantity: updatedQuantity,
      maxQuantity: maxQuantity,
      retailPrice: Number(retailPrice.value), // Updated retail price field
      costPrice: Number(costPrice.value), // Updated cost price field
      status: updatedStatus,
    };

    await update(
      ref(database, `${selectedTab}/${currentItem.id}`),
      updatedInventory
    );
    toggleEditModal();
  };

  const handleUpdateSupply = async (event) => {
    event.preventDefault();
    const { itemName, quantity, retailPrice, costPrice } =
      event.target.elements;

    const updatedQuantity = Number(quantity.value);
    const maxQuantity = currentItem.maxQuantity || updatedQuantity;
    const updatedStatus = calculateStatus(updatedQuantity, maxQuantity);

    const updatedSupply = {
      itemName: itemName.value,
      quantity: updatedQuantity,
      maxQuantity: maxQuantity,
      retailPrice: Number(retailPrice.value), // Updated retail price field
      costPrice: Number(costPrice.value), // Updated cost price field
      status: updatedStatus,
    };

    await update(
      ref(database, `${selectedTab}/${currentItem.id}`),
      updatedSupply
    );
    toggleEditModal();
  };

  useEffect(() => {
    const unsubscribeInventory = onValue(inventoryCollection, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const inventoryData = Object.keys(data).map((key) => ({
          ...data[key],
          id: key,
        }));
        setInventoryList(inventoryData);
      } else {
        setInventoryList([]);
      }
    });

    const unsubscribeSupplies = onValue(suppliesCollection, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const suppliesData = Object.keys(data).map((key) => ({
          ...data[key],
          id: key,
        }));
        setSuppliesList(suppliesData);
      } else {
        setSuppliesList([]);
      }
    });

    return () => {
      unsubscribeInventory();
      unsubscribeSupplies();
    };
  }, []);

  const confirmDelete = (item) => {
    setCurrentItem(item);
    toggleDeleteModal(); // Open the delete confirmation modal
  };

  const handleDelete = async () => {
    await remove(ref(database, `${selectedTab}/${currentItem.id}`));
    toggleDeleteModal(); // Close the delete confirmation modal after deleting
  };

  const filteredList = (
    selectedTab === "medicine" ? inventoryList : suppliesList
  )

  return (
    <div className="w-full">
      <Notification />
      <div className="flex justify-center text-lg">
        <h2>INVENTORY SYSTEM</h2>
      </div>
      <div className="flex justify-center space-x-4 mb-4">
        <button
          onClick={() => setSelectedTab("medicine")}
          className={`px-8 py-3 rounded-md transition duration-200 ${
            selectedTab === "medicine"
              ? "bg-red-800 text-white text-bold"
              : "bg-gray-200 text-black"
          }`}
        >
          Medicine Inventory
        </button>
        <button
          onClick={() => setSelectedTab("supplies")}
          className={`px-6 py-2 rounded-md transition duration-200 ${
            selectedTab === "supplies"
              ? "bg-red-800 text-white text-bold"
              : "bg-gray-200 text-black"
          }`}
        >
          Supplies Inventory
        </button>
      </div>

      {selectedTab === "medicine" && (
        <>
          <div className="flex justify-between items-center">
            <div className="my-4">
              <input
                type="text"
                placeholder="Search by item name..."
                className="border border-stone-300 px-4 py-2 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={toggleModal}
              className="ml-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
            >
              Add New Medicine Item
            </button>
          </div>
          <div className="relative overflow-x-auto shadow-sm">
            <table className="w-full text-md text-gray-800 text-center border border-stone-200">
              <thead className="text-sm uppercase bg-stone-200">
                <tr>
                  <th className="px-6 py-3">Medicine Name</th>
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
                    <tr
                      key={item.id}
                      className="bg-white border-b hover:bg-stone-100"
                    >
                      <td className="px-6 py-4">{item.itemName}</td>
                      <td className="px-6 py-4">{item.quantity}</td>
                      <td className="px-6 py-4">
                        {(item.costPrice !== undefined
                          ? item.costPrice
                          : 0
                        ).toFixed(2)}{" "}
                      </td>
                      <td className="px-6 py-3">
                        {(item.retailPrice !== undefined
                          ? item.retailPrice
                          : 0
                        ).toFixed(2)}{" "}
                      </td>
                      <td className="px-6 py-4">{item.status}</td>
                      <td className="px-6 py-4 flex justify-center items-center">
                        <QRCode size={50} value={item.id} />
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleEdit(item)}
                          className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(item)} // Ask for delete confirmation
                          className="ml-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-4">
                      No items in inventory
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <AddInventory isOpen={modal} toggleModal={toggleModal} />
        </>
      )}

      {selectedTab === "supplies" && (
        <>
          <div className="flex justify-between items-center">
            <div className="my-4">
              <input
                type="text"
                placeholder="Search by supply name..."
                className="border border-stone-300 px-4 py-2 rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={toggleSupplyModal}
              className="ml-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
            >
              Add Supply Item
            </button>
          </div>
          <table className="w-full text-md text-gray-800 text-center border border-stone-200">
            <thead className="text-sm uppercase bg-stone-200">
              <tr>
                <th className="px-6 py-3">Supply Name</th>
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
                  <tr
                    key={item.id}
                    className="bg-white border-b hover:bg-stone-100"
                  >
                    <td className="px-6 py-3">{item.itemName}</td>
                    <td className="px-6 py-3">{item.quantity}</td>
                    <td className="px-6 py-3">
                      {(item.costPrice !== undefined
                        ? item.costPrice
                        : 0
                      ).toFixed(2)}{" "}
                    </td>
                    <td className="px-6 py-3">
                      {(item.retailPrice !== undefined
                        ? item.retailPrice
                        : 0
                      ).toFixed(2)}{" "}
                    </td>
                    <td className="px-6 py-3">{item.status}</td>
                    <td className="px-6 py-4 flex justify-center items-center">
                      <QRCode size={50} value={item.id} />
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => handleEdit(item)}
                        className="ml-4 bg-blue-600 text-white px-6 py-2 rounded-md"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(item)} // Ask for delete confirmation
                        className="ml-4 bg-red-600 text-white px-6 py-2 rounded-md"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-3">
                    No supplies in inventory
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <AddSupply isOpen={supplyModal} toggleModal={toggleSupplyModal} />
        </>
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
                onClick={handleDelete} // Confirm deletion
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 sm:w-2/3 md:w-1/2 lg:w-1/3">
            <h2 className="text-lg font-bold mb-4">
              Edit {selectedTab === "medicine" ? "Medicine" : "Supply"} Item
            </h2>
            <form
              onSubmit={
                selectedTab === "medicine" ? handleUpdate : handleUpdateSupply
              }
            >
              <div className="mb-4">
                <label className="block mb-2">Medicine Name</label>
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
    </div>
  );
}

export default Inventory; 

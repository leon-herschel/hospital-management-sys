import { useState, useEffect } from "react";
import { ref, onValue, remove, update } from "firebase/database";
import { database } from "../../firebase/firebase";
import AddInventory from "./AddInventory";
import QRCode from "react-qr-code";

// Helper function to calculate status based on percentage
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
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null); // Change to null initially
  const [selectedDepartment, setSelectedDepartment] = useState(""); // State for department filter
  const [selectedStatus, setSelectedStatus] = useState(""); // State for status filter
  const inventoryCollection = ref(database, "inventory");

  const toggleModal = () => {
    setModal(!modal);
  };

  if (modal) {
    document.body.classList.add("active-modal");
  } else {
    document.body.classList.remove("active-modal");
  }

  const toggleEditModal = () => {
    setEditModal(!editModal);
  };

  const handleEdit = (inventory) => {
    setCurrentItem(inventory);
    toggleEditModal();
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    const { itemName, quantity, department } = event.target.elements;

    const updatedQuantity = Number(quantity.value);
    const maxQuantity = currentItem.maxQuantity || updatedQuantity; // If maxQuantity doesn't exist, assume it to be updatedQuantity
    const updatedStatus = calculateStatus(updatedQuantity, maxQuantity);

    const updatedInventory = {
      itemName: itemName.value,
      quantity: updatedQuantity,
      maxQuantity: maxQuantity,
      department: department.value,
      status: updatedStatus, // Dynamically calculated status
    };

    await update(
      ref(database, `inventory/${currentItem.id}`),
      updatedInventory
    );
    toggleEditModal();
  };

  useEffect(() => {
    const unsubscribe = onValue(inventoryCollection, (snapshot) => {
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
    return () => {
      unsubscribe();
    };
  }, [inventoryCollection]);

  useEffect(() => {
    // Filter inventory based on selected department and status
    let filteredList = inventoryList;
    if (selectedDepartment) {
      filteredList = filteredList.filter(
        (item) => item.department === selectedDepartment
      );
    }
    if (selectedStatus) {
      filteredList = filteredList.filter(
        (item) => item.status === selectedStatus
      );
    }
    setFilteredInventory(filteredList);
  }, [inventoryList, selectedDepartment, selectedStatus]);

  const handleDelete = async (id) => {
    await remove(ref(database, `inventory/${id}`));
  };

  return (
    <div className="w-full">
      <div className="flex justify-center text-lg">
        <h2>INVENTORY SYSTEM</h2>
      </div>
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={toggleModal}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
        >
          Add New Item
        </button>

        {/* Department Filter */}
        <select
          className="border rounded p-2"
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
        >
          <option value="">All Departments</option>
          <option value="IT">IT</option>
          <option value="Nursing">Nursing</option>
          <option value="MedTech">Medical Technology</option>
        </select>

        {/* Status Filter */}
        <select
          className="border rounded p-2"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Good">Good</option>
          <option value="Low">Low</option>
          <option value="Very Low">Very Low</option>
        </select>
      </div>
      <table className="min-w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-center">
              Item Name
            </th>
            <th className="border border-gray-300 px-4 py-2 text-center">
              Quantity
            </th>
            <th className="border border-gray-300 px-4 py-2 text-center">
              Department
            </th>
            <th className="border border-gray-300 px-4 py-2 text-center">
              Status
            </th>
            <th className="border border-gray-300 px-4 py-2 text-center">
              QR Code
            </th>
            <th className="border border-gray-300 px-4 py-2 text-center">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredInventory.length > 0 ? (
            filteredInventory.map((inventory) => (
              <tr key={inventory.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {inventory.itemName}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {inventory.quantity}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {inventory.department}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {inventory.status}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  <QRCode
                    size={50}
                    bgColor="white"
                    fgColor="black"
                    value={`Item: ${inventory.itemName}\nQuantity: ${inventory.quantity}\nDepartment: ${inventory.department}\nStatus: ${inventory.status}`}
                  />
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  <button
                    onClick={() => handleEdit(inventory)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition duration-200"
                  >
                    Edit
                  </button>{" "}
                  
                  <button
                    onClick={() => handleDelete(inventory.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200 ml-2"
                  >
                    DELETE
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="6"
                className="border border-gray-300 px-4 py-2 text-center"
              >
                No items in inventory
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {editModal && currentItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <form onSubmit={handleUpdate}>
              <h2 className="text-2xl font-bold mb-6 text-center">Edit Item</h2>

              <div className="mb-4">
                <label htmlFor="itemName" className="block text-gray-700 mb-2">
                  Item Name
                </label>
                <input
                  type="text"
                  id="itemName"
                  name="itemName"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                  defaultValue={currentItem.itemName}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="quantity" className="block text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                  defaultValue={currentItem.quantity}
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="department"
                  className="block text-gray-700 mb-2"
                >
                  Department
                </label>
                <select
                  id="department"
                  name="department"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                  defaultValue={currentItem.department}
                >
                  <option value="" disabled>
                    Select Department
                  </option>
                  <option value="IT">IT</option>
                  <option value="Nursing">Nursing</option>
                  <option value="MedTech">Medical Technology</option>
                </select>
              </div>

              <div className="flex justify-between space-x-4">
                <div className="w-full">
                  <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
                  >
                    Update
                  </button>
                </div>

                <div className="w-full">
                  <button
                    type="button"
                    onClick={toggleEditModal}
                    className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      <AddInventory isOpen={modal} toggleModal={toggleModal} />
    </div>
  );
}

export default Inventory;

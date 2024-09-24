import { useState, useEffect } from "react";
import { ref, onValue, remove, update } from "firebase/database";
import { database } from "../../firebase/firebase";
import AddInventory from "./AddInventory";
import AddSupply from "./AddSupplies";
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
  const [suppliesList, setSuppliesList] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [modal, setModal] = useState(false);
  const [supplyModal, setSupplyModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [viewMode, setViewMode] = useState("medicine"); // State to manage view mode

  // References for inventory and supplies nodes
  const inventoryCollection = ref(database, "inventory");

  const toggleModal = () => {
    setModal(!modal);
  };

  const toggleSupplyModal = () => {
    setSupplyModal(!supplyModal);
  };

  const toggleEditModal = () => {
    setEditModal(!editModal);
  };

  const handleEdit = (inventory) => {
    setCurrentItem(inventory);
    toggleEditModal();
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    const { itemName, quantity, department, category } = event.target.elements;

    const updatedQuantity = Number(quantity.value);
    const maxQuantity = currentItem.maxQuantity || updatedQuantity;
    const updatedStatus = calculateStatus(updatedQuantity, maxQuantity);

    // Create a common updated item object
    const updatedItem = {
      quantity: updatedQuantity,
      maxQuantity: maxQuantity,
      category: category.value,
      status: updatedStatus,
    };

    // Add itemName/supplyName and department fields conditionally based on view mode
    if (viewMode === "medicine") {
      updatedItem.itemName = itemName.value;
      updatedItem.department = department.value;
    } else if (viewMode === "supply") {
      updatedItem.supplyName = itemName.value;
    }

    const itemPath = `${viewMode}/${currentItem.id}`;
    console.log("Updating path:", itemPath);
    console.log("Updating data:", updatedItem);

    try {
      await update(ref(database, itemPath), updatedItem);
      console.log("Item updated successfully in the database.");
      
      // Update state to reflect changes in the UI
      setFilteredInventory((prev) =>
        prev.map((item) =>
          item.id === currentItem.id ? { ...item, ...updatedItem } : item
        )
      );
    } catch (error) {
      console.error("Error updating item:", error);
    }

    toggleEditModal();
  };

  useEffect(() => {
    // Fetch inventory data
    const unsubscribeInventory = onValue(inventoryCollection, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const inventoryData = Object.keys(data).map((key) => ({
          ...data[key],
          id: key,
          category: "Medicine",
        }));
        setInventoryList(inventoryData);
      } else {
        setInventoryList([]);
      }
    });

    // Fetch supplies data
    const unsubscribeSupplies = onValue(suppliesCollection, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const suppliesData = Object.keys(data).map((key) => ({
          ...data[key],
          id: key,
          category: "Supply",
          supplyName: data[key].supplyName || "", // Ensure supplyName is available
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
  }, [inventoryCollection, suppliesCollection]);

  useEffect(() => {
    let filteredList = [];
    if (viewMode === "medicine") {
      filteredList = inventoryList;
    } else if (viewMode === "supply") {
      filteredList = suppliesList;
    }
    setFilteredInventory(filteredList);
  }, [inventoryList, suppliesList, viewMode]);

  const handleDelete = async (id, category) => {
    const node = category === "Supply" ? "supplies" : "inventory";
    try {
      await remove(ref(database, `${node}/${id}`));
      console.log(`Item with ID ${id} deleted successfully from ${node}.`);
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const filteredInventoryList = inventoryList.filter((inventory) =>
    inventory.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="flex justify-center text-lg">
        <h2>INVENTORY SYSTEM</h2>
      </div>
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setViewMode("medicine")}
          className={`${
            viewMode === "medicine" ? "bg-blue-500" : "bg-green-500"
          } text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200`}
        >
          View Medicines
        </button>

        <button
          onClick={() => setViewMode("supply")}
          className={`${
            viewMode === "supply" ? "bg-blue-500" : "bg-green-500"
          } text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200`}
        >
          View Supplies
        </button>

        {/* Modal Toggle Buttons */}
        {viewMode === "medicine" ? (
          <button
            onClick={toggleModal}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
          >
            Add New Medicine
          </button>
        ) : (
          <button
            onClick={toggleSupplyModal}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
          >
            Add New Supply Item
          </button>
        )}
      </div>
      
      <div className="my-4">
        <input
          type="text"
          placeholder="Search by item name..."
          className="border px-4 py-2 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <table className="min-w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-center">
              {viewMode === "medicine" ? "Item Name" : "Supply Name"}
            </th>
            <th className="border border-gray-300 px-4 py-2 text-center">
              Quantity
            </th>
            {viewMode === "medicine" && (
              <th className="border border-gray-300 px-4 py-2 text-center">
                Department
              </th>
            )}
            <th className="border border-gray-300 px-4 py-2 text-center">
              Category
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
                  {viewMode === "medicine" ? item.itemName : item.supplyName}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {item.quantity}
                </td>
                {viewMode === "medicine" && (
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {item.department}
                  </td>
                )}
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {item.category}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {item.status}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  <QRCode
                    size={50}
                    bgColor="white"
                    fgColor="black"
                    value={`${
                      viewMode === "medicine" ? "Item: " + item.itemName : "Supply: " + item.supplyName
                    }\nQuantity: ${item.quantity}\n${
                      viewMode === "medicine" ? "Department: " + item.department + "\n" : ""
                    }Category: ${item.category}\nStatus: ${item.status}`}
                  />
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  <button
                    onClick={() => handleEdit(item)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition duration-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.category)}
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
                colSpan={viewMode === "medicine" ? "7" : "6"}
                className="border border-gray-300 px-4 py-2 text-center"
              >
                No items in {viewMode === "medicine" ? "medicine" : "supplies"} inventory
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Edit Modal */}
      {editModal && currentItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <form onSubmit={handleUpdate}>
              <h2 className="text-2xl font-bold mb-6 text-center">Edit Item</h2>

              <div className="mb-4">
                <label htmlFor="itemName" className="block text-gray-700 mb-2">
                  {viewMode === "medicine" ? "Item Name" : "Supply Name"}
                </label>
                <input
                  type="text"
                  id="itemName"
                  name="itemName"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                  defaultValue={viewMode === "medicine" ? currentItem.itemName : currentItem.supplyName}
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

              {viewMode === "medicine" && (
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
              )}

              <div className="mb-4">
                <label htmlFor="category" className="block text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                  defaultValue={currentItem.category}
                >
                  <option value="Medicine">Medicine</option>
                  <option value="Supply">Supply</option>
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

      {/* Modals for Adding New Items */}
      <AddInventory isOpen={modal} toggleModal={toggleModal} />
      <AddSupply isOpen={supplyModal} toggleModal={toggleSupplyModal} />
    </div>
  );
}

export default Inventory;

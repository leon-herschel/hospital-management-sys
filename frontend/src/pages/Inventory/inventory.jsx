import { useState, useEffect } from "react";
import { ref, onValue, remove, update } from "firebase/database";
import { database } from "../../firebase/firebase";
import AddInventory from "./AddInventory";
import AddSupply from "./AddSupplies";
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

function Inventory() {
  const [inventoryList, setInventoryList] = useState([]);
  const [suppliesList, setSuppliesList] = useState([]);
  const [modal, setModal] = useState(false);
  const [supplyModal, setSupplyModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
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

  const handleEdit = (item) => {
    setCurrentItem(item);
    toggleEditModal();
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    const { itemName, quantity, department, retailPrice, costPrice } = event.target.elements;

    const updatedQuantity = Number(quantity.value);
    const maxQuantity = currentItem.maxQuantity || updatedQuantity;
    const updatedStatus = calculateStatus(updatedQuantity, maxQuantity);

    const updatedInventory = {
      itemName: itemName.value,
      quantity: updatedQuantity,
      maxQuantity: maxQuantity,
      department: department.value,
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
    const { itemName, quantity, retailPrice, costPrice } = event.target.elements;

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

    await update(ref(database, `${selectedTab}/${currentItem.id}`), updatedSupply);
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

  const handleDelete = async (id) => {
    await remove(ref(database, `${selectedTab}/${id}`));
  };

  const filteredList = (
    selectedTab === "medicine" ? inventoryList : suppliesList
  ).filter((item) =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="flex justify-center text-lg">
        <h2>INVENTORY SYSTEM</h2>
      </div>
      <div className="flex justify-center space-x-4 mb-4">
        <button
          onClick={() => setSelectedTab("medicine")}
          className={`px-4 py-2 rounded-lg transition duration-200 ${
            selectedTab === "medicine"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-black"
          }`}
        >
          Medicine Inventory
        </button>
        <button
          onClick={() => setSelectedTab("supplies")}
          className={`px-4 py-2 rounded-lg transition duration-200 ${
            selectedTab === "supplies"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-black"
          }`}
        >
          Supplies Inventory
        </button>
      </div>

      {selectedTab === "medicine" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={toggleModal}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
            >
              Add New Medicine Item
            </button>
            <div className="my-4">
              <input
                type="text"
                placeholder="Search by item name..."
                className="border px-4 py-2 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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
                  Cost Price (₱)
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center">
                  Retail Price (₱)
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
              {filteredList.length > 0 ? (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {item.itemName}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {item.quantity}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {item.department}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {(item.costPrice !== undefined ? item.costPrice : 0).toFixed(2)} {/* Fallback to 0 if cost price is undefined */}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {(item.retailPrice !== undefined ? item.retailPrice : 0).toFixed(2)} {/* Fallback to 0 if retail price is undefined */}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {item.status}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <QRCode size={50} value={item.id} /> {/* Display only the unique ID */}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <button
                        onClick={() => handleEdit(item)}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200 ml-2"
                      >
                        DELETE
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="border border-gray-300 px-4 py-2 text-center">
                    No items in inventory
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <AddInventory isOpen={modal} toggleModal={toggleModal} />
        </>
      )}

      {selectedTab === "supplies" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={toggleSupplyModal}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
            >
              Add Supply Item
            </button>
            <div className="my-4">
              <input
                type="text"
                placeholder="Search by supply name..."
                className="border px-4 py-2 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <table className="min-w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-center">
                  Supply Name
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center">
                  Quantity
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center">
                  Cost Price (₱)
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center">
                  Retail Price (₱)
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
              {filteredList.length > 0 ? (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {item.itemName}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {item.quantity}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {(item.costPrice !== undefined ? item.costPrice : 0).toFixed(2)} {/* Fallback to 0 if cost price is undefined */}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {(item.retailPrice !== undefined ? item.retailPrice : 0).toFixed(2)} {/* Fallback to 0 if retail price is undefined */}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {item.status}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <QRCode size={50} value={item.id} /> {/* Display only the unique ID */}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <button
                        onClick={() => handleEdit(item)}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200 ml-2"
                      >
                        DELETE
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="border border-gray-300 px-4 py-2 text-center">
                    No supplies in inventory
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <AddSupply isOpen={supplyModal} toggleModal={toggleSupplyModal} />
        </>
      )}

      {editModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-4">Edit {selectedTab === "medicine" ? "Medicine" : "Supply"} Item</h2>
            <form onSubmit={selectedTab === "medicine" ? handleUpdate : handleUpdateSupply}>
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
              {selectedTab === "medicine" && (
                <div className="mb-4">
                  <label className="block mb-2">Department</label>
                  <input
                    type="text"
                    name="department"
                    defaultValue={currentItem?.department || ""}
                    className="border px-4 py-2 w-full"
                    required
                  />
                </div>
              )}
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

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
    const { itemName, quantity, department } = event.target.elements;

    const updatedQuantity = Number(quantity.value);
    const maxQuantity = currentItem.maxQuantity || updatedQuantity;
    const updatedStatus = calculateStatus(updatedQuantity, maxQuantity);

    const updatedInventory = {
      itemName: itemName.value,
      quantity: updatedQuantity,
      maxQuantity: maxQuantity,
      department: department.value,
      status: updatedStatus,
    };

    await update(
      ref(database, `${selectedTab}/${currentItem.id}`),
      updatedInventory
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
                      {item.status}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <QRCode size={50} value={item.id} />{" "}
                      {/* Display only the unique ID */}
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
                  Brand Name
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center">
                  Quantity
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
                      {item.status}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <QRCode size={50} value={item.id} />{" "}
                      {/* Display only the unique ID */}
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
                  <td
                    colSpan="5"
                    className="border border-gray-300 px-4 py-2 text-center"
                  >
                    No supplies in inventory
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <AddSupply isOpen={supplyModal} toggleModal={toggleSupplyModal} />
        </>
      )}

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
              {selectedTab === "medicine" && (
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
    </div>
  );
}

export default Inventory;

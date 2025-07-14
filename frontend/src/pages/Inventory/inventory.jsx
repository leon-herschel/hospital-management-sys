import { useState, useEffect } from "react";
import { ref, onValue, remove, update } from "firebase/database";
import { database } from "../../firebase/firebase";
import { getAuth } from "firebase/auth";
import AddInventory from "./AddInventory";
import AddSupply from "./AddSupplies";
import QRCode from "react-qr-code";
import Notification from "./Notification";
import AccessDenied from "../ErrorPages/AccessDenied";
import { useAccessControl } from "../../components/roles/accessControl";
import StockInModal from "./StockInModal"; // Import the StockInModal
import { sortByField } from "../../components/reusable/Sorter";

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
  const [deleteModal, setDeleteModal] = useState(false);
  const [stockInModal, setStockInModal] = useState(false); // New state for StockInModal
  const [currentItem, setCurrentItem] = useState(null);
  const [selectedTab, setSelectedTab] = useState("medicine");
  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const permissions = useAccessControl();

  const auth = getAuth();
  const user = auth.currentUser;

  const toggleModal = () => {
    setModal(!modal);
  };

  const toggleSupplyModal = () => {
    setSupplyModal(!supplyModal);
  };

  const toggleEditModal = () => {
    setEditModal(!editModal);
  };

  const toggleStockInModal = () => {
    setStockInModal(!stockInModal);
  };

  const handleStockIn = (item) => {
    setCurrentItem(item); // Set current item for stock in
    toggleStockInModal(); // Open the StockInModal
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
    const {
      shortDesc,
      standardDesc,
      customDesc,
      genericName,
      specifications,
      itemGroup,
      itemCategory,
      examinationType,
      nhipCategory,
      drugAdminGroup,
      smallUnit,
      conversion,
      bigUnit,
      expiryDate,
      quantity
    } = event.target.elements || {};
  
    // Debugging log
    console.log('shortDesc:', shortDesc?.value);
    console.log('quantity:', quantity?.value);
  
    // Check if quantity exists
    if (!quantity) {
      console.error('Quantity input is missing or undefined');
      return; // Early exit to avoid further errors
    }
  
    const updatedQuantity = Number(quantity.value || 0);
    const maxQuantity = currentItem?.maxQuantity || updatedQuantity;
    const updatedStatus = calculateStatus(updatedQuantity, maxQuantity);
  
    const updatedInventory = {
      shortDesc: shortDesc?.value || "",
      quantity: updatedQuantity,
      maxQuantity: maxQuantity,
      standardDesc: standardDesc?.value || "",
      customDesc: customDesc?.value || "",
      genericName: genericName?.value || "",
      specifications: specifications?.value || "",
      itemGroup: itemGroup?.value || "",
      itemCategory: itemCategory?.value || "",
      examinationType: examinationType?.value || "",
      nhipCategory: nhipCategory?.value || "",
      drugAdminGroup: drugAdminGroup?.value || "",
      smallUnit: smallUnit?.value || "",
      conversion: conversion?.value || "",
      bigUnit: bigUnit?.value || "",
      expiryDate: expiryDate?.value || "",
      status: updatedStatus,
    };
  
    const updatePath =
      role === "admin"
        ? `departments/Pharmacy/localMeds/${currentItem.id}`
        : `departments/${department}/localMeds/${currentItem.id}`;
    await update(ref(database, updatePath), updatedInventory);
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
      retailPrice: Number(retailPrice.value),
      costPrice: Number(costPrice.value),
      status: updatedStatus,
    };

    await update(
      ref(
        database,
        `departments/${department}/localSupplies/${currentItem.id}`
      ),
      updatedSupply
    );
    toggleEditModal();
  };

  // Fetch user department
  useEffect(() => {
    if (user) {
      const userDepartmentRef = ref(database, `users/${user.uid}`);
      onValue(
        userDepartmentRef,
        (snapshot) => {
          const departmentData = snapshot.val();
          if (departmentData) {
            setDepartment(departmentData.department);
            setRole(departmentData.role);
            
            // specific controls
            if (departmentData.department === "CSR") {
              setSelectedTab("supplies");
            } else if (departmentData.department === "Pharmacy") {
              setSelectedTab("medicine");
            }
          }
        },
        (error) => {
          console.error("Error fetching department:", error);
        }
      );
    }
  }, [user]);

  useEffect(() => {
    if (department) {
      const inventoryPath =
        role === "admin"
          ? "departments/Pharmacy/localMeds"
          : `departments/${department}/localMeds`;
      const suppliesPath =
        role === "admin"
          ? "departments/CSR/localSupplies"
          : `departments/${department}/localSupplies`;

      const inventoryCollection = ref(database, inventoryPath);
      const suppliesCollection = ref(database, suppliesPath);

      const unsubscribeInventory = onValue(
        inventoryCollection,
        (snapshot) => {
          const data = snapshot.val();
          const inventoryData = data
            ? Object.keys(data)
                .map((key) => {
                  const item = data[key];
                  const maxQuantity = item.maxQuantity || item.quantity;
                  return {
                    ...item,
                    id: key,
                    status: calculateStatus(item.quantity, maxQuantity),
                    itemName: item.itemName || "",
                  };
                })
                .sort((a, b) => a.itemName.localeCompare(b.itemName))
            : [];

            setInventoryList(sortByField(inventoryData, "genericName"));
        },
        (error) => {
          console.error("Error fetching inventory:", error);
          setInventoryList([]);
        }
      );

      const unsubscribeSupplies = onValue(
        suppliesCollection,
        (snapshot) => {
          const data = snapshot.val();
          const suppliesData = data
            ? Object.keys(data)
                .map((key) => {
                  const item = data[key];
                  const maxQuantity = item.maxQuantity || item.quantity;
                  return {
                    ...item,
                    id: key,
                    status: calculateStatus(item.quantity, maxQuantity),
                    itemName: item.itemName || "",
                  };
                })
                .sort((a, b) => a.itemName.localeCompare(b.itemName))
            : [];

            setSuppliesList(sortByField(suppliesData, "itemName"))
        },
        (error) => {
          console.error("Error fetching supplies:", error);
          setSuppliesList([]);
        }
      );

      return () => {
        unsubscribeInventory();
        unsubscribeSupplies();
      };
    }
  }, [role, department]);

  const confirmDelete = (item) => {
    setCurrentItem(item);
    toggleDeleteModal();
  };

  const handleDelete = async () => {
    let deletePath;
    if (role === "admin") {
      deletePath =
        selectedTab === "medicine"
          ? `departments/Pharmacy/localMeds/${currentItem.id}`
          : `departments/CSR/localSupplies/${currentItem.id}`;
    } else {
      deletePath =
        selectedTab === "medicine"
          ? `departments/${department}/localMeds/${currentItem.id}`
          : `departments/${department}/localSupplies/${currentItem.id}`;
    }
    await remove(ref(database, deletePath));
    toggleDeleteModal();
  };

  const filteredList =
    selectedTab === "medicine"
      ? inventoryList.filter(
          (medicine) =>
            medicine.genericName &&
            medicine.genericName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : suppliesList.filter(
          (supply) =>
            supply.itemName &&
            supply.itemName.toLowerCase().includes(searchTerm.toLowerCase())
        );

  if (!permissions?.accessInventory) {
    return <AccessDenied />;
  }

  console.log(department)

  return (
    <div className="w-full">
      <div className="flex justify-between items-center">
      <div className="flex">
        <button
          onClick={() => {setSelectedTab("medicine")}}
          className={`space-x-4 px-6 py-2 rounded-md transition duration-200 ${
            selectedTab === "medicine"
              ? "bg-slate-900 text-white text-bold"
              : "bg-slate-200 text-gray-900"
          } ${department === "CSR" || department === "Pharmacy" ? "cursor-default pointer-events-none opacity-0" : ""}`}
        >
          Medicine Inventory
        </button>
        <button
          onClick={() => {setSelectedTab("supplies")}}
          className={`space-x-4 px-6 py-2 rounded-md transition duration-200 ${
            selectedTab === "supplies"
              ? "bg-slate-900 text-white text-bold"
              : "bg-slate-200 text-gray-900"
          } ${department === "CSR" || department === "Pharmacy" ? "cursor-default pointer-events-none opacity-0" : ""}`}
        >
          Supplies Inventory
        </button>
      </div>
        <Notification />
      </div>

      {selectedTab === "medicine" && (
        <>
          <div className="flex justify-between items-center">
            <div className="my-4">
              <input
                type="text"
                placeholder="Search by item name..."
                className="border border-slate-300 px-4 py-2 rounded-md"
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
          <div className="relative overflow-x-auto rounded-md shadow-sm">
            <table className="w-full text-md text-gray-900 text-center border border-slate-200">
              <thead className="text-md bg-slate-200">
                <tr>
                  <th className="px-6 py-3">Short Description</th>
                  <th className="px-6 py-3">Standard Description</th>
                  <th className="px-6 py-3">Custom Description</th>
                  <th className="px-6 py-3">Generic Name</th>
                  <th className="px-6 py-3">Specificications</th>
                  <th className="px-6 py-3">Item Group</th>
                  <th className="px-6 py-3">Item Category</th>
                  <th className="px-6 py-3">Examination Type</th>
                  <th className="px-6 py-3">NHIP Category</th>
                  <th className="px-6 py-3">Drug Admin Group</th>
                  <th className="px-6 py-3">Small Unit</th>
                  <th className="px-6 py-3">Conversion</th>
                  <th className="px-6 py-3">Big Unit</th>
                  <th className="px-6 py-3">Expiry Date</th>
                  <th className="px-6 py-3">Quantity</th>
                  <th className="px-6 py-3">QR Code</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length > 0 ? (
                  filteredList.map((item) => (
                    <tr
                      key={item.id}
                      className="bg-white border-b hover:bg-slate-100"
                    >
                      <td className="px-6 py-3">{item.shortDesc}</td>
                      <td className="px-6 py-3">{item.standardDesc}</td>
                      <td className="px-6 py-3">{item.customDesc}</td>
                      <td className="px-6 py-3">{item.genericName}</td>
                      <td className="px-6 py-3">{item.specifications}</td>
                      <td className="px-6 py-3">{item.itemGroup}</td>
                      <td className="px-6 py-3">{item.itemCategory}</td>
                      <td className="px-6 py-3">{item.examinationType}</td>
                      <td className="px-6 py-3">{item.nhipCategory}</td>
                      <td className="px-6 py-3">{item.drugAdminGroup}</td>
                      <td className="px-6 py-3">{item.smallUnit}</td>
                      <td className="px-6 py-3">{item.conversion}</td>
                      <td className="px-6 py-3">{item.bigUnit}</td>
                      <td className="px-6 py-3">{item.expiryDate}</td>
                      <td className="px-6 py-3">{item.quantity}</td>
                      <td className="px-6 py-3 flex justify-center items-center">
                        <QRCode size={50} value={item.id} />
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex justify-center space-x-2 items-center">
                          <button
                            onClick={() => handleEdit(item)}
                            className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => confirmDelete(item)}
                            className="ml-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handleStockIn(item)} // Trigger the StockIn modal
                            className="ml-4 bg-green-600 hover:bg-green-700 text-white px-6 py-0 text-sm font-500 rounded-md"
                          >
                            Stock In
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="17" className="px-6 py-3">
                      No items in inventory.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <AddInventory isOpen={modal} toggleModal={toggleModal} />
          <StockInModal
            isOpen={stockInModal}
            toggleModal={toggleStockInModal}
            currentItem={currentItem}
            department={department}
            role={role}
            selectedTab={selectedTab} // Pass the selectedTab for dynamic handling
          />
        </>
      )}

      {selectedTab === "supplies" && (
        <div>
          <div className="flex justify-between items-center">
            <div className="my-4">
              <input
                type="text"
                placeholder="Search by supply name..."
                className="border border-slate-300 px-4 py-2 rounded-lg"
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
          <div className="relative overflow-x-auto rounded-md shadow-sm">
            <table className="w-full text-md text-gray-900 text-center border border-slate-200">
              <thead className="text-md bg-slate-200">
                <tr>
                  <th className="px-6 py-3">Supply Name</th>
                  <th className="px-6 py-3">Quantity</th>
                  <th className="px-6 py-3">Brand</th>
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
                      className="bg-white border-b hover:bg-slate-100"
                    >
                      <td className="px-6 py-3">{item.itemName}</td>
                      <td className="px-6 py-3">{item.quantity}</td>
                      <td className="px-6 py-3">{item.brand}</td>
                      <td className="px-6 py-3">
                        {(item.costPrice !== undefined
                          ? item.costPrice
                          : 0
                        ).toFixed(2)}
                      </td>
                      <td className="px-6 py-3">
                        {(item.retailPrice !== undefined
                          ? item.retailPrice
                          : 0
                        ).toFixed(2)}
                      </td>
                      <td className="px-6 py-3">{item.status}</td>
                      <td className="px-6 py-4 flex justify-center items-center">
                        <QRCode size={50} value={item.id} />
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex justify-center space-x-2 items-center">
                          <button
                            onClick={() => handleEdit(item)}
                            className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => confirmDelete(item)}
                            className="ml-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handleStockIn(item)} // Trigger the StockIn modal
                            className="ml-4 bg-green-600 hover:bg-green-700 text-white px-6 py-0 text-sm font-500 rounded-md"
                          >
                            Stock In
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="17" className="px-6 py-3">
                      No supplies in inventory.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <AddSupply isOpen={supplyModal} toggleModal={toggleSupplyModal} />
          <StockInModal
            isOpen={stockInModal}
            toggleModal={toggleStockInModal}
            currentItem={currentItem}
            department={department}
            role={role}
            selectedTab={selectedTab} // Pass the selectedTab for dynamic handling
          />
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

      {/* Edit Modal */}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-4">
                  <label htmlFor="shortDesc" className="block text-gray-700 mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    id="shortDesc"
                    name="shortDesc"
                    className="w-full px-3 py-2 border rounded-lg"
                    defaultValue={currentItem?.shortDesc || ""}
                  required
                  />
              </div>

              <div className="mb-4">
                <label htmlFor="standardDesc" className="block text-gray-700 mb-1">
                  Standard Description
                </label>
                <input
                  type="text"
                  id="standardDesc"
                  name="standardDesc"
                  className="w-full px-3 py-2 border rounded-lg"
                  defaultValue={currentItem?.standardDesc  || ""}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="customDesc" className="block text-gray-700 mb-1">
                  Custom Description
                </label>
                <input
                  type="text"
                  id="customDesc"
                  name="customDesc"
                  className="w-full px-3 py-2 border rounded-lg"
                  defaultValue={currentItem?.customDesc || ""}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="genericName" className="block text-gray-700 mb-1">
                  Generic Name
                </label>
                <select
                id="genericName"
                name="genericName"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring"
                defaultValue={currentItem?.genericName}
              >
                  <option value="" disabled>Select Generic Name</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="mb-4">
              <label htmlFor="specifications" className="block text-gray-700 mb-1">
                Specifications
              </label>
              <input
                type="text"
                id="specifications"
                name="specifications"
                className="w-full px-3 py-2 border rounded-lg"
                defaultValue={currentItem?.specifications}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="itemGroup" className="block text-gray-700 mb-1">
                Item Group
              </label>
              <select
              id="itemGroup"
              name="itemGroup"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring"
              defaultValue={currentItem?.itemGroup}              
            >
                <option value="" disabled>Select Item Group</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="itemCategory" className="block text-gray-700 mb-1">
                Item Category
              </label>
              <select
              id="itemCategory"
              name="itemCategory"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring"
              defaultValue={currentItem?.itemCategory}
            >
                <option value="" disabled>Select Item Category</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="quantity" className="block text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                className="w-full px-3 py-2 border rounded-lg"
                defaultValue={currentItem?.quantity}
              />
            </div>
                </div>

                {/*column 2 */}
                <div>

                <div className="mb-4">
              <label htmlFor="examinationType" className="block text-gray-700 mb-1">
                Examination Type
              </label>
              <select
              id="examinationType"
              name="examinationType"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring"
              defaultValue={currentItem?.examinationType}
            >
                <option value="" disabled>Select Examination Type</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="nhipCategory" className="block text-gray-700 mb-1">
                NHIP Category
              </label>
              <select
              id="nhipCategory"
              name="nhipCategory"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring"
              defaultValue={currentItem?.nhipCategory}
            >
                <option value="" disabled>Select NHIP Category</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="drugAdminGroup" className="block text-gray-700 mb-1">
                Drug Admin Group
              </label>
              <select
              id="drugAdminGroup"
              name="drugAdminGroup"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring"
              defaultValue={currentItem?.drugAdminGroup}
            >
                <option value="" disabled>Select Drug Admin Group</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="smallUnit" className="block text-gray-700 mb-1">
                Small Unit
              </label>
              <select
              id="smallUnit"
              name="smallUnit"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring"
              defaultValue={currentItem?.smallUnit}
            >
                <option value="" disabled>Select  Small Unit</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="conversion" className="block text-gray-700 mb-1">
                Conversion
              </label>
              <select
              id="conversion"
              name="converision"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring"
              defaultValue={currentItem?.conversion}
            >
                <option value="" disabled>Select  Conversion</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="bigUnit" className="block text-gray-700 mb-1">
                Big Unit
              </label>
              <select
              id="bigUnit"
              name="bigUnit"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring"
              defaultValue={currentItem?.bigUnit}
            >
                <option value="" disabled>Select Big Unit</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="expiryDate" className="block text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                className="w-full px-3 py-2 border rounded-lg"
                defaultValue={currentItem?.expiryDate}
              />
            </div>
                </div>
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

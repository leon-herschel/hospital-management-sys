import React, { useState, useEffect, useRef } from "react";
import { ref, get, set, push, update, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";
import { getAuth } from "firebase/auth";

const Transfer = () => {
  const [activeTab, setActiveTab] = useState("General");
  const [formData, setFormData] = useState({
    name: "",
    department: "Pharmacy",
    status: "Draft",
    reason: "",
    timestamp: new Date().toLocaleString(),
  });
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const searchRef = useRef("");
  const departmentRef = useRef();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessages, setErrorMessages] = useState({
    departmentError: false,
    statusError: false,
    reasonError: false,
  });

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setFormData((prevData) => ({
        ...prevData,
        name: user.displayName || user.email,
      }));
    }
  }, []);

  useEffect(() => {
    departmentRef.current = ref(database, "departments");
    get(departmentRef.current)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const departmentNames = Object.keys(data);
          setDepartments(departmentNames);
        }
      })
      .catch((error) => console.error("Error fetching departments:", error));
  }, []);

  useEffect(() => {
    const suppliesRef = ref(database, "supplies");
    const unsubscribe = onValue(suppliesRef, (snapshot) => {
      if (snapshot.exists()) {
        const supplies = Object.entries(snapshot.val()).map(([key, value]) => ({
          ...value,
          itemKey: key,
        }));
        setItems(supplies);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleTabChange = (tab) => setActiveTab(tab);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSearchChange = (e) => {
    searchRef.current = e.target.value;
    const filtered = items.filter((item) =>
      item.itemName.toLowerCase().includes(searchRef.current.toLowerCase()),
    );
    setFilteredItems(filtered);
  };

  const addItem = (itemToAdd) => {
    if (!selectedItems.find((item) => item.itemName === itemToAdd.itemName)) {
      setSelectedItems([...selectedItems, { ...itemToAdd, quantity: 1 }]);
      searchRef.current = "";
      setFilteredItems([]);
    }
  };

  const removeItem = (itemToRemove) => {
    setSelectedItems(
      selectedItems.filter((item) => item.itemName !== itemToRemove.itemName),
    );
  };

  const handleQuantityChange = (item, value) => {
    const mainInventoryItem = items.find((i) => i.itemKey === item.itemKey);
    const maxAvailableQuantity = mainInventoryItem?.quantity || 0;

    if (value > maxAvailableQuantity) {
      alert(`Cannot exceed available quantity of ${maxAvailableQuantity}`);
      return;
    }

    const updatedItems = selectedItems.map((selectedItem) =>
      selectedItem.itemName === item.itemName
        ? { ...selectedItem, quantity: value }
        : selectedItem,
    );
    setSelectedItems(updatedItems);
  };

  const validateInputs = () => {
    const { department, status, reason } = formData;
    setErrorMessages({
      departmentError: !department,
      statusError: !status,
      reasonError: !reason,
    });
    return department && status && reason;
  };

  const handleTransfer = async () => {
    if (!validateInputs()) {
      alert("Please fill in all required fields.");
      return;
    }
    if (selectedItems.length === 0) {
      alert("Please select items to transfer.");
      return;
    }

    setSubmitting(true);

    const transferData = {
      name: formData.name,
      status: formData.status,
      reason: formData.reason,
      timestamp: formData.timestamp,
    };

    for (const item of selectedItems) {
      const departmentPath = `departments/${formData.department}/localSupplies/${item.itemKey}`;
      const mainInventoryRef = ref(database, `supplies/${item.itemKey}`);

      // Step 1: Fetch current quantity in `supplies`
      const mainSnapshot = await get(mainInventoryRef);
      if (!mainSnapshot.exists()) {
        console.error(
          `Item ${item.itemName} does not exist in the main inventory.`,
        );
        continue;
      }

      const mainInventoryData = mainSnapshot.val();
      const mainInventoryQuantity = mainInventoryData.quantity;

      // Step 2: Fetch current quantity in `localSupplies` for the department
      const localSuppliesRef = ref(
        database,
        `departments/${formData.department}/localSupplies/${item.itemKey}`,
      );
      const localSnapshot = await get(localSuppliesRef);
      const localSuppliesData = localSnapshot.exists()
        ? localSnapshot.val()
        : {};
      const localSuppliesQuantity = localSuppliesData.quantity || 0;

      // Step 3: Calculate the updated quantities
      const updatedMainQuantity = Math.max(
        mainInventoryQuantity - item.quantity,
        0,
      ); // Deduct from main inventory
      const updatedLocalQuantity = localSuppliesQuantity + item.quantity; // Add to local supplies

      // Step 4: Update the department's local supplies and main inventory
      await set(localSuppliesRef, {
        ...item,
        ...transferData,
        quantity: updatedLocalQuantity, // Update local supplies with the new quantity
      });

      const historyPath = `departments/${formData.department}/inventoryHistory`;
      const newHistoryRef = push(ref(database, historyPath));
      await set(newHistoryRef, {
        itemName: item.itemName,
        quantity: item.quantity,
        timestamp: formData.timestamp,
        sender: formData.name,
      });

      // Step 5: Update the main inventory
      await update(mainInventoryRef, { quantity: updatedMainQuantity });
    }

    alert("Transfer successful!");
    setFormData({ ...formData, reason: "", status: "Draft" });
    setSelectedItems([]);
    setSubmitting(false);
  };

  return (
    <div className="max-w-full mx-auto mt-6 bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Create a new stock transfer.</h1>
        <button
          className="bg-green-500 text-white px-2 py-1 rounded"
          onClick={handleTransfer}
          disabled={submitting}
        >
          {submitting ? "Transferring..." : "Transfer"}
        </button>
      </div>

      {/* Name Input */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Name:</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          readOnly
          className="border p-2 w-full rounded"
        />
        <p className="text-gray-500 text-sm">The one who processes.</p>
      </div>

      {/* Timestamp Display */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Transfer Timestamp:</label>
        <p>{formData.timestamp}</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-4 border-b">
        <button
          onClick={() => handleTabChange("General")}
          className={`px-4 py-2 ${activeTab === "General" ? "bg-maroon text-white" : "bg-gray-100"}`}
        >
          General
        </button>
        <button
          onClick={() => handleTabChange("Items")}
          className={`px-4 py-2 ${activeTab === "Items" ? "bg-maroon text-white" : "bg-gray-100"}`}
        >
          Items
        </button>
      </div>

      {/* General Tab Content */}
      {activeTab === "General" && (
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">To Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className={`border p-2 w-full rounded ${errorMessages.departmentError ? "border-red-500" : ""}`}
              >
                {departments.map((dept, index) => (
                  <option key={index} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {errorMessages.departmentError && (
                <p className="text-red-500 text-sm">
                  Please select a department.
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={`border p-2 w-full rounded ${errorMessages.statusError ? "border-red-500" : ""}`}
              >
                <option value="Draft">Draft</option>
                <option value="Final">Final</option>
              </select>
              {errorMessages.statusError && (
                <p className="text-red-500 text-sm">Please select a status.</p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-1">Reason:</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              className={`border p-2 w-full rounded ${errorMessages.reasonError ? "border-red-500" : ""}`}
            ></textarea>
            {errorMessages.reasonError && (
              <p className="text-red-500 text-sm">Reason is required.</p>
            )}
          </div>
        </div>
      )}

      {/* Items Tab Content */}
      {activeTab === "Items" && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-lg">Items</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search Item"
                value={searchRef.current}
                onChange={handleSearchChange}
                className="border p-2 rounded w-1/2"
              />
            </div>
          </div>

          {searchRef.current && (
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded mb-4">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between p-2 border-b hover:bg-gray-100 cursor-pointer"
                    onClick={() => addItem(item)}
                  >
                    <span>{item.itemName}</span>
                    <span className="text-gray-500">{item.quantity}</span>
                  </div>
                ))
              ) : (
                <div className="p-2 text-gray-500">No items found.</div>
              )}
            </div>
          )}

          <table className="min-w-full border-collapse border border-gray-300 mt-4">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2">Item Name</th>
                <th className="border border-gray-300 p-2">Quantity</th>
                <th className="border border-gray-300 p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {selectedItems.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 p-2">
                    {item.itemName}
                  </td>
                  <td className="border border-gray-300 p-2">
                    <input
                      type="number"
                      min="1"
                      max={item.quantity}
                      value={item.quantity}
                      onChange={(e) =>
                        handleQuantityChange(item, parseInt(e.target.value))
                      }
                      className="border rounded w-16 text-center"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded"
                      onClick={() => removeItem(item)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Transfer;

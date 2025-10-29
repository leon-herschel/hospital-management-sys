import { useState, useEffect, useRef } from "react";
import Select from "react-select"; // Import react-select
import { ref, get, set, push, update } from "firebase/database";
import { getAuth } from "firebase/auth";
import { database } from "../../firebase/firebase";
import AccessDenied from "../ErrorPages/AccessDenied";
import { useAuth } from "../../context/authContext/authContext";
import {
  Send,
  Trash2,
  Package,
  User,
  Building,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Loader,
  X,
  Check,
} from "lucide-react";

const Transfer = () => {
  const { department } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    reason: "",
    timestamp: new Date().toLocaleString(),
  });
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedForRemoval, setSelectedForRemoval] = useState([]); // New state for bulk removal
  const [userClinicId, setUserClinicId] = useState(null); // Add state for user's clinic
  const selectRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessages, setErrorMessages] = useState({
    departmentError: false,
    reasonError: false,
  });

  // Fetch user details and clinic
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const userRef = ref(database, `users/${user.uid}`);
      get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          const fullName = `${userData.firstName || ""} ${
            userData.lastName || ""
          }`.trim();

          // Set user's clinic ID from clinicAffiliation
          setUserClinicId(userData.clinicAffiliation);

          setFormData((prevData) => ({
            ...prevData,
            name: fullName || user.email, // fallback if names are missing
          }));
        } else {
          setFormData((prevData) => ({
            ...prevData,
            name: user.email, // fallback
          }));
        }
      });
    }
  }, []);

  // Fetch department names
  useEffect(() => {
    const departmentRef = ref(database, "departments");
    get(departmentRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const departmentNames = Object.keys(data).filter((dept) =>
            ["Laboratory", "Pharmacy", "Nurse"].includes(dept)
          );
          setDepartments(departmentNames);
        }
      })
      .catch((error) => {
        console.error("Error fetching departments:", error);
      });
  }, []);

  // Fetch item inventory - Modified to filter by user's clinic
  useEffect(() => {
    if (!userClinicId) return;

    const clinicRef = ref(database, `clinicInventoryStock/${userClinicId}`);
    const inventoryRef = ref(database, "inventoryItems");

    Promise.all([get(clinicRef), get(inventoryRef)])
      .then(([clinicSnap, inventorySnap]) => {
        if (clinicSnap.exists() && inventorySnap.exists()) {
          const clinicData = clinicSnap.val();
          const inventoryData = inventorySnap.val();

          const mappedItems = [];

          Object.entries(clinicData).forEach(([itemKey, stockValue]) => {
            const fullItemData = inventoryData[itemKey];

            if (fullItemData) {
              mappedItems.push({
                ...fullItemData,
                quantity: stockValue.quantity,
                itemKey,
                refKey: userClinicId,
              });
            } else {
              console.warn(`No inventory data found for itemKey: ${itemKey}`);
            }
          });

          setItems(mappedItems);
        } else {
          console.warn("Clinic or Inventory data not found for this clinic.");
          setItems([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching inventory:", err);
        setItems([]);
      });
  }, [userClinicId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (selectedOption) => {
    const newItem = items.find((item) => item.itemKey === selectedOption.value);
    if (newItem) {
      addItem(newItem);
      if (selectRef.current) {
        selectRef.current.clearValue();
      }
    }
  };

  const addItem = (itemToAdd) => {
    if (selectedItems.find((item) => item.itemKey === itemToAdd.itemKey)) {
      alert("This item has already been selected.");
      return;
    }
    setSelectedItems([...selectedItems, { ...itemToAdd, quantity: 1 }]);
  };

  const removeItem = (itemToRemove) => {
    setSelectedItems(
      selectedItems.filter((item) => item.itemKey !== itemToRemove.itemKey)
    );
    // Also remove from selectedForRemoval if it was selected
    setSelectedForRemoval(
      selectedForRemoval.filter((key) => key !== itemToRemove.itemKey)
    );
  };

  // New functions for bulk removal
  const handleCheckboxChange = (itemKey, isChecked) => {
    if (isChecked) {
      setSelectedForRemoval([...selectedForRemoval, itemKey]);
    } else {
      setSelectedForRemoval(
        selectedForRemoval.filter((key) => key !== itemKey)
      );
    }
  };

  const handleSelectAll = () => {
    if (selectedForRemoval.length === selectedItems.length) {
      // If all are selected, deselect all
      setSelectedForRemoval([]);
    } else {
      // Select all
      setSelectedForRemoval(selectedItems.map((item) => item.itemKey));
    }
  };

  const handleBulkRemove = () => {
    if (selectedForRemoval.length === 0) {
      alert("Please select items to remove.");
      return;
    }

    const confirmMessage = `Are you sure you want to remove ${
      selectedForRemoval.length
    } selected item${selectedForRemoval.length !== 1 ? "s" : ""}?`;
    if (window.confirm(confirmMessage)) {
      setSelectedItems(
        selectedItems.filter(
          (item) => !selectedForRemoval.includes(item.itemKey)
        )
      );
      setSelectedForRemoval([]);
    }
  };

  const handleRemoveAll = () => {
    if (selectedItems.length === 0) {
      alert("No items to remove.");
      return;
    }

    if (window.confirm("Are you sure you want to remove all items?")) {
      setSelectedItems([]);
      setSelectedForRemoval([]);
    }
  };

  const handleQuantityChange = (item, value) => {
    const newQuantity = Math.max(parseInt(value, 10) || 0);
    const mainInventoryItem = items.find((i) => i.itemKey === item.itemKey);
    const maxQuantity = mainInventoryItem?.quantity || 0;

    if (newQuantity > maxQuantity) {
      alert(`Quantity cannot exceed ${maxQuantity}`);
      return;
    }

    const updatedItems = selectedItems.map((selectedItem) =>
      selectedItem.itemKey === item.itemKey
        ? { ...selectedItem, quantity: newQuantity }
        : selectedItem
    );
    setSelectedItems(updatedItems);
  };

  const validateInputs = () => {
    const { department, reason } = formData;
    const errors = {
      departmentError: !department,
      reasonError: !reason,
    };
    setErrorMessages(errors);
    return Object.values(errors).every((error) => !error);
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

    try {
      for (const item of selectedItems) {
        const historyPath = `inventoryTransactions`;
        const newHistoryRef = push(ref(database, historyPath));

        const auth = getAuth();
        const currentUser = auth.currentUser;

        await set(newHistoryRef, {
          itemId: item.itemKey,
          itemName: item.itemName,
          timestamp: formData.timestamp,
          destinationDepartment: formData.department,
          processedByUserId: currentUser?.uid || "",
          processedByUserFirstName: formData.name.split(" ")[0] || "",
          processedByUserLastName:
            formData.name.split(" ").slice(1).join(" ") || "",
          quantityChanged: -item.quantity,
          reason: `Transfer to ${formData.department}: ${formData.reason}`,
          relatedPatientId: null,
          transactionType: "transfer_stock",
        });

        const mainInventoryRef = ref(
          database,
          `clinicInventoryStock/${item.refKey}/${item.itemKey}`
        );
        const mainInventorySnapshot = await get(mainInventoryRef);

        if (mainInventorySnapshot.exists()) {
          const currentData = mainInventorySnapshot.val();
          const updatedQuantity = currentData.quantity - item.quantity;

          if (updatedQuantity < 0) {
            console.error(`Not enough stock for item: ${item.itemName}`);
          } else {
            let existingDepartmentQuantity = 0;
            if (
              currentData.departmentStock &&
              currentData.departmentStock[formData.department]
            ) {
              existingDepartmentQuantity =
                currentData.departmentStock[formData.department];
            }

            await update(mainInventoryRef, {
              quantity: updatedQuantity,
              departmentStock: {
                ...currentData.departmentStock,
                [formData.department]:
                  existingDepartmentQuantity + item.quantity,
              },
            });
          }
        } else {
          console.error(
            `Item ${item.itemName} does not exist in CSR's inventory.`
          );
        }
      }

      alert("Transfer successful!");
      setFormData({ ...formData, reason: "" });
      setSelectedItems([]);
      setSelectedForRemoval([]);
    } catch (error) {
      console.error("Error processing transfer:", error);
    } finally {
      setSubmitting(false);
    }
  };


  const selectOptions = items
    .filter(
      (item) =>
        !selectedItems.find((selected) => selected.itemKey === item.itemKey)
    )
    .map((item) => ({
      value: item.itemKey,
      label: `${item.itemName} (Max Quantity: ${item.quantity})`,
    }));

  return (
    <div className="max-w-6xl mx-auto mt-4 bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Package size={24} />
            <h1 className="text-2xl font-bold">Create Stock Transfer</h1>
          </div>
          <button
            className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all duration-200 ${
              submitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 transform hover:scale-105"
            }`}
            onClick={handleTransfer}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send size={18} />
                Transfer
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Transferred By */}
          <div>
            <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
              <User size={18} />
              Transferred By:
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              readOnly
              className="border border-gray-300 p-3 w-full rounded-md bg-gray-50"
            />
          </div>

          {/* To Department */}
          <div>
            <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
              <Building size={18} />
              To Department *
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              className={`border p-3 w-full rounded-md transition-colors ${
                errorMessages.departmentError
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              }`}
            >
              <option value="">Select Department</option>
              {departments.map((dept, index) => (
                <option key={index} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            {errorMessages.departmentError && (
              <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                <AlertCircle size={14} />
                Please select a department.
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
              <MessageSquare size={18} />
              Reason for Transfer *
            </label>
            <input
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              placeholder="Enter reason for transfer"
              className={`border p-3 w-full rounded-md transition-colors ${
                errorMessages.reasonError
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              }`}
            />
            {errorMessages.reasonError && (
              <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                <AlertCircle size={14} />
                Please provide a reason for the transfer.
              </div>
            )}
          </div>
        </div>

        {/* Selected Items Table */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package size={20} className="text-gray-700" />
              <h2 className="font-semibold text-lg text-gray-700">
                Selected Items
              </h2>
              {selectedItems.length > 0 && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                  {selectedItems.length} item
                  {selectedItems.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Bulk Action Buttons */}
            {selectedItems.length > 0 && (
              <div className="flex items-center gap-2">
                {selectedForRemoval.length > 0 && (
                  <span className="text-sm text-gray-600">
                    {selectedForRemoval.length} selected
                  </span>
                )}
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                  title={
                    selectedForRemoval.length === selectedItems.length
                      ? "Deselect All"
                      : "Select All"
                  }
                >
                  <Check size={16} />
                  {selectedForRemoval.length === selectedItems.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
                <button
                  onClick={handleBulkRemove}
                  disabled={selectedForRemoval.length === 0}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                    selectedForRemoval.length === 0
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                >
                  <Trash2 size={16} />
                  Remove Selected
                </button>
                <button
                  onClick={handleRemoveAll}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  <X size={16} />
                  Remove All
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-md border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700 w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedItems.length > 0 &&
                        selectedForRemoval.length === selectedItems.length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Item Name
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Quantity
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map((item, index) => (
                  <tr
                    key={item.itemKey}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedForRemoval.includes(item.itemKey)}
                        onChange={(e) =>
                          handleCheckboxChange(item.itemKey, e.target.checked)
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-4 font-medium">{item.itemName}</td>
                    <td className="p-4">
                      <input
                        type="number"
                        min="1"
                        max={
                          items.find((i) => i.itemKey === item.itemKey)
                            ?.quantity || 1
                        }
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(item, e.target.value)
                        }
                        className="border border-gray-300 rounded-md p-2 w-20 text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => removeItem(item)}
                        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md transition-colors"
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Add Item Row */}
                <tr className="border-t-2 border-gray-200">
                  <td colSpan="4" className="p-4">
                    {selectOptions.length > 0 ? (
                      <Select
                        key={selectedItems.length}
                        options={selectOptions}
                        onChange={handleSelectChange}
                        placeholder="Search and select item..."
                        className="w-full"
                        ref={selectRef}
                        value={null}
                        isClearable={true}
                        isSearchable={true}
                        menuPortalTarget={document.body}
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          menu: (base) => ({ ...base, zIndex: 9999 }),
                          control: (base) => ({ ...base, minHeight: "42px" }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused
                              ? "#f3f4f6"
                              : "white",
                            color: "black",
                            cursor: "pointer",
                          }),
                        }}
                        menuPlacement="auto"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500 justify-center py-4">
                        <CheckCircle size={18} />
                        All available items have been selected
                      </div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            {selectedItems.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Package size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No items selected</p>
                <p className="text-sm">
                  Use the search field above to add items to transfer
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfer;

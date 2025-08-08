import { useState, useEffect, useRef } from "react";
import Select from "react-select"; // Import react-select
import { ref, get, set, push, update, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";
import { getAuth } from "firebase/auth";
import AccessDenied from "../ErrorPages/AccessDenied";
import { useAuth } from "../../context/authContext/authContext";

const Transfer = () => {
  const { department } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    department: "", // Default department
    reason: "",
    timestamp: new Date().toLocaleString(),
  });
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const selectRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessages, setErrorMessages] = useState({
    departmentError: false,
    reasonError: false,
  });

  // Fetch user details
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
            ["Laboratory", "Pharmacy"].includes(dept)
          );
          setDepartments(departmentNames);
        }
      })
      .catch((error) => {
        console.error("Error fetching departments:", error);
      });
  }, []);

  // Fetch item inventory
  useEffect(() => {
    const clinicRef = ref(database, "clinicInventoryStock");
    const inventoryRef = ref(database, "inventoryItems");

    Promise.all([get(clinicRef), get(inventoryRef)])
      .then(([clinicSnap, inventorySnap]) => {
        if (clinicSnap.exists() && inventorySnap.exists()) {
          const clinicData = clinicSnap.val();
          const inventoryData = inventorySnap.val();

          const mappedItems = [];

          // Go through each clinicInventoryStock group (refKey)
          Object.entries(clinicData).forEach(([refKey, itemGroup]) => {
            // itemGroup = { itemKey1: {quantity, status...}, itemKey2: {...} }
            Object.entries(itemGroup).forEach(([itemKey, stockValue]) => {
              const fullItemData = inventoryData[itemKey];

              if (fullItemData) {
                mappedItems.push({
                  ...fullItemData,
                  quantity: stockValue.quantity,
                  itemKey,
                  refKey,
                });
              } else {
                console.warn(`No inventory data found for itemKey: ${itemKey}`);
              }
            });
          });

          setItems(mappedItems);
        } else {
          console.warn("Clinic or Inventory data not found.");
        }
      })
      .catch((err) => {
        console.error("Error fetching inventory:", err);
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (selectedOption) => {
    const newItem = items.find((item) => item.itemKey === selectedOption.value);
    if (newItem) {
      addItem(newItem);

      // Clear the selected option
      selectRef.current.clearValue();
    }
  };

  const addItem = (itemToAdd) => {
    // Check if the item is already in the selectedItems array
    if (selectedItems.find((item) => item.itemKey === itemToAdd.itemKey)) {
      alert("This item has already been selected."); // Show an alert
      return; // Exit the function
    }
    // Add the new item if not already selected
    setSelectedItems([...selectedItems, { ...itemToAdd, quantity: 1 }]);
  };

  const removeItem = (itemToRemove) => {
    setSelectedItems(
      selectedItems.filter((item) => item.itemKey !== itemToRemove.itemKey)
    );
  };

  const handleQuantityChange = (item, value) => {
    const newQuantity = Math.max(parseInt(value, 0));
    const mainInventoryItem = items.find((i) => i.itemKey === item.itemKey);
    const maxQuantity = mainInventoryItem?.quantity || 0;

    if (newQuantity > maxQuantity) {
      alert(`Quantity cannot exceed ${maxQuantity}`);
    } else {
      const updatedItems = selectedItems.map((selectedItem) =>
        selectedItem.itemKey === item.itemKey
          ? { ...selectedItem, quantity: newQuantity }
          : selectedItem
      );
      setSelectedItems(updatedItems);
    }
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
      const transferData = {
        name: formData.name,
        reason: formData.reason,
        timestamp: formData.timestamp,
        recipientDepartment: formData.department,
      };

      for (const item of selectedItems) {
        // Record transaction in inventoryTransactions
        const historyPath = `inventoryTransactions`;
        const newHistoryRef = push(ref(database, historyPath));

        // Get current user details for the transaction
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
          quantityChanged: -item.quantity, // Negative because it's being transferred out
          reason: `Transfer to ${formData.department}: ${formData.reason}`,
          relatedPatientId: null, // This would be null for transfers, or you can omit this field
          transactionType: "stock_in",
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
            console.error(`Not enough stock in CSR for item: ${item.itemName}`);
          } else {
            // Check if there's existing departmentStock for this department
            let existingDepartmentQuantity = 0;
            if (
              currentData.deparmentStock &&
              currentData.deparmentStock.department === formData.department
            ) {
              existingDepartmentQuantity =
                currentData.deparmentStock.quantity || 0;
            }

            // Update the clinicInventoryStock with accumulated department quantity
            await update(mainInventoryRef, {
              quantity: updatedQuantity,
              deparmentStock: {
                department: formData.department,
                quantity: existingDepartmentQuantity + item.quantity, // Add to existing quantity
                timestamp: formData.timestamp,
                transferredBy: formData.name,
                reason: formData.reason,
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
    } catch (error) {
      console.error("Error processing transfer:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (department !== "CSR" && department !== "Admin") {
    return <AccessDenied />;
  }

  const selectOptions = items.map((item) => ({
    value: item.itemKey,
    label: `${item.itemName} (Max Quantity: ${item.quantity})`,
  }));

  return (
    <div className="max-w-full mx-auto mt-2 bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Create a new stock transfer</h1>
        <button
          className="ml-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
          onClick={handleTransfer}
          disabled={submitting}
        >
          {submitting ? "Processing..." : "Transfer"}
        </button>
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Transferred By:</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          readOnly
          className="border p-2 w-full rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">To Department</label>
        <select
          name="department"
          value={formData.department}
          onChange={handleInputChange}
          className={`border p-2 w-full rounded ${
            errorMessages.departmentError ? "border-red-500" : ""
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
          <p className="text-red-500 text-sm">Please select a department.</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Reason for transfer</label>
        <input
          name="reason"
          value={formData.reason}
          onChange={handleInputChange}
          className={`border p-2 w-full rounded ${
            errorMessages.reasonError ? "border-red-500" : ""
          }`}
        />
        {errorMessages.reasonError && (
          <p className="text-red-500 text-sm">
            Please provide a reason for the transfer.
          </p>
        )}
      </div>

      <h2 className="font-semibold text-lg mb-2">Selected Items</h2>
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Selected Supplies</th>
            <th className="border p-2">Quantity</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {selectedItems.map((item) => (
            <tr key={item.refKey}>
              <td className="border p-2">{item.itemName}</td>
              <td className="border p-2">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(item, e.target.value)}
                  className="border border-gray-300 rounded p-1 w-16"
                />
              </td>
              <td className="border p-2">
                <button
                  onClick={() => removeItem(item)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
          <tr>
            <td className="border p-2">
              <Select
                options={selectOptions}
                onChange={handleSelectChange}
                placeholder="Search and select item..."
                className="w-full"
                ref={selectRef}
              />
            </td>
            <td className="border p-2"></td>
            <td className="border p-2"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Transfer;

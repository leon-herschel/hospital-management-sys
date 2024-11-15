import { useState, useEffect, useRef} from "react";
import Select from "react-select"; // Import react-select
import { ref, get, set, push, update, onValue } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { getAuth } from 'firebase/auth';
import AccessDenied from "../ErrorPages/AccessDenied";
import { useAuth } from "../../context/authContext/authContext";

const Transfer = () => {
  const { department } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    department: "Pharmacy",
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
      setFormData((prevData) => ({
        ...prevData,
        name: user.displayName || user.email,
      }));
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
            ["COVID UNIT", "ER", "ICU"].includes(dept)
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
    const suppliesRef = ref(database, "departments/CSR/localSupplies");
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
    setSelectedItems(selectedItems.filter((item) => item.itemKey !== itemToRemove.itemKey));
  };

  const handleQuantityChange = (item, value) => {
    const newQuantity = Math.max(parseInt(value, 0));
    if (newQuantity > item.maxQuantity) {
      alert(`Quantity cannot exceed ${item.maxQuantity}`);
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
        const departmentPath = `departments/${formData.department}/localSupplies/${item.itemKey}`;
        const localSupplySnapshot = await get(ref(database, departmentPath));
        let newQuantity = item.quantity;

        if (localSupplySnapshot.exists()) {
          const existingData = localSupplySnapshot.val();
          newQuantity += existingData.quantity;
        }

        await set(ref(database, departmentPath), {
          ...item,
          quantity: newQuantity,
          timestamp: formData.timestamp,
        });

        const historyPath = `supplyHistoryTransfer`;
        const newHistoryRef = push(ref(database, historyPath));
        await set(newHistoryRef, {
          itemName: item.itemName,
          quantity: item.quantity,
          timestamp: formData.timestamp,
          sender: formData.name,
          recipientDepartment: formData.department,
          reason: formData.reason,
        });

        const mainInventoryRef = ref(database, `departments/CSR/localSupplies/${item.itemKey}`);
        const mainInventorySnapshot = await get(mainInventoryRef);

        if (mainInventorySnapshot.exists()) {
          const currentData = mainInventorySnapshot.val();
          const updatedQuantity = currentData.quantity - item.quantity;

          if (updatedQuantity < 0) {
            console.error(`Not enough stock in CSR for item: ${item.itemName}`);
          } else {
            await update(mainInventoryRef, { quantity: updatedQuantity });
          }
        } else {
          console.error(`Item ${item.itemName} does not exist in CSR's inventory.`);
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
    label: `${item.itemName} (Max: ${item.maxQuantity})`,
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
        <label className="block font-semibold mb-1">Transfer from</label>
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
          <p className="text-red-500 text-sm">Please provide a reason for the transfer.</p>
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
            <tr key={item.itemKey}>
              <td className="border p-2">{item.itemName} (Max: {item.maxQuantity})</td>
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

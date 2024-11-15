import React, { useState, useEffect } from "react";
import Select from "react-select"; // Import react-select
import { ref, get, set, push } from "firebase/database"; // Firebase functions
import { database } from "../../firebase/firebase"; // Firebase configuration
import { getAuth } from "firebase/auth"; // Firebase Auth

const RequestS = () => {
  const [formData, setFormData] = useState({
    name: "",
    department: "Pharmacy",
    reason: "",
    timestamp: "",
    currentDepartment: "",
  });
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]); // To store medicines or supplies data
  const [selectedItems, setSelectedItems] = useState([]); // To store selected items
  const [userDepartment, setUserDepartment] = useState("");
  const [submitting, setSubmitting] = useState(false); // For submission state
  const [departmentError, setDepartmentError] = useState(false);
  const [reasonError, setReasonError] = useState(false);

  // Fetch user name and department from Firebase Auth and database
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setFormData((prevData) => ({
        ...prevData,
        name: user.firstName || user.email,
      }));

      // Fetch the user's department from Firebase
      const userDepartmentRef = ref(database, `users/${user.uid}/department`);
      get(userDepartmentRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            setUserDepartment(snapshot.val());
          } else {
            console.log("No department found for the user.");
          }
        })
        .catch((error) => {
          console.error("Error fetching user department:", error);
        });
    }
  }, []);

  // Fetch departments from Firebase
  useEffect(() => {
    const departmentRef = ref(database, "departments");
    get(departmentRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const departmentNames = Object.keys(data).filter(
            (dept) => dept === "CSR" || dept === "Pharmacy"
          );
          setDepartments(departmentNames);
        } else {
          console.log("No data available");
        }
      })
      .catch((error) => {
        console.error("Error fetching departments:", error);
      });
  }, []);

  // Clear selected items when department changes
  useEffect(() => {
    setSelectedItems([]);
  }, [formData.department]);

  // Fetch medicines or supplies based on selected department
  useEffect(() => {
    const fetchItems = async () => {
      let itemRef;
      if (formData.department === "Pharmacy") {
        itemRef = ref(database, "departments/Pharmacy/localMeds");
      } else if (formData.department === "CSR") {
        itemRef = ref(database, "departments/CSR/localSupplies");
      }

      try {
        const snapshot = await get(itemRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const itemsList = Object.keys(data).map((key) => ({
            itemKey: key,
            itemName: data[key].itemName,
            brand: data[key].brand,
            costPrice: data[key].costPrice,
            retailPrice: data[key].costPrice,
            maxQuantity: data[key].maxQuantity,
            qrCode: data[key].qrCode,
          }));
          setItems(itemsList);
        } else {
          console.log("No data available");
          setItems([]);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
        setItems([]);
      }
    };
    fetchItems();
  }, [formData.department]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (selectedOption) => {
    const newItem = items.find((item) => item.itemKey === selectedOption.value);
    if (newItem) {
      addItem(newItem);
    }
  };

  const addItem = (itemToAdd) => {
    if (!selectedItems.find((item) => item.itemKey === itemToAdd.itemKey)) {
      setSelectedItems([...selectedItems, { ...itemToAdd, quantity: 1 }]);
    }
  };

  const removeItem = (itemToRemove) => {
    setSelectedItems(
      selectedItems.filter((item) => item.itemKey !== itemToRemove.itemKey)
    );
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
    setDepartmentError(!formData.department);
    setReasonError(!formData.reason);
    return formData.department && formData.reason;
  };

  const handleTransfer = () => {
    if (!validateInputs()) {
      alert("Please fill in all required fields.");
      return;
    }

    if (selectedItems.length === 0) {
      alert("Please select items to request.");
      return; // Stop execution if no items are selected
    }

    setSubmitting(true);

    const requestData = {
      name: formData.name,
      reason: formData.reason,
      items: selectedItems,
      timestamp: formData.timestamp,
      currentDepartment: userDepartment,
    };

    const requestNodePath = `departments/${formData.department}/Request`;
    const newRequestRef = push(ref(database, requestNodePath));

    set(newRequestRef, requestData)
      .then(() => {
        alert("Request successful!");
        setFormData({ ...formData, reason: "" });
        setSelectedItems([]);
        setSubmitting(false);
      })
      .catch((error) => {
        console.error("Error transferring data:", error);
        alert("Error transferring data. Please try again.");
        setSubmitting(false);
      });
  };

  // Options for react-select
  const selectOptions = items.map((item) => ({
    value: item.itemKey,
    label: `${item.itemName} (Max: ${item.maxQuantity})`,
  }));

  return (
    <div className="max-w-full mx-auto mt-2 bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Create a new Request Stock</h1>
        <button
          className="ml-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
          onClick={handleTransfer}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>

      <div className="mb-4">
        <label htmlFor="department" className="block font-bold mb-1">
          Department
        </label>
        <select
          id="department"
          name="department"
          value={formData.department}
          onChange={handleInputChange}
          className={`border ${
            departmentError ? "border-red-500" : "border-gray-300"
          } rounded p-2`}
        >
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
        {departmentError && (
          <span className="text-red-500">Please select a department.</span>
        )}
      </div>

      {userDepartment && (
        <div className="mb-4">
          <label className="block font-bold mb-1">Your Department</label>
          <p className="text-gray-700">{userDepartment}</p>
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="reason" className="block font-bold mb-1">
          Reason
        </label>
        <input
          id="reason"
          name="reason"
          value={formData.reason}
          onChange={handleInputChange}
          className={`border ${
            reasonError ? "border-red-500" : "border-gray-300"
          } rounded p-2 w-full`}
          placeholder="Enter reason for request"
        />
        {reasonError && (
          <span className="text-red-500">Please enter a reason.</span>
        )}
      </div>

      <h2 className="font-bold mb-2">Selected Items</h2>
      <table className="w-full border-collapse border">
        <thead>
          <tr>
            <th className="border p-2">Selected Items</th>
            <th className="border p-2">Quantity</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {selectedItems.map((item) => (
            <tr key={item.itemKey}>
              <td className="border p-2">
                {item.itemName} (Max: {item.maxQuantity})
              </td>
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
              {/* react-select for item selection */}
              <Select
                options={selectOptions}
                onChange={handleSelectChange}
                placeholder="Search and select item..."
                className="w-full"
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

export default RequestS;

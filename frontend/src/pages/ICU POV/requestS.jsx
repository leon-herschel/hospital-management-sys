import React, { useState, useEffect } from "react";
import { ref, get, set, push } from "firebase/database"; // Import Firebase functions
import { database } from "../../firebase/firebase"; // Firebase configuration
import { getAuth } from "firebase/auth"; // Import Firebase Auth

const RequestS = () => {
  const [activeTab, setActiveTab] = useState("General"); // Tab state
  const [formData, setFormData] = useState({
    name: "", // Default name
    department: "Pharmacy", // Default department
    reason: "",
    timestamp: "",
    currentDepartment: "",

  });
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]); // To store medicines or supplies data
  const [selectedItems, setSelectedItems] = useState([]); // To store selected items
  const [searchTerm, setSearchTerm] = useState(""); // Search term state
  const [filteredItems, setFilteredItems] = useState([]); // Filtered items based on search

  // Error states
  const [departmentError, setDepartmentError] = useState(false);
  const [reasonError, setReasonError] = useState(false);
  const [submitting, setSubmitting] = useState(false); // For submission state

  // New state to store the user's department
  const [userDepartment, setUserDepartment] = useState("");

  // Fetch user name and department from Firebase Auth and database
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      // Set the user's name
      setFormData((prevData) => ({
        ...prevData,
        name: user.firstName || user.email,
      }));

      // Fetch the user's department from the Firebase database (assuming you store it in users/{uid}/department)
      const userDepartmentRef = ref(database, `users/${user.uid}/department`);
      get(userDepartmentRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            setUserDepartment(snapshot.val()); // Set the user's department
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
          ); // Filter for CSR and Pharmacy
          setDepartments(departmentNames);
        } else {
          console.log("No data available");
        }
      })
      .catch((error) => {
        console.error("Error fetching departments:", error);
      });
  }, []);

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
            itemKey: key, // Store the item key
            ...data[key], // Spread the item data
          }));
          setItems(itemsList); // Set the items state
          setFilteredItems(itemsList); // Initially set filteredItems to all items
        } else {
          console.log("No data available");
          setItems([]); // Ensure items are reset if no data
        }
      } catch (error) {
        console.error("Error fetching items:", error);
        setItems([]); // Reset items if error occurs
      }
    };
    fetchItems();
  }, [formData.department]); // Fetch items whenever the department changes

  useEffect(() => {
    // Set the timestamp when the component is mounted
    const currentTimestamp = new Date().toLocaleString();
    setFormData((prevData) => ({
      ...prevData,
      timestamp: currentTimestamp,
    }));
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  
    // Filter items based on search term, adding a check for itemName existence
    const filtered = items.filter(
      (item) => item.itemName && item.itemName.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredItems(filtered);
  };
  

  const addItem = (itemToAdd) => {
    if (!selectedItems.find((item) => item.itemName === itemToAdd.itemName)) {
      setSelectedItems([...selectedItems, { ...itemToAdd, quantity: "" }]); // Default quantity is set to 1
      setSearchTerm(""); // Clear search term after adding
      setFilteredItems([]); // Clear filtered items
    }
  };

  const removeItem = (itemToRemove) => {
    setSelectedItems(
      selectedItems.filter((item) => item.itemName !== itemToRemove.itemName)
    );
  };

  const handleQuantityChange = (item, value) => {
    if (value > item.maxQuantity) {
      alert(`Cannot exceed Max Quantity of ${item.maxQuantity}`);
      return; // Stop execution if quantity exceeds
    }

    const newQuantity = Math.min(Math.max(value, ""), item.maxQuantity); // Ensure quantity is between 1 and maxQuantity
    const updatedItems = selectedItems.map((selectedItem) =>
      selectedItem.itemName === item.itemName
        ? { ...selectedItem, quantity: newQuantity }
        : selectedItem
    );
    setSelectedItems(updatedItems);
  };

  // Validate inputs before submission
  const validateInputs = () => {
    setDepartmentError(!formData.department);
    setReasonError(!formData.reason);

    return formData.department && formData.reason;
  };

  // Handle the request of data
  const handleTransfer = () => {
    if (!validateInputs()) {
      alert("Please fill in all required fields.");
      return; // Stop execution if validation fails
    }

    if (selectedItems.length === "") {
      alert("Please select items to request.");
      return; // Stop execution if no items are selected
    }

    setSubmitting(true); // Disable the button and show loading

    const handleTransfer = {
      name: formData.name,
      reason: formData.reason,
      items: selectedItems,
      timestamp: formData.timestamp,
      currentDepartment: userDepartment
    };

    // Define the path for the selected department and create a "Request" node
    const requestNodePath = `departments/${formData.department}/Request`;

    // Create a new child node under the "Request" node
    const newRequestRef = push(ref(database, requestNodePath));

    set(newRequestRef, handleTransfer)
      .then(() => {
        alert("Request successful!");
        // Optionally, reset formData and selectedItems here
        setFormData({ ...formData, reason: "" }); // Reset formData
        setSelectedItems([]); // Clear selected items
        setSubmitting(false); // Re-enable the button
      })
      .catch((error) => {
        console.error("Error transferring data:", error);
        alert("Error transferring data. Please try again.");
        setSubmitting(false); // Re-enable the button
      });
  };

  return (
    <div className="max-w-full mx-auto mt-2 bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Create a new Request Stock</h1>
        <button
          className="bg-green-500 text-white px-2 py-1 rounded"
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

      {/* Display user's department */}
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

      <div className="mb-4">
        <label className="block font-bold mb-1">Search Items</label>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          className="border border-gray-300 rounded p-2 w-full"
          placeholder="Search items..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div key={item.itemKey} className="border rounded p-2 shadow">
              <h3 className="font-bold">{item.itemName}</h3>
              <p>Max Quantity: {item.quantity}</p>
              <button
                onClick={() => addItem(item)}
                className="bg-blue-500 text-white px-2 py-1 rounded mt-2"
              >
                Add Item
              </button>
            </div>
          ))
        ) : (
          <p>No items found</p>
        )}
      </div>

      <div>
        <h2 className="font-bold mb-2">Selected Items</h2>
        {selectedItems.length > 0 ? (
          selectedItems.map((item) => (
            <div key={item.itemKey} className="border rounded p-2 mb-2 shadow">
              <h3 className="font-bold">{item.itemName}</h3>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => handleQuantityChange(item, e.target.value)}
                className="border border-gray-300 rounded p-1 w-1/3"
              />
              <button
                onClick={() => removeItem(item)}
                className="bg-red-500 text-white px-2 py-1 rounded ml-2"
              >
                Remove
              </button>
            </div>
          ))
        ) : (
          <p>No items selected</p>
        )}
      </div>
    </div>
  );
};

export default RequestS;

import React, { useState, useEffect } from "react";
import { ref, get, set, push } from "firebase/database"; // Import Firebase functions
import { database } from "../../firebase/firebase"; // Firebase configuration
import { getAuth } from "firebase/auth"; // Import Firebase Auth

const RequestS = () => {
  const [activeTab, setActiveTab] = useState("General"); // Tab state
  const [formData, setFormData] = useState({
    name: "", // Default name
    department: "Pharmacy", // Default department
    fromDepartment: "", // The department the user belongs to
    status: "Draft",
    reason: "",
    timestamp: "", // Timestamp to track transfer creation
  });
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]); // To store medicines or supplies data
  const [selectedItems, setSelectedItems] = useState([]); // To store selected items
  const [searchTerm, setSearchTerm] = useState(""); // Search term state
  const [filteredItems, setFilteredItems] = useState([]); // Filtered items based on search

  // Error states
  const [departmentError, setDepartmentError] = useState(false);
  const [statusError, setStatusError] = useState(false);
  const [reasonError, setReasonError] = useState(false);
  const [submitting, setSubmitting] = useState(false); // For submission state

  // Fetch user's department from Firebase based on email
  const fetchUserDepartment = async (email) => {
    try {
      const sanitizedEmail = encodeURIComponent(email); // Use encodeURIComponent for safe key access
      const userRef = ref(database, `users/${sanitizedEmail}/department`); // Assuming user departments are stored here
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        return snapshot.val(); // Return the department
      } else {
        console.log('No department found for this user.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user department:', error);
      return null;
    }
  };
  

  // Fetch user name and department from Firebase Auth
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setFormData((prevData) => ({
        ...prevData,
        name: user.displayName || user.email,
      }));
  
      // Fetch the department based on the user's email
      fetchUserDepartment(user.email).then((department) => {
        if (department) {
          setFormData((prevData) => ({
            ...prevData,
            fromDepartment: department, // Set the fromDepartment field
          }));
        } else {
          console.error('Failed to retrieve department');
        }
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
      const itemRef = ref(database, formData.department === 'Pharmacy' ? 'departments/Pharmacy/localMeds' : 'departments/CSR/localSupplies');
      try {
        const snapshot = await get(itemRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const itemsList = Object.keys(data).map((key) => ({
            itemKey: key, // Store the item key
            ...data[key], // Spread the item data
          }));
          setItems(itemsList); // Set the items state
        } else {
          console.log("No data available");
        }
      } catch (error) {
        console.error("Error fetching items:", error);
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

    // Filter items based on search term
    const filtered = items.filter((item) =>
      item.itemName.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredItems(filtered);
  };

  const addItem = (itemToAdd) => {
    if (!selectedItems.find(item => item.itemName === itemToAdd.itemName)) {
      setSelectedItems([...selectedItems, { ...itemToAdd, quantity: '' }]); // Default quantity is set to ''
      setSearchTerm(''); // Clear search term after adding
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

    const newQuantity = Math.min(Math.max(value, ''), item.maxQuantity); // Ensure quantity is between '' and maxQuantity
    const updatedItems = selectedItems.map(selectedItem =>
      selectedItem.itemName === item.itemName ? { ...selectedItem, quantity: newQuantity } : selectedItem
    );
    setSelectedItems(updatedItems);
  };

  // Validate inputs before submission
  const validateInputs = () => {
    setDepartmentError(!formData.department);
    setStatusError(!formData.status);
    setReasonError(!formData.reason);

    return formData.department && formData.status && formData.reason;
  };

  // Handle the request of data
  const handleTransfer = () => {
    if (!validateInputs()) {
      alert("Please fill in all required fields.");
      return;
    }
  
    if (selectedItems.length === '') {
      alert('Please select items to request.');
      return;
    }
  
    setSubmitting(true);
  
    const requestData = {
      name: formData.name,
      status: formData.status,
      reason: formData.reason,
      items: selectedItems,
      timestamp: formData.timestamp,
      fromDepartment: formData.fromDepartment,  // User's department from the logged-in user
      toDepartment: formData.department,        // The department where the request is being sent
    };
  
    const requestNodePath = `departments/${formData.department}/Request`;
    const newRequestRef = push(ref(database, requestNodePath));
  
    set(newRequestRef, requestData)
      .then(() => {
        alert('Request successful!');
        setFormData({ ...formData, reason: "", status: "Draft" });
        setSelectedItems([]); 
        setSubmitting(false);
      })
      .catch((error) => {
        console.error("Error transferring data:", error);
        alert("Error transferring data. Please try again.");
        setSubmitting(false);
      });
  };
  

  return (
    <div className="max-w-full mx-auto mt-2 bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Create a new Request Stock.</h1>
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
      <div className="mb-4">
        <label htmlFor="status" className="block font-bold mb-1">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleInputChange}
          className={`border ${
            statusError ? "border-red-500" : "border-gray-300"
          } rounded p-2`}
        >
          <option value="Draft">Draft</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
        {statusError && (
          <span className="text-red-500">Please select a status.</span>
        )}
      </div>
      <div className="mb-4">
        <label htmlFor="reason" className="block font-bold mb-1">
          Reason
        </label>
        <input
          id="reason"
          name="reason"
          value={formData.reason}
          onChange={handleInputChange}
          className={`border ${reasonError ? 'border-red-500' : 'border-gray-300'} rounded p-2 w-full`}
          placeholder="Enter reason for request"
        />
        {reasonError && <span className="text-red-500">Please enter a reason.</span>}
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
        {filteredItems.length > 0 ? filteredItems.map((item) => (
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
        )) : (
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

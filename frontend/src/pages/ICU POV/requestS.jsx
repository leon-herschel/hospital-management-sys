import React, { useState, useEffect } from 'react';
import { ref, get, set, push } from 'firebase/database'; // Import Firebase functions
import { database } from '../../firebase/firebase'; // Firebase configuration
import { getAuth } from 'firebase/auth'; // Import Firebase Auth

const RequestS = () => {
  const [activeTab, setActiveTab] = useState('General'); // Tab state
  const [formData, setFormData] = useState({
    name: '', // Default name
    department: 'Pharmacy', // Default department
    status: 'Draft',
    reason: '',
    timestamp: '', // Timestamp to track transfer creation
  });
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]); // To store medicines or supplies data
  const [selectedItems, setSelectedItems] = useState([]); // To store selected items
  const [searchTerm, setSearchTerm] = useState(''); // Search term state
  const [filteredItems, setFilteredItems] = useState([]); // Filtered items based on search

  // Error states
  const [departmentError, setDepartmentError] = useState(false);
  const [statusError, setStatusError] = useState(false);
  const [reasonError, setReasonError] = useState(false);
  const [submitting, setSubmitting] = useState(false); // For submission state

  // Fetch user name from Firebase Auth
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setFormData((prevData) => ({ ...prevData, name: user.displayName || user.email })); // Use displayName or email as fallback
    }
  }, []);

  // Fetch departments from Firebase
  useEffect(() => {
    const departmentRef = ref(database, 'departments');
    get(departmentRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const departmentNames = Object.keys(data).filter(dept => dept === 'CSR' || dept === 'Pharmacy'); // Filter for CSR and Pharmacy
          setDepartments(departmentNames);
        } else {
          console.log('No data available');
        }
      })
      .catch((error) => {
        console.error('Error fetching departments:', error);
      });
  }, []);

  // Fetch medicines or supplies based on selected department
  useEffect(() => {
    const fetchItems = async () => {
      const itemRef = ref(database, formData.department === 'Pharmacy' ? 'medicine' : 'supplies');
      try {
        const snapshot = await get(itemRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const itemsList = Object.values(data); // Extract the items from the selected node
          setItems(itemsList); // Set the items state
        } else {
          console.log('No data available');
        }
      } catch (error) {
        console.error('Error fetching items:', error);
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
    const filtered = items.filter(item =>
      item.itemName.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredItems(filtered);
  };

  const addItem = (itemToAdd) => {
    if (!selectedItems.find(item => item.itemName === itemToAdd.itemName)) {
      setSelectedItems([...selectedItems, { ...itemToAdd, quantity: 1 }]); // Default quantity is set to 1
      setSearchTerm(''); // Clear search term after adding
      setFilteredItems([]); // Clear filtered items
    }
  };

  const removeItem = (itemToRemove) => {
    setSelectedItems(selectedItems.filter(item => item.itemName !== itemToRemove.itemName));
  };

  const handleQuantityChange = (item, value) => {
    if (value > item.maxQuantity) {
      alert(`Cannot exceed Max Quantity of ${item.maxQuantity}`);
      return; // Stop execution if quantity exceeds
    }

    const newQuantity = Math.min(Math.max(value, 1), item.maxQuantity); // Ensure quantity is between 1 and maxQuantity
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

  // Handle the transfer of data
  const handleTransfer = () => {
    if (!validateInputs()) {
      alert('Please fill in all required fields.');
      return; // Stop execution if validation fails
    }

    if (selectedItems.length === 0) {
      alert('Please select items to transfer.');
      return; // Stop execution if no items are selected
    }

    setSubmitting(true); // Disable the button and show loading

    const transferData = {
      name: formData.name,
      status: formData.status,
      reason: formData.reason,
      items: selectedItems,
      timestamp: formData.timestamp,
    };

    // Define the path for the selected department and create a "Request" node
    const requestNodePath = `departments/${formData.department}/Request`;

    // Create a new child node under the "Request" node
    const newRequestRef = push(ref(database, requestNodePath));

    set(newRequestRef, transferData)
      .then(() => {
        alert('Transfer successful!');
        // Optionally, reset formData and selectedItems here
        setFormData({ ...formData, reason: '', status: 'Draft' }); // Reset formData
        setSelectedItems([]); // Clear selected items
        setSubmitting(false); // Re-enable the button
      })
      .catch((error) => {
        console.error('Error transferring data:', error);
        alert('Error transferring data. Please try again.');
        setSubmitting(false); // Re-enable the button
      });
  };

  return (
    <div className="max-w-full mx-auto mt-6 bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Create a new Request Stock.</h1>
        <button
          className="bg-green-500 text-white px-2 py-1 rounded"
          onClick={handleTransfer}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
      <div className="mb-4">
        <label htmlFor="department" className="block font-bold mb-1">Department</label>
        <select
          id="department"
          name="department"
          value={formData.department}
          onChange={handleInputChange}
          className={`border ${departmentError ? 'border-red-500' : 'border-gray-300'} rounded p-2`}
        >
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
        {departmentError && <span className="text-red-500">Please select a department.</span>}
      </div>
      <div className="mb-4">
        <label htmlFor="status" className="block font-bold mb-1">Status</label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleInputChange}
          className={`border ${statusError ? 'border-red-500' : 'border-gray-300'} rounded p-2`}
        >
          <option value="Draft">Draft</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
        {statusError && <span className="text-red-500">Please select a status.</span>}
      </div>
      <div className="mb-4">
        <label htmlFor="reason" className="block font-bold mb-1">Reason</label>
        <input
          id="reason"
          name="reason"
          value={formData.reason}
          onChange={handleInputChange}
          className={`border ${reasonError ? 'border-red-500' : 'border-gray-300'} rounded p-2 w-full`}
        />
        {reasonError && <span className="text-red-500">Please provide a reason.</span>}
      </div>

      {/* Items Search and Selection */}
      <div className="mb-4">
        <label htmlFor="search" className="block font-bold mb-1">Search Items</label>
        <input
          id="search"
          name="search"
          value={searchTerm}
          onChange={handleSearchChange}
          className="border border-gray-300 rounded p-2 w-full"
          placeholder="Search for items..."
        />
        <div className="mt-2">
          {filteredItems.map((item) => (
            <div key={item.itemName} className="flex justify-between items-center border-b py-2">
              <div>{item.itemName} (Max: {item.maxQuantity})</div>
              <button
                className="bg-blue-500 text-white px-2 py-1 rounded"
                onClick={() => addItem(item)}
              >
                Add
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <div className="mb-4">
          <h2 className="font-bold mb-2">Selected Items</h2>
          <ul className="space-y-2">
            {selectedItems.map((item) => (
              <li key={item.itemName} className="flex justify-between items-center">
                <span>{item.itemName} (Quantity: {item.quantity})</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={item.quantity}
                    min="1"
                    max={item.maxQuantity}
                    onChange={(e) => handleQuantityChange(item, parseInt(e.target.value))}
                    className="border border-gray-300 rounded p-1 w-16"
                  />
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => removeItem(item)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RequestS;

import React, { useState, useEffect } from 'react';
import { ref, get, set, push } from 'firebase/database'; // Import Firebase functions
import { database } from '../../firebase/firebase'; // Firebase configuration
import { getAuth } from 'firebase/auth'; // Import Firebase Auth

const Transfer = () => {
  const [activeTab, setActiveTab] = useState('General'); // Tab state
  const [formData, setFormData] = useState({
    name: '', // Default name
    department: 'Pharmacy', // Default department
    status: 'Draft',
    reason: '',
    timestamp: '', // Timestamp to track transfer creation
  });
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]); // To store medicines data
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
          const departmentNames = Object.keys(data); // Extract department names
          setDepartments(departmentNames);
        } else {
          console.log('No data available');
        }
      })
      .catch((error) => {
        console.error('Error fetching departments:', error);
      });
  }, []);

  // Fetch medicines from Firebase
  useEffect(() => {
    const medicineRef = ref(database, 'medicine');
    get(medicineRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const itemsList = Object.values(data); // Extract the items from the medicine node
          setItems(itemsList); // Set the items state
        } else {
          console.log('No data available');
        }
      })
      .catch((error) => {
        console.error('Error fetching items:', error);
      });
  }, []);

  // Set the timestamp when the component is mounted
  useEffect(() => {
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
  const handleTransfer = async () => {
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
        timestamp: formData.timestamp,
    };
  
    // Define the path for the selected department's localSupplies
    const departmentPath = `departments/${formData.department}/localSupplies`;
    const historyPath = `departments/${formData.department}/inventoryHistory`;
    const mainInventoryPath = `medicine`; // Path to the main inventory
  
    // Loop through each selected item
    for (const item of selectedItems) {
        // Push the item to the localSupplies
        const newTransferRef = push(ref(database, departmentPath));
        await set(newTransferRef, {
            ...item, // Include the item data
            ...transferData, // Include transfer data (reason, timestamp, etc.)
        });
  
        // Prepare the transfer history data
        const transferDataHistory = {
            itemName: item.itemName,
            quantity: item.quantity,
            timestamp: formData.timestamp,
            sender: formData.name, // The one who processed the transfer
        };
  
        // Push the transfer history to the inventoryHistory
        const newHistoryRef = push(ref(database, historyPath));
        await set(newHistoryRef, transferDataHistory);
  
        // Update the main inventory quantity
        const mainInventoryRef = ref(database, `${mainInventoryPath}/${item.itemName}`); // Reference to the item in the main inventory
        const snapshot = await get(mainInventoryRef); // Get current item data
  
        if (snapshot.exists()) {
            const currentData = snapshot.val();
            const currentQuantity = currentData.quantity || 0; // Get the current quantity, default to 0 if not found
            
            const updatedQuantity = Math.max(currentQuantity - item.quantity, 0); // Deduct transferred quantity
            
            // Update the main inventory with the new quantity
            await set(mainInventoryRef, {
                ...currentData,
                quantity: updatedQuantity // Set new quantity
            });
        } else {
            console.error(`Item ${item.itemName} does not exist in the main inventory.`);
        }
    }
  
    // After the transfer, reset form and state
    alert('Transfer successful!');
    setFormData({ ...formData, reason: '', status: 'Draft' });
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
          disabled={submitting} // Disable while submitting
        >
          {submitting ? 'Transferring...' : 'Transfer'}
        </button>
      </div>

      {/* Name Input */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Name:</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          readOnly // Make it read-only to prevent manual edits
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
          onClick={() => handleTabChange('General')}
          className={`px-4 py-2 ${activeTab === 'General' ? 'bg-maroon text-white' : 'bg-gray-100'}`}
        >
          General
        </button>
        <button
          onClick={() => handleTabChange('Items')}
          className={`px-4 py-2 ${activeTab === 'Items' ? 'bg-maroon text-white' : 'bg-gray-100'}`}
        >
          Items
        </button>
      </div>

      {/* General Tab Content */}
      {activeTab === 'General' && (
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-4">
            {/* To Department */}
            <div>
              <label className="block font-semibold mb-1">To Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className={`border p-2 w-full rounded ${departmentError ? 'border-red-500' : ''}`} // Show error styling
              >
                {departments.map((dept, index) => (
                  <option key={index} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {departmentError && <p className="text-red-500 text-sm">Please select a department.</p>}
            </div>

            {/* Status */}
            <div>
              <label className="block font-semibold mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={`border p-2 w-full rounded ${statusError ? 'border-red-500' : ''}`} // Show error styling
              >
                <option value="Draft">Draft</option>
                <option value="Final">Final</option>
              </select>
              {statusError && <p className="text-red-500 text-sm">Please select a status.</p>}
            </div>
          </div>

          {/* Reason Input */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Reason:</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              className={`border p-2 w-full rounded ${reasonError ? 'border-red-500' : ''}`} // Show error styling
            ></textarea>
            {reasonError && <p className="text-red-500 text-sm">Reason is required.</p>}
          </div>
        </div>
      )}

     {/* Items Tab Content */}
     {activeTab === 'Items' && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-lg">Items</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search Item"
                value={searchTerm}
                onChange={handleSearchChange}
                className="border p-2 rounded w-1/2"
              />
            </div>
          </div>

          {/* Show Filtered Items Only if Search Term Exists */}
          {searchTerm && (
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded mb-4">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <div key={index} className="flex justify-between p-2 border-b hover:bg-gray-100 cursor-pointer"
                    onClick={() => addItem(item)}
                  >
                    <span>{item.itemName}</span>
                    <span className="text-gray-500">{item.maxQuantity}</span>
                  </div>
                ))
              ) : (
                <div className="p-2 text-gray-500">No items found.</div>
              )}
            </div>
          )}

          {/* Selected Items Display in Table Format */}
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
                  <td className="border border-gray-300 p-2">{item.itemName}</td>
                  <td className="border border-gray-300 p-2">
                    <input
                      type="number"
                      min="1"
                      max={item.maxQuantity}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item, parseInt(e.target.value))}
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

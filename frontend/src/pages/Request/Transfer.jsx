import React, { useState, useEffect, useRef } from 'react';
import { ref, get, set, push, update, onValue } from 'firebase/database'; // Add onValue for real-time updates
import { database } from '../../firebase/firebase'; // Firebase configuration
import { getAuth } from 'firebase/auth'; // Firebase Auth

const Transfer = () => {
  const [activeTab, setActiveTab] = useState('General');
  const [formData, setFormData] = useState({
    name: '',
    department: 'Pharmacy',
    status: 'Draft',
    reason: '',
    timestamp: ''
  });
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]); // Will be updated in real-time
  const [selectedItems, setSelectedItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  const searchRef = useRef(''); // Ref to store search term without triggering re-renders
  const departmentRef = useRef(); // Ref to store Firebase reference for departments

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
      setFormData(prevData => ({ ...prevData, name: user.displayName || user.email }));
    }
  }, []);

  // Store Firebase ref for departments using useRef
  useEffect(() => {
    departmentRef.current = ref(database, 'departments');
    get(departmentRef.current)
      .then(snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const departmentNames = Object.keys(data);
          setDepartments(departmentNames);
        }
      })
      .catch(error => console.error('Error fetching departments:', error));
  }, []);

  // Real-time update of supplies using onValue
  useEffect(() => {
    const suppliesRef = ref(database, 'supplies');

    const unsubscribe = onValue(suppliesRef, (snapshot) => {
      if (snapshot.exists()) {
        const supplies = Object.entries(snapshot.val()).map(([key, value]) => ({
          ...value,
          itemKey: key, // Add the key (itemKey) to each item
        }));
        setItems(supplies); // Update items in real-time
      }
    });

    // Cleanup listener when the component unmounts
    return () => unsubscribe();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSearchChange = (e) => {
    searchRef.current = e.target.value; // Store the search term in useRef without causing a re-render
    const filtered = items.filter(item =>
      item.itemName.toLowerCase().includes(searchRef.current.toLowerCase())
    );
    setFilteredItems(filtered);
  };

  const addItem = (itemToAdd) => {
    if (!selectedItems.find(item => item.itemName === itemToAdd.itemName)) {
      setSelectedItems([...selectedItems, { ...itemToAdd, quantity: 1 }]);
      searchRef.current = ''; // Clear search input after adding
      setFilteredItems([]);
    }
  };

  const removeItem = (itemToRemove) => {
    setSelectedItems(selectedItems.filter(item => item.itemName !== itemToRemove.itemName));
  };

  const handleQuantityChange = (item, value) => {
    // Fetch the correct item from the database to ensure its quantity
    const mainInventoryItem = items.find(i => i.itemKey === item.itemKey);
    const maxAvailableQuantity = mainInventoryItem?.quantity || 0;

    if (value > maxAvailableQuantity) {
      alert(`Cannot exceed available quantity of ${maxAvailableQuantity}`);
      return;
    }

    // Proceed to update the selected item's quantity if it's valid
    const updatedItems = selectedItems.map(selectedItem =>
      selectedItem.itemName === item.itemName ? { ...selectedItem, quantity: value } : selectedItem
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
      alert('Please fill in all required fields.');
      return;
    }
    if (selectedItems.length === 0) {
      alert('Please select items to transfer.');
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
      // Transfer entire item data to the department's local supplies
      const departmentPath = `departments/${formData.department}/localSupplies/${item.itemKey}`;
      await set(ref(database, departmentPath), {
        ...item, // Transfer entire item data
        ...transferData, // Include the transfer data (name, reason, timestamp)
      });

      // Log the transfer in department inventory history
      const historyPath = `departments/${formData.department}/inventoryHistory`;
      const newHistoryRef = push(ref(database, historyPath));
      await set(newHistoryRef, {
        itemName: item.itemName,
        quantity: item.quantity,
        timestamp: formData.timestamp,
        sender: formData.name,
      });

      // Deduct the transferred quantity from the main inventory node
      const mainInventoryRef = ref(database, `supplies/${item.itemKey}`);
      const snapshot = await get(mainInventoryRef);
      if (snapshot.exists()) {
        const currentData = snapshot.val();
        const updatedQuantity = Math.max(currentData.quantity - item.quantity, 0); // Ensure quantity does not go below 0
        await update(mainInventoryRef, { quantity: updatedQuantity });
      } else {
        console.error(`Item ${item.itemName} does not exist in the main inventory.`);
      }
    }

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
          disabled={submitting}
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
                className={`border p-2 w-full rounded ${errorMessages.departmentError ? 'border-red-500' : ''}`}
              >
                {departments.map((dept, index) => (
                  <option key={index} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {errorMessages.departmentError && <p className="text-red-500 text-sm">Please select a department.</p>}
            </div>

            {/* Status */}
            <div>
              <label className="block font-semibold mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={`border p-2 w-full rounded ${errorMessages.statusError ? 'border-red-500' : ''}`}
              >
                <option value="Draft">Draft</option>
                <option value="Final">Final</option>
              </select>
              {errorMessages.statusError && <p className="text-red-500 text-sm">Please select a status.</p>}
            </div>
          </div>

          {/* Reason Input */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Reason:</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              className={`border p-2 w-full rounded ${errorMessages.reasonError ? 'border-red-500' : ''}`}
            ></textarea>
            {errorMessages.reasonError && <p className="text-red-500 text-sm">Reason is required.</p>}
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
                value={searchRef.current}
                onChange={handleSearchChange}
                className="border p-2 rounded w-1/2"
              />
            </div>
          </div>

          {/* Show Filtered Items */}
          {searchRef.current && (
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded mb-4">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <div key={index} className="flex justify-between p-2 border-b hover:bg-gray-100 cursor-pointer"
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
                      max={item.quantity}
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

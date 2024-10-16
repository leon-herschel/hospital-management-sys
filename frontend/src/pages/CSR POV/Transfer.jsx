import React, { useState, useEffect, useRef } from 'react';
import { ref, get, set, push, update, onValue } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { getAuth } from 'firebase/auth';

const Transfer = () => {
  const [formData, setFormData] = useState({
    name: '',
    department: 'Pharmacy',
    status: 'Draft',
    reason: '',
    timestamp: new Date().toISOString(),
  });
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessages, setErrorMessages] = useState({
    departmentError: false,
    statusError: false,
    reasonError: false,
  });

  const searchRef = useRef('');
  const departmentRef = useRef();

  // Fetch authenticated user data
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setFormData(prevData => ({ ...prevData, name: user.displayName || user.email }));
    }
  }, []);

  // Fetch department data from Firebase
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

  // Real-time update of supplies
  useEffect(() => {
    const suppliesRef = ref(database, 'departments/CSR/localSupplies');
    const unsubscribe = onValue(suppliesRef, snapshot => {
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

  const handleSearchChange = (e) => {
    searchRef.current = e.target.value;
    const filtered = items.filter(item =>
      item.itemName.toLowerCase().includes(searchRef.current.toLowerCase())
    );
    setFilteredItems(filtered);
  };

  const addItem = (itemToAdd) => {
    if (!selectedItems.find(item => item.itemName === itemToAdd.itemName)) {
      setSelectedItems([...selectedItems, { ...itemToAdd, quantity: 1 }]);
      searchRef.current = '';
      setFilteredItems([]);
    }
  };

  const removeItem = (itemToRemove) => {
    setSelectedItems(selectedItems.filter(item => item.itemName !== itemToRemove.itemName));
  };

  const handleQuantityChange = (item, value) => {
    const mainInventoryItem = items.find(i => i.itemKey === item.itemKey);
    const maxAvailableQuantity = mainInventoryItem?.quantity || 0;

    if (value > maxAvailableQuantity) {
      alert(`Cannot exceed available quantity of ${maxAvailableQuantity}`);
      return;
    }

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
      recipientDepartment: formData.department,
    };

    for (const item of selectedItems) {
      const departmentPath = `departments/${formData.department}/localSupplies/${item.itemKey}`;

      // Fetch the existing quantity in the local supplies
      const localSupplySnapshot = await get(ref(database, departmentPath));
      let newQuantity = item.quantity;

      if (localSupplySnapshot.exists()) {
        const existingData = localSupplySnapshot.val();
        newQuantity += existingData.quantity;
      }

      // Update the local supplies with the new quantity
      await set(ref(database, departmentPath), {
        ...item,
        quantity: newQuantity,
        status: formData.status,
        timestamp: formData.timestamp,
      });

      // Push transfer details to InventoryHistoryTransfer
      const historyPath = `departments/CSR/InventoryHistoryTransfer`;
      const newHistoryRef = push(ref(database, historyPath));
      await set(newHistoryRef, {
        itemKey: item.itemKey,
        itemName: item.itemName,
        quantity: item.quantity,
        timestamp: formData.timestamp,
        sender: formData.name,
        recipientDepartment: formData.department,
        reason: formData.reason,
      });

      // Update the main inventory (deduct quantity)
      const mainInventoryRef = ref(database, `departments/CSR/localSupplies/${item.itemKey}`);
      const mainInventorySnapshot = await get(mainInventoryRef);

      if (mainInventorySnapshot.exists()) {
        const currentData = mainInventorySnapshot.val();
        const updatedQuantity = Math.max(currentData.quantity - item.quantity, 0);
        await update(mainInventoryRef, { quantity: updatedQuantity });
      } else {
        console.error(`Item ${item.itemName} does not exist in the main inventory.`);
      }
    }

    alert('Transfer successful!');
    setFormData({ ...formData, reason: '', status: '' });
    setSelectedItems([]);
    setSubmitting(false);
    setIsModalOpen(false); // Close modal after transfer
  };

  const openModal = () => {
    if (validateInputs()) {
      setIsModalOpen(true);
    } else {
      alert('Please fill in all required fields before proceeding.');
    }
  };

  return (
    <div className="max-w-full mx-auto mt-2 bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Create a new stock transfer.</h1>
        <button
          className="bg-green-500 text-white px-2 py-1 rounded"
          onClick={openModal} // Open modal on click
          disabled={submitting}
        >
          Proceed
        </button>
      </div>

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

      <div className="mb-4">
        <label className="block font-semibold mb-1">Transfer Timestamp:</label>
        <p>{formData.timestamp}</p>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold text-lg mb-2">General</h2>
        <div className="grid grid-cols-2 gap-4">
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

        <div className="mb-4">
          <label className="block font-semibold mb-1">Reason for Transfer</label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            className={`border p-2 w-full rounded ${errorMessages.reasonError ? 'border-red-500' : ''}`}
          />
          {errorMessages.reasonError && <p className="text-red-500 text-sm">Please provide a reason.</p>}
        </div>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold text-lg mb-2">Select Items to Transfer</h2>
        <input
          type="text"
          placeholder="Search items..."
          onChange={handleSearchChange}
          value={searchRef.current}
          className="border p-2 w-full rounded mb-2"
        />
        <ul className="border rounded">
          {filteredItems.length === 0
            ? items.map(item => (
                <li key={item.itemKey} className="border-b last:border-b-0 p-2 flex justify-between items-center">
                  {item.itemName} (Available: {item.quantity})
                  <button
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                    onClick={() => addItem(item)}
                  >
                    Add
                  </button>
                </li>
              ))
            : filteredItems.map(item => (
                <li key={item.itemKey} className="border-b last:border-b-0 p-2 flex justify-between items-center">
                  {item.itemName} (Available: {item.quantity})
                  <button
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                    onClick={() => addItem(item)}
                  >
                    Add
                  </button>
                </li>
              ))}
        </ul>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold text-lg mb-2">Selected Items</h2>
        {selectedItems.length === 0 ? (
          <p>No items selected.</p>
        ) : (
          <ul className="border rounded">
            {selectedItems.map(item => (
              <li key={item.itemKey} className="border-b last:border-b-0 p-2 flex justify-between items-center">
                {item.itemName} (Quantity: {item.quantity})
                <div className="flex items-center">
                  <input
                    type="number"
                    value={item.quantity}
                    min="1"
                    onChange={(e) => handleQuantityChange(item, parseInt(e.target.value))}
                    className="border rounded w-16 text-center mr-2"
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
        )}
      </div>

      {/* Modal for final confirmation */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-2 right-2 text-gray-500">✖️</button>
            <h2 className="text-lg font-semibold">Confirm Transfer</h2>
            <p>Are you sure you want to proceed with the transfer?</p>
            <div className="mt-4">
              <h3 className="font-semibold">Items to Transfer:</h3>
              <ul>
                {selectedItems.map(item => (
                  <li key={item.itemKey}>
                    {item.itemName} (Quantity: {item.quantity})
                  </li>
                ))}
              </ul>
            </div>
            <button onClick={handleTransfer} className="bg-green-500 text-white px-4 py-2 mt-4 rounded" disabled={submitting}>
              {submitting ? 'Processing...' : 'Confirm Transfer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transfer;

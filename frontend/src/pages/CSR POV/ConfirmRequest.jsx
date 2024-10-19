import React, { useState, useEffect, useRef } from 'react';
import { ref, get, set, push, onValue, remove, update } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { getAuth } from 'firebase/auth';

const ConfirmRequest = ({ requestToConfirm, currentDepartment, onConfirmSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    department: currentDepartment || '',
    reason: '',
    timestamp: new Date().toLocaleString(),
  });
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const searchRef = useRef('');
  const departmentRef = useRef();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessages, setErrorMessages] = useState({
    departmentError: false,
    reasonError: false,
  });

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setFormData(prevData => ({ ...prevData, name: user.displayName || user.email }));
    }
  }, []);

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

  useEffect(() => {
    const suppliesRef = ref(database, 'departments/CSR/localSupplies');
    const unsubscribe = onValue(suppliesRef, (snapshot) => {
      if (snapshot.exists()) {
        const supplies = Object.entries(snapshot.val())
          .map(([key, value]) => ({
            ...value,
            itemKey: key,
          }));
        setItems(supplies);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (requestToConfirm) {
      setFormData(prevData => ({
        ...prevData,
        department: currentDepartment,
        reason: requestToConfirm.reason,
      }));
      setSelectedItems(requestToConfirm.items);
    }
  }, [requestToConfirm, currentDepartment]);

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
    const existingItem = selectedItems.find(item => item.itemName === itemToAdd.itemName);
    if (existingItem) {
      alert('Item already added.');
      return;
    }

    const mainInventoryItem = items.find(i => i.itemKey === itemToAdd.itemKey);
    if (mainInventoryItem && mainInventoryItem.quantity > 0) {
      setSelectedItems([...selectedItems, { ...itemToAdd, quantity: 1 }]);
      searchRef.current = '';
      setFilteredItems([]);
    } else {
      alert('Item is not available in sufficient quantity.');
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
    const { department, reason } = formData;
    setErrorMessages({
      departmentError: !department,
      reasonError: !reason,
    });
    return department && reason;
  };

  const handleConfirm = async () => {
    if (!validateInputs()) {
      alert('Please fill in all required fields.');
      return;
    }
    if (selectedItems.length === 0) {
      alert('Please select items to confirm.');
      return;
    }

    setSubmitting(true);

    try {
      for (const item of selectedItems) {
        const confirmationData = {
          itemName: item.itemName,
          quantity: item.quantity,
          reason: formData.reason,
          recipientDepartment: formData.department,
          sender: formData.name,
          timestamp: formData.timestamp
        };

        const historyPath = `supplyHistoryTransfer`;
        const newHistoryRef = push(ref(database, historyPath));
        await set(newHistoryRef, confirmationData);

        const departmentPath = `departments/${formData.department}/localSupplies/${item.itemKey}`;
        const localSupplySnapshot = await get(ref(database, departmentPath));
        let newQuantity = item.quantity;

        if (localSupplySnapshot.exists()) {
          const existingData = localSupplySnapshot.val();
          newQuantity += existingData.quantity;
        }

        await set(ref(database, departmentPath), {
          ...item,
          itemKey: item.itemKey,
          quantity: newQuantity,
          timestamp: formData.timestamp,
        });

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

      // Remove the confirmed request from Firebase
      const requestRef = ref(database, `departments/CSR/Request/${requestToConfirm.requestId}`);
      await remove(requestRef);

      alert('Confirmation successful!');
      setFormData({ ...formData, reason: '' });
      setSelectedItems([]);

      if (onConfirmSuccess) {
        onConfirmSuccess();
      }

    } catch (error) {
      console.error('Error confirming request:', error);
    }

    setSubmitting(false);
  };

  return (
    <div className="max-w-full mx-auto mt-6 bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Confirm Item Request</h1>
        <button
          className="bg-green-500 text-white px-2 py-1 rounded"
          onClick={handleConfirm}
          disabled={submitting}
        >
          {submitting ? 'Confirming...' : 'Confirm'}
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
        <label className="block font-semibold mb-1">Confirmation Timestamp:</label>
        <p>{formData.timestamp}</p>
      </div>

      {/* Department (Non-editable) */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">To Department</label>
        <input
          type="text"
          name="department"
          value={formData.department}
          readOnly
          className="border p-2 w-full rounded"
        />
      </div>

      {/* General Input Fields */}
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-4">
        <div className="mb-4">
        <label className="block font-semibold mb-1">Reason</label>
        <input
          type="text"
          name="department"
          value={formData.reason}
          readOnly
          className="border p-2 w-full rounded"
        />
      </div>
        </div>
      </div>

      {/* Item Selection Section */}
      <div className="mb-4">
        <h2 className="font-semibold text-lg mb-2">Search Items</h2>
        <input
          type="text"
          placeholder="Search items..."
          onChange={handleSearchChange}
          className="border p-2 w-full rounded mb-2"
        />

        <div className="flex flex-col">
          {filteredItems.length > 0 ? filteredItems.map(item => (
            <div key={item.itemKey} className="flex justify-between items-center mb-2">
              <span>{item.itemName} (Available: {item.quantity})</span>
              <button
                onClick={() => addItem(item)}
                className="bg-blue-500 text-white px-2 py-1 rounded"
              >
                Add
              </button>
            </div>
          )) : (
            items.map(item => (
              <div key={item.itemKey} className="flex justify-between items-center mb-2">
                <span>{item.itemName} (Available: {item.quantity})</span>
                <button
                  onClick={() => addItem(item)}
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Add
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Selected Items Section */}
      <div className="mb-4">
        <h2 className="font-semibold text-lg mb-2">Selected Items</h2>
        {selectedItems.length > 0 ? (
          selectedItems.map(item => (
            <div key={item.itemKey} className="flex justify-between items-center mb-2">
              <span>{item.itemName}</span>
              <input
                type="number"
                value={item.quantity}
                min="1"
                max={items.find(i => i.itemKey === item.itemKey)?.quantity || 0}
                onChange={(e) => handleQuantityChange(item, parseInt(e.target.value))}
                className="border p-1 rounded w-16 text-center"
              />
              <button
                onClick={() => removeItem(item)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Remove
              </button>
            </div>
          ))
        ) : (
          <p>No items selected.</p>
        )}
      </div>
    </div>
  );
};

export default ConfirmRequest;

import React, { useState, useEffect, useRef } from 'react';
import { ref, get, set, push, onValue, update, remove } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { getAuth } from 'firebase/auth';

const ConfirmRequest = ({ requestToConfirm, currentDepartment, onConfirmSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    department: currentDepartment || '',
    reason: '',
    timestamp: new Date().toLocaleString(),
  });
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const searchRef = useRef('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessages, setErrorMessages] = useState({
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
    const itemsRef = ref(database, 'departments/CSR/localSupplies');
    const unsubscribe = onValue(itemsRef, (snapshot) => {
      if (snapshot.exists()) {
        const itemsData = Object.entries(snapshot.val())
          .map(([key, value]) => ({
            ...value,
            itemKey: key,
          }));
        setItems(itemsData);
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
      alert(`Cannot exceed available quantity.`);
      return;
    }

    const updatedItems = selectedItems.map(selectedItem =>
      selectedItem.itemName === item.itemName ? { ...selectedItem, quantity: value } : selectedItem
    );
    setSelectedItems(updatedItems);
  };

  const validateInputs = () => {
    const { reason } = formData;
    setErrorMessages({
      reasonError: !reason,
    });
    return reason;
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
          timestamp: formData.timestamp,
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

      <div className="mb-4">
        <label className="block font-semibold mb-1">Name:</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          readOnly
          className="border p-2 w-full rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Confirmation Timestamp:</label>
        <p>{formData.timestamp}</p>
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">To Department</label>
        <input
          type="text"
          name="department"
          value={formData.department}
          readOnly
          className="border p-2 w-full rounded bg-gray-200 text-gray-700"
        />
      </div>

      <div className="mb-4">
        <h2 className="font-semibold text-lg mb-2">General</h2>
        <label className="block font-semibold mb-1" disabled>Reason</label>
        <input
          type="text"
          name="reason"
          value={formData.reason}
          onChange={e => handleInputChange(e)}
          className={`border p-2 w-full rounded ${errorMessages.reasonError ? 'border-red-500' : ''}`}
        />
        {errorMessages.reasonError && (
          <p className="text-red-500 text-sm">Please provide a reason.</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Search Items</label>
        <input
          type="text"
          name="searchItem"
          placeholder="Search for items"
          value={searchRef.current}
          onChange={handleSearchChange}
          className="border p-2 w-full rounded"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {filteredItems.map(item => (
          <button
            key={item.itemKey}
            onClick={() => addItem(item)}
            className="bg-blue-500 text-white px-2 py-1 rounded"
          >
            {item.itemName} ({item.quantity} in stock)
          </button>
        ))}
      </div>

      {selectedItems.length > 0 && (
        <div className="mb-4">
          <h2 className="font-semibold text-lg mb-2">Selected Items</h2>
          <table className="w-full border-collapse border">
            <thead>
              <tr>
                <th className="border p-2">Item Name</th>
                <th className="border p-2">Quantity</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {selectedItems.map((item, index) => (
                <tr key={index}>
                  <td className="border p-2">{item.itemName}</td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item, parseInt(e.target.value))}
                      className="border p-1 w-16 rounded"
                    />
                  </td>
                  <td className="border p-2">
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

export default ConfirmRequest;

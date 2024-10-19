import { useState, useEffect, useRef } from 'react';
import { ref, get, set, push, update, onValue } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { getAuth } from 'firebase/auth';
import AccessDenied from "../ErrorPages/AccessDenied";
import { useAuth } from "../../context/authContext/authContext";

const Transfer = () => {
  const { department } = useAuth(); 
  const [formData, setFormData] = useState({
    name: '',
    department: 'Pharmacy',
    reason: '',
    timestamp: new Date().toLocaleString() 
  });
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessages, setErrorMessages] = useState({
    departmentError: false,
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
    const searchQuery = searchRef.current.toLowerCase(); // Save the lowercase search query
  
    const filtered = items.filter(item =>
      item.itemName && item.itemName.toLowerCase().includes(searchQuery) // Check if itemName exists
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
    const { department, reason } = formData;
    setErrorMessages({
      departmentError: !department,
      reasonError: !reason,
    });
    return department && reason;
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
        timestamp: formData.timestamp,
      });

      // Push transfer details to InventoryHistoryTransfer
      const historyPath = `supplyHistoryTransfer`;
      const newHistoryRef = push(ref(database, historyPath));
      await set(newHistoryRef, {
        itemKey: item.itemKey,
        itemName: item.itemName,
        itemBrand: item.brand, // Include itemBrand here
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
    setFormData({ ...formData, reason: '' });
    setSelectedItems([]);
    setSubmitting(false);
  };

  if (department !== "CSR" && department !== "Admin") {
    return <AccessDenied />;
  }

  
  

  return (
    <div className="max-w-full mx-auto mt-2 bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Create a new stock transfer.</h1>
        <button
          className="ml-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
          onClick={handleTransfer} // Call handleTransfer directly
          disabled={submitting}
        >
          {submitting ? 'Processing...' : 'Transfer'}
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
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1">Reason for transfer</label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            className={`border p-2 w-full rounded ${errorMessages.reasonError ? 'border-red-500' : ''}`}
          />
          {errorMessages.reasonError && <p className="text-red-500 text-sm">Please provide a reason for the transfer.</p>}
        </div>
      </div>

      <div>
        <label className="block font-semibold mb-1">Search for Items to Transfer</label>
        <input
          type="text"
          value={searchRef.current}
          onChange={handleSearchChange}
          className="border p-2 w-full rounded mb-4"
          placeholder="Search by item name"
        />
        {filteredItems.length > 0 && (
          <ul className="border rounded p-2 max-h-40 overflow-y-auto">
            {filteredItems.map(item => (
              <li
                key={item.itemKey}
                className="cursor-pointer hover:bg-gray-200 p-2 rounded"
                onClick={() => addItem(item)}
              >
                {item.itemName} (Available: {item.quantity})
              </li>
            ))}
            </ul>
          )}
        </div>
        <div>
          
  <h2 className="font-semibold text-lg mb-2">Selected Items for Transfer</h2>
  {selectedItems.length > 0 ? (
    <table className="border rounded w-full mb-4">
      <thead>
        <tr className="bg-gray-200">
          <th className="text-left p-2">Name</th>
          <th className="text-left p-2">Quantity</th>
          <th className="text-left p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {selectedItems.map((item, index) => (
          <tr key={index} className="border-b">
            <td className="p-2">{item.itemName}</td>
            <td className="p-2">
              <input
                type="number"
                min="1"
                max={items.find(i => i.itemKey === item.itemKey)?.quantity || 0}
                value={item.quantity}
                onChange={(e) => handleQuantityChange(item, parseInt(e.target.value))}
                className="border p-1 w-20 rounded"
              />
            </td>
            <td className="p-2">
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
  ) : (
    <p className="text-gray-500 mb-4">No items selected.</p>
  )}
</div>
      </div>
    );
  };
  
  export default Transfer;
  

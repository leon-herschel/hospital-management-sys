import { useState, useEffect, useRef } from 'react';
import { ref, get, set, push, update, onValue } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { getAuth } from 'firebase/auth';
import AccessDenied from "../ErrorPages/AccessDenied";
import { useAuth } from "../../context/authContext/authContext";

const TransferMed = () => {
  const { department } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    department: 'Pharmacy',
    reason: '',
    timestamp: new Date().toLocaleString() // Add current timestamp on initial load
  });
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]); // Will be updated in real-time with only supplies
  const [selectedItems, setSelectedItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  const searchRef = useRef(''); // Ref to store search term without triggering re-renders
  const departmentRef = useRef(); // Ref to store Firebase reference for departments

  const [submitting, setSubmitting] = useState(false);
  const [errorMessages, setErrorMessages] = useState({
    departmentError: false,
    reasonError: false,
  });

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


  // Real-time update of medicine supplies using onValue
  useEffect(() => {
    const medicineRef = ref(database, 'departments/Pharmacy/localMeds');

    // Real-time listener
    const unsubscribe = onValue(medicineRef, (snapshot) => {
      if (snapshot.exists()) {
        const medicines = Object.entries(snapshot.val())
          .map(([key, value]) => ({
            ...value,
            itemKey: key,
          }));
        setItems(medicines);  // Update state with real-time data
      }
    });

    return () => unsubscribe();  // Cleanup listener on unmount
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

    const transferData = {
      name: formData.name,
      reason: formData.reason,
      timestamp: formData.timestamp,
      recipientDepartment: formData.department, // Ensure recipientDepartment is included
    };

    for (const item of selectedItems) {
      const departmentPath = `departments/${formData.department}/localMeds/${item.itemKey}`;

      // Fetch the existing quantity in the local supplies
      const localSupplySnapshot = await get(ref(database, departmentPath));
      let newQuantity = item.quantity;

      if (localSupplySnapshot.exists()) {
        // Add to the existing quantity if the item already exists
        const existingData = localSupplySnapshot.val();
        newQuantity += existingData.quantity;
      }

      // Update the local supplies with the new quantity without including recipientDepartment and reason
      await set(ref(database, departmentPath), {
        ...item,
        quantity: newQuantity,
        timestamp: formData.timestamp, // Timestamp remains here
      });

      // Ensure each transfer is added as a new entry in InventoryTransferHistory
      const historyPath = `medicineTransferHistory`;
      const newHistoryRef = push(ref(database, historyPath)); // Use push to generate a unique key
      await set(newHistoryRef, {
        itemName: item.itemName,
        quantity: item.quantity,
        timestamp: formData.timestamp,
        sender: formData.name,
        recipientDepartment: formData.department, // Include recipientDepartment in the history
        reason: formData.reason, // Include reason in the history
      });

      // Update the main inventory (deduct quantity)
      const mainInventoryRef = ref(database, `departments/Pharmacy/localMeds/${item.itemKey}`);
      const mainInventorySnapshot = await get(mainInventoryRef);

      if (mainInventorySnapshot.exists()) {
        const currentData = mainInventorySnapshot.val();
        const updatedQuantity = currentData.quantity - item.quantity;

        if (updatedQuantity < 0) {
          console.error(`Not enough stock in Pharmacy for item: ${item.itemName}`);
        } else {
          // Update the quantity of the item in Pharmacy
          await update(mainInventoryRef, { quantity: updatedQuantity });
        }
      } else {
        console.error(`Item ${item.itemName} does not exist in Pharmacy's inventory.`);
      }

    }

    alert('Transfer successful!');
    setFormData({ ...formData, reason: '' });
    setSelectedItems([]);
    setSubmitting(false);
  };

  if (department !== "Pharmacy" && department !== "Admin") {
    return <AccessDenied />;
  }

  return (
    <div className="max-w-full mx-auto mt-2 bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Create a new stock transfer.</h1>
        <button
          className="ml-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
          onClick={handleTransfer}
          disabled={submitting}
        >
          {submitting ? 'Transferring...' : 'Transfer'}
        </button>
      </div>

      {/* Name Input */}
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

      {/* Timestamp Display */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Transfer Timestamp:</label>
        <p>{formData.timestamp}</p>
      </div>

      {/* General Input Fields */}
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

        {/* Reason Input */}
        <div className="mb-4">
          <label className="block font-semibold mb-1">Reason for transfer</label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            className={`border p-2 w-full rounded ${errorMessages.reasonError ? 'border-red-500' : ''}`}
          />
          {errorMessages.reasonError && <p className="text-red-500 text-sm">Please provide a reason for transfer.</p>}
        </div>
      </div>

      {/* Search Medicine */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Search Medicine:</label>
        <input
          type="text"
          value={searchRef.current}
          onChange={handleSearchChange}
          className="border p-2 w-full rounded"
        />
        <p className="text-gray-500 text-sm">Search for medicine to add to the transfer list.</p>
      </div>

      {/* Filtered Items */}
      {filteredItems.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold mb-1">Results:</h3>
          <ul className="border rounded p-2">
            {filteredItems.map((item, index) => (
              <li key={index} className="mb-2">
                <div className="flex justify-between">
                  <span>{item.itemName}</span>
                  <span>Available: {item.quantity}</span>
                  <button
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                    onClick={() => addItem(item)}
                  >
                    Add
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold mb-1">Selected Items:</h3>
          <table className="border rounded w-full">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Quantity</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {selectedItems.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="border px-4 py-2">{item.itemName}</td>
                  <td className="border px-4 py-2">
                    <input
                      type="number"
                      value={item.quantity}
                      min={1}
                      max={items.find(i => i.itemKey === item.itemKey)?.quantity || 0}
                      onChange={(e) => handleQuantityChange(item, parseInt(e.target.value))}
                      className="border p-1 w-20 rounded"
                    />
                  </td>
                  <td className="border px-4 py-2">
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

export default TransferMed;

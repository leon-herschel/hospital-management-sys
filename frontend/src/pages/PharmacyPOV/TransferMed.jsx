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
    timestamp: new Date().toLocaleString()
  });
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const searchRef = useRef('');
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
    const departmentRef = ref(database, "departments");
    get(departmentRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const departmentNames = Object.keys(data).filter(
            (dept) => dept === "COVID UNIT" || dept === "ER" || dept === "ICU"
          );
          setDepartments(departmentNames);
        } else {
          console.log("No data available");
        }
      })
      .catch((error) => {
        console.error("Error fetching departments:", error);
      });
  }, []);

  useEffect(() => {
    const medicineRef = ref(database, 'departments/Pharmacy/localMeds');
    const unsubscribe = onValue(medicineRef, (snapshot) => {
      if (snapshot.exists()) {
        const medicines = Object.entries(snapshot.val())
          .map(([key, value]) => ({
            ...value,
            itemKey: key,
          }));
        setItems(medicines);
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
      recipientDepartment: formData.department,
    };

    for (const item of selectedItems) {
      const departmentPath = `departments/${formData.department}/localMeds/${item.itemKey}`;
      const localSupplySnapshot = await get(ref(database, departmentPath));
      let newQuantity = item.quantity;

      if (localSupplySnapshot.exists()) {
        const existingData = localSupplySnapshot.val();
        newQuantity += existingData.quantity;
      }

      await set(ref(database, departmentPath), {
        ...item,
        quantity: newQuantity,
        timestamp: formData.timestamp,
      });

      const historyPath = `medicineTransferHistory`;
      const newHistoryRef = push(ref(database, historyPath));
      await set(newHistoryRef, {
        itemName: item.itemName,
        quantity: item.quantity,
        timestamp: formData.timestamp,
        sender: formData.name,
        recipientDepartment: formData.department,
        reason: formData.reason,
      });

      const mainInventoryRef = ref(database, `departments/Pharmacy/localMeds/${item.itemKey}`);
      const mainInventorySnapshot = await get(mainInventoryRef);

      if (mainInventorySnapshot.exists()) {
        const currentData = mainInventorySnapshot.val();
        const updatedQuantity = currentData.quantity - item.quantity;

        if (updatedQuantity < 0) {
          console.error(`Not enough stock in Pharmacy for item: ${item.itemName}`);
        } else {
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
          <input
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            className={`border p-2 w-full rounded ${errorMessages.reasonError ? 'border-red-500' : ''}`}
          />
          {errorMessages.reasonError && <p className="text-red-500 text-sm">Please provide a reason for transfer.</p>}
        </div>
      </div>

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

      {selectedItems.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold mb-1">To be Transfer Medicines:</h3>
          <table className="border rounded w-full">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2">Medicine Name</th>
                <th className="border px-4 py-2">Quantity</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {selectedItems.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="border px-4 py-2">
                    <select
                      value={item.itemKey}
                      onChange={(e) => addItem(items.find(i => i.itemKey === e.target.value))}
                      className="border p-2 w-full rounded"
                    >
                      <option value="" disabled>
                        Select Medicine
                      </option>
                      {items.map((medItem) => (
                        <option key={medItem.itemKey} value={medItem.itemKey}>
                          {medItem.itemName} (Max: {medItem.quantity})
                        </option>
                      ))}
                    </select>
                  </td>
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

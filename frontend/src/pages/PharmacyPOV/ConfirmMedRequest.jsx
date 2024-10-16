import React, { useState, useEffect, useRef } from 'react';
import { ref, get, set, push, onValue, update } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { getAuth } from 'firebase/auth';

const ConfirmMedRequest = ({ requestToConfirm }) => {
  const [formData, setFormData] = useState({
    name: '',
    department: 'Pharmacy',
    reason: '',
    timestamp: new Date().toLocaleString(),
  });
  const [departments, setDepartments] = useState([]);
  const [medications, setMedications] = useState([]); // Store all items from 'medications'
  const [selectedMedications, setSelectedMedications] = useState([]); // Selected medications by the user
  const [filteredMedications, setFilteredMedications] = useState([]);

  const searchRef = useRef('');
  const departmentRef = useRef();
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

  // Real-time update of medications using onValue
  useEffect(() => {
    const medicationsRef = ref(database, 'departments/Pharmacy/localMeds');
    const unsubscribe = onValue(medicationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const meds = Object.entries(snapshot.val())
          .map(([key, value]) => ({
            ...value,
            itemKey: key,
          }));
        setMedications(meds); // Set medications from 'localMeds'
      }
    });

    return () => unsubscribe();
  }, []);

  // Set form data and selected medications based on requestToConfirm prop
  useEffect(() => {
    if (requestToConfirm) {
      setFormData(prevData => ({
        ...prevData,
        department: requestToConfirm.department,
        reason: requestToConfirm.reason,
      }));
      setSelectedMedications(requestToConfirm.items);
    }
  }, [requestToConfirm]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSearchChange = (e) => {
    searchRef.current = e.target.value;
    const filtered = medications.filter(med =>
      med.itemName.toLowerCase().includes(searchRef.current.toLowerCase())
    );
    setFilteredMedications(filtered);
  };

  const addMedication = (medToAdd) => {
    const existingMed = selectedMedications.find(med => med.itemName === medToAdd.itemName);
    if (existingMed) {
      alert('Medicine already added.');
      return;
    }

    // Check available quantity from 'medications'
    const mainInventoryMed = medications.find(m => m.itemKey === medToAdd.itemKey);
    if (mainInventoryMed && mainInventoryMed.quantity > 0) {
      setSelectedMedications([...selectedMedications, { ...medToAdd, quantity: 1 }]); // Add with default quantity
      searchRef.current = '';
      setFilteredMedications([]);
    } else {
      alert('Medicine is not available in sufficient quantity.');
    }
  };

  const removeMedication = (medToRemove) => {
    setSelectedMedications(selectedMedications.filter(med => med.itemName !== medToRemove.itemName));
  };

  const handleQuantityChange = (med, value) => {
    const mainInventoryMed = medications.find(m => m.itemKey === med.itemKey);
    const maxAvailableQuantity = mainInventoryMed?.quantity || 0;

    if (value > maxAvailableQuantity) {
      alert(`Cannot exceed available quantity.`);
      return;
    }

    const updatedMeds = selectedMedications.map(selectedMed =>
      selectedMed.itemName === med.itemName ? { ...selectedMed, quantity: value } : selectedMed
    );
    setSelectedMedications(updatedMeds);
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
    if (selectedMedications.length === 0) {
      alert('Please select medications to confirm.');
      return;
    }

    setSubmitting(true);

    const confirmationData = {
      name: formData.name,
      reason: formData.reason,
      timestamp: formData.timestamp,
      recipientDepartment: formData.department,
    };

    // Push the confirmation data to history
    const historyPath = `medicineHistoryTransfer`; // Update the path for confirmation history
    const newHistoryRef = push(ref(database, historyPath));
    await set(newHistoryRef, confirmationData);

    // Iterate over selected medications and update local and main inventory
    for (const med of selectedMedications) {
      const departmentPath = `departments/${formData.department}/localMeds/${med.itemKey}`;

      // Fetch the existing quantity in the local inventory
      const localMedSnapshot = await get(ref(database, departmentPath));
      let newQuantity = med.quantity;

      if (localMedSnapshot.exists()) {
        const existingData = localMedSnapshot.val();
        newQuantity += existingData.quantity;
      }

      // Update the local inventory with the new quantity
      await set(ref(database, departmentPath), {
        ...med,
        itemKey: med.itemKey,
        quantity: newQuantity,
        timestamp: formData.timestamp,
      });

      // Deduct the quantity from the main inventory in 'localMeds'
      const mainInventoryRef = ref(database, `departments/Pharmacy/localMeds/${med.itemKey}`);
      const mainInventorySnapshot = await get(mainInventoryRef);

      if (mainInventorySnapshot.exists()) {
        const currentData = mainInventorySnapshot.val();
        const updatedQuantity = Math.max(currentData.quantity - med.quantity, 0); // Deduct the medicine quantity
        await update(mainInventoryRef, { quantity: updatedQuantity }); // Update the new quantity in the database
      } else {
        console.error(`Medicine ${med.itemName} does not exist in the main inventory.`);
      }
    }

    alert('Confirmation successful!');
    setFormData({ ...formData, reason: '' });
    setSelectedMedications([]);
    setSubmitting(false);
  };

  return (
    <div className="max-w-full mx-auto mt-6 bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Confirm Medicine Request</h1>
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
            {errorMessages.departmentError && (
              <p className="text-red-500 text-sm">Please select a department.</p>
            )}
          </div>

          <div>
            <label className="block font-semibold mb-1">Reason</label>
            <input
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              className={`border p-2 w-full rounded ${errorMessages.reasonError ? 'border-red-500' : ''}`}
            />
            {errorMessages.reasonError && (
              <p className="text-red-500 text-sm">Please provide a reason.</p>
            )}
          </div>
        </div>
      </div>

      {/* Medications Section */}
      <div className="mb-4">
        <h2 className="font-semibold text-lg mb-2">Medications</h2>

        {/* Search Field */}
        <input
          type="text"
          value={searchRef.current}
          onChange={handleSearchChange}
          placeholder="Search medications"
          className="border p-2 w-full rounded mb-4"
        />

        {/* Filtered Medications */}
        <ul>
          {filteredMedications.map((med, index) => (
            <li
              key={index}
              className="bg-gray-100 p-2 my-2 rounded cursor-pointer hover:bg-gray-200"
              onClick={() => addMedication(med)}
            >
              {med.itemName} - {med.quantity} available
            </li>
          ))}
        </ul>
      </div>

      {/* Selected Medications */}
      <div className="mb-4">
        <h2 className="font-semibold text-lg mb-2">Selected Medications</h2>
        {selectedMedications.length === 0 && <p>No medications selected yet.</p>}

        {selectedMedications.map((med, index) => (
          <div key={index} className="bg-gray-100 p-2 my-2 rounded">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{med.itemName}</p>
                <p className="text-sm">Max available: {medications.find(m => m.itemKey === med.itemKey)?.quantity || 0}</p>
              </div>
              <button
                className="bg-red-500 text-white px-2 py-1 rounded"
                onClick={() => removeMedication(med)}
              >
                Remove
              </button>
            </div>

            {/* Quantity Input */}
            <div className="mt-2">
              <label className="block text-sm">Quantity:</label>
              <input
                type="number"
                value={med.quantity}
                onChange={(e) => handleQuantityChange(med, parseInt(e.target.value))}
                className="border p-2 rounded w-full"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfirmMedRequest;

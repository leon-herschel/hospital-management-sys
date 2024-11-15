import React, { useState, useEffect, useRef } from 'react';
import { ref, get, set, push, onValue, update, remove } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { getAuth } from 'firebase/auth';

const ConfirmMedRequest = ({ requestToConfirm, currentDepartment, onConfirmSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    department: currentDepartment || '',
    reason: '',
    timestamp: new Date().toLocaleString(),
  });
  const [medications, setMedications] = useState([]);
  const [selectedMedications, setSelectedMedications] = useState([]);
  const [filteredMedications, setFilteredMedications] = useState([]);
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
    const medicationsRef = ref(database, 'departments/Pharmacy/localMeds');
    const unsubscribe = onValue(medicationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const meds = Object.entries(snapshot.val())
          .map(([key, value]) => ({
            ...value,
            itemKey: key,
          }));
        setMedications(meds);
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
      setSelectedMedications(requestToConfirm.items);
    }
  }, [requestToConfirm, currentDepartment]);

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

    const mainInventoryMed = medications.find(m => m.itemKey === medToAdd.itemKey);
    if (mainInventoryMed && mainInventoryMed.quantity > 0) {
      setSelectedMedications([...selectedMedications, { ...medToAdd, quantity: 1 }]);
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
    if (selectedMedications.length === 0) {
      alert('Please select medications to confirm.');
      return;
    }

    setSubmitting(true);

    try {
      for (const med of selectedMedications) {
        const confirmationData = {
          itemName: med.itemName,
          quantity: med.quantity,
          reason: formData.reason,
          recipientDepartment: formData.department,
          sender: formData.name,
          timestamp: formData.timestamp
        };

        const historyPath = `medicineTransferHistory`;
        const newHistoryRef = push(ref(database, historyPath));
        await set(newHistoryRef, confirmationData);

        const departmentPath = `departments/${formData.department}/localMeds/${med.itemKey}`;
        const localMedSnapshot = await get(ref(database, departmentPath));
        let newQuantity = med.quantity;

        if (localMedSnapshot.exists()) {
          const existingData = localMedSnapshot.val();
          newQuantity += existingData.quantity;
        }

        await set(ref(database, departmentPath), {
          ...med,
          itemKey: med.itemKey,
          quantity: newQuantity,
          timestamp: formData.timestamp,
        });

        const mainInventoryRef = ref(database, `departments/Pharmacy/localMeds/${med.itemKey}`);
        const mainInventorySnapshot = await get(mainInventoryRef);

        if (mainInventorySnapshot.exists()) {
          const currentData = mainInventorySnapshot.val();
          const updatedQuantity = Math.max(currentData.quantity - med.quantity, 0);
          await update(mainInventoryRef, { quantity: updatedQuantity });
        } else {
          console.error(`Medicine ${med.itemName} does not exist in the main inventory.`);
        }
      }

      const requestRef = ref(database, `departments/Pharmacy/Request/${requestToConfirm.requestId}`);
      await remove(requestRef);

      alert('Confirmation successful!');
      setFormData({ ...formData, reason: '' });
      setSelectedMedications([]);

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
        <h1 className="text-xl font-bold">Confirm Medicine Request</h1>
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

      <div className="mb-4">
        <label className="block font-semibold mb-1">Search Medicines</label>
        <input
          type="text"
          name="searchItem"
          placeholder="Search for medicines"
          value={searchRef.current}
          onChange={handleSearchChange}
          className="border p-2 w-full rounded"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {filteredMedications.map(med => (
          <button
            key={med.itemKey}
            onClick={() => addMedication(med)}
            className="bg-blue-500 text-white px-2 py-1 rounded"
          >
            {med.itemName} ({med.quantity} in stock)
          </button>
        ))}
      </div>

      {selectedMedications.length > 0 && (
        <div className="mb-4">
          <h2 className="font-semibold text-lg mb-2">Requested Medicine</h2>
          <table className="w-full border-collapse border">
            <thead>
              <tr>
                <th className="border p-2">Medicine Name</th>
                <th className="border p-2">Quantity</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {selectedMedications.map((med, index) => (
                <tr key={index}>
                  <td className="border p-2">{med.itemName}</td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={med.quantity}
                      onChange={(e) => handleQuantityChange(med, parseInt(e.target.value))}
                      className="border p-1 w-16 rounded"
                    />
                  </td>
                  <td className="border p-2">
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded"
                      onClick={() => removeMedication(med)}
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

export default ConfirmMedRequest;

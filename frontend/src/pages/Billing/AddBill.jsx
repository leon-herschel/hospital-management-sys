import React, { useState } from 'react';
import { ref, push, set } from 'firebase/database';
import { database } from '../../firebase/firebase';

const AddBillingModal = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState('');

  const handleAddBilling = async (e) => {
    e.preventDefault();
    if (!amount) {
      alert('Please fill in the amount field');
      return;
    }

    try {
      const billingRef = ref(database, 'billing'); // Change 'users' to 'billing'
      const newBillingRef = push(billingRef);

      await set(newBillingRef, {
        amount,
      });

      alert('Amount added successfully');
      // Clear input field
      setAmount('');
      onClose(); // Close the modal after adding the amount
    } catch (error) {
      alert('Error adding amount: ' + error.message);
    }
  };

  if (!isOpen) return null; // If modal is not open, return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
        <h2 className="text-2xl font-bold mb-4">Add Billing</h2>
        <form onSubmit={handleAddBilling}>
          <div className="mb-4">
            <label className="block text-gray-700">Amount:</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border rounded w-full py-2 px-3"
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
              Add Billing
            </button>
            <button type="button" className="bg-gray-500 text-white px-4 py-2 rounded" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBillingModal;

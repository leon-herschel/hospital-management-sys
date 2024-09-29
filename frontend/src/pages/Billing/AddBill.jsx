import React, { useState } from 'react';
import { ref, push, set } from 'firebase/database';
import { database } from '../../firebase/firebase';

const AddBillingModal = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false); // Add submitting state

  const handleAddBilling = async (e) => {
    e.preventDefault();
    if (!amount) {
      alert('Please fill in the amount field');
      return;
    }

    setSubmitting(true); // Disable the button and show loading

    try {
      const billingRef = ref(database, 'billing');
      const newBillingRef = push(billingRef);

      await set(newBillingRef, {
        amount,
      });

      alert('Amount added successfully');
      setAmount(''); // Clear input field
      onClose(); // Close the modal after adding the amount
    } catch (error) {
      alert('Error adding amount: ' + error.message);
    } finally {
      setSubmitting(false); // Re-enable the button after the operation completes
    }
  };

  if (!isOpen) return null; // If modal is not open, return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
        <h2 className="text-2xl font-bold mb-4">Add Billing</h2>
        <form onSubmit={handleAddBilling}>
          <div className="mb-4">
            <label htmlFor="amount" className="block text-gray-700 mb-2">Amount</label>
            <input
              type="text"
              id="amount"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={submitting} // Disable input when submitting
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
              disabled={submitting} // Disable the button when submitting
            >
              {submitting ? 'Submitting...' : 'Add Billing'} {/* Show loading text */}
            </button>
            <button
              type="button"
              className="bg-gray-500 text-white px-4 py-2 rounded"
              onClick={onClose}
              disabled={submitting} // Disable the cancel button when submitting
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBillingModal;

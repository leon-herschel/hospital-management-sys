import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, get, update } from 'firebase/database';
import { database } from '../../firebase/firebase';

const ViewBill = ({ billing, patients, onClose }) => {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (billing) {
      setPaymentMethod(billing.paymentMethod || '');
      setPaymentDate(billing.paymentDate || '');
    }
  }, [billing]);

  const handleUpdatePayment = async () => {
    if (!paymentMethod || !paymentDate) {
      alert('Please fill out all fields');
      return;
    }

    const billingRef = ref(database, `billing/${billing.id}`);
    await update(billingRef, {
      paymentMethod,
      paymentDate,
      status: 'Paid',
    });

    alert('Payment details updated successfully!');

    // Update the billing status in parent component (optional)
    // onPaymentUpdated(billing.id); // You can implement this function to handle updates

    onClose(); // Close the modal after updating
    navigate('/billing');
  };

  const handleGenerateReceipt = () => {
    alert('Receipt generated for billing ID: ' + billing.id);
  };

  if (!billing) {
    return <div>Loading...</div>;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">Billing Details</h2>
        <p><strong>Patient Name:</strong> {patients[billing.patientId]}</p> {/* Displaying patient name */}
        <p><strong>Bill Amount:</strong> {billing.amount}</p>
        <p><strong>Status:</strong> {billing.status}</p>

        <div className="mt-4">
          <label htmlFor="paymentMethod" className="block text-gray-700 mb-2">Payment Method</label>
          <select
            id="paymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="">Select Payment Method</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>

        <div className="mt-4">
          <label htmlFor="paymentDate" className="block text-gray-700 mb-2">Payment Date</label>
          <input
            type="date" // Changed to date input
            id="paymentDate"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>

        <div className="flex justify-between space-x-4 mt-6">
          <button
            onClick={handleUpdatePayment}
            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition"
          >
            Mark as Paid
          </button>
          <button
            onClick={handleGenerateReceipt}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Generate Receipt
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ViewBill;

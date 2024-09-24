import React, { useState, useEffect } from 'react';
import { ref, push, set, get, remove } from 'firebase/database';
import { database } from '../../firebase/firebase';
import ViewBill from './ViewBill'; // Ensure to import ViewBill

const Billing = () => {
  const [billings, setBillings] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBillingData, setNewBillingData] = useState({ amount: '', patientId: '', status: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState({});
  const [viewBilling, setViewBilling] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Fetch billings from Firebase
  useEffect(() => {
    const fetchBillings = async () => {
      const billingsRef = ref(database, 'billing');
      const snapshot = await get(billingsRef);
      if (snapshot.exists()) {
        const billingList = [];
        snapshot.forEach((childSnapshot) => {
          billingList.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        setBillings(billingList);
      }
    };

    fetchBillings();
  }, []);

  // Fetch patient names
  useEffect(() => {
    const fetchPatientNames = async () => {
      const patientRef = ref(database, 'patient');
      const snapshot = await get(patientRef);
      if (snapshot.exists()) {
        const patientNames = {};
        snapshot.forEach((childSnapshot) => {
          patientNames[childSnapshot.key] = childSnapshot.val().name;
        });
        setPatients(patientNames);
      }
    };

    fetchPatientNames();
  }, []);

  // Filter billings based on search term
  const filteredBillings = billings.filter(billing =>
    patients[billing.patientId]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteBilling = async (billing) => {
    if (window.confirm('Are you sure you want to delete this billing?')) {
      try {
        const billingRef = ref(database, `billing/${billing.id}`);
        await remove(billingRef);
        setBillings(billings.filter((b) => b.id !== billing.id));
      } catch (error) {
        alert('Error deleting billing: ' + error.message);
      }
    }
  };

  const handleAddBilling = async (e) => {
    e.preventDefault();
    if (!newBillingData.amount || !newBillingData.patientId || !newBillingData.status) {
      alert('Please fill out all fields');
      return;
    }
    try {
      const billingRef = ref(database, 'billing');
      const newBillingRef = push(billingRef);
      await set(newBillingRef, newBillingData);
      setBillings([...billings, { id: newBillingRef.key, ...newBillingData }]);
      setIsAddModalOpen(false);
      setNewBillingData({ amount: '', patientId: '', status: '' });
    } catch (error) {
      alert('Error adding billing: ' + error.message);
    }
  };

  const handleViewBilling = (billing) => {
    setViewBilling(billing);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setViewBilling(null);
  };

  return (
    <div className="w-full">
      <div className="flex justify-center">
        <h1 className="text-3xl font-bold mb-4">Billing List</h1>
      </div>

      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search by patient name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-4 py-2 rounded-lg w-full max-w-xs"
        />
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="ml-4 bg-blue-500 text-white px-4 py-2 rounded-lg">
          Add New Billing
        </button>
      </div>

      <table className="min-w-full border-collapse border border-gray-300 bg-white">
        <thead>
          <tr className="bg-gray-200">
            <th className="border-b px-4 py-2 text-left">Patient</th>
            <th className="border-b px-4 py-2 text-left">Amount</th>
            <th className="border-b px-4 py-2 text-left">Status</th>
            <th className="border-b px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredBillings.length > 0 ? (
            filteredBillings.map(billing => (
              <tr key={billing.id} className="hover:bg-gray-100">
                <td className="border-b px-4 py-2">{patients[billing.patientId]}</td>
                <td className="border-b px-4 py-2">{billing.amount}</td>
                <td className="border-b px-4 py-2">{billing.status}</td>
                <td className="border-b px-4 py-2">
                  <button onClick={() => handleViewBilling(billing)} className="text-blue-600 hover:underline">View</button>
                  <button onClick={() => handleDeleteBilling(billing)} className="text-red-600 hover:underline ml-2">Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="border-b px-4 py-2 text-center">No billings found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {isViewModalOpen && (
        <ViewBill billing={viewBilling} patients={patients} onClose={handleCloseModal} />
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4">Add New Billing</h2>
            <form onSubmit={handleAddBilling}>
              <div className="mt-4">
                <label htmlFor="patientId" className="block text-gray-700 mb-2">Patient</label>
                <select
                  id="patientId"
                  value={newBillingData.patientId}
                  onChange={(e) => setNewBillingData({ ...newBillingData, patientId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                >
                  <option value="">Select Patient</option>
                  {Object.keys(patients).map(patientId => (
                    <option key={patientId} value={patientId}>{patients[patientId]}</option>
                  ))}
                </select>
              </div>
              <div className="mt-4">
                <label htmlFor="amount" className="block text-gray-700 mb-2">Amount</label>
                <input
                  type="text"
                  id="amount"
                  value={newBillingData.amount}
                  onChange={(e) => setNewBillingData({ ...newBillingData, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>
              <div className="mt-4">
                <label htmlFor="status" className="block text-gray-700 mb-2">Status</label>
                <select
                  id="status"
                  value={newBillingData.status}
                  onChange={(e) => setNewBillingData({ ...newBillingData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                >
                  <option value="">Select Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition"
                >
                  Add Billing
                </button>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="ml-2 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;

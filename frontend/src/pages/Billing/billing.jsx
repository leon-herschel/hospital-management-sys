import React, { useState, useEffect } from 'react';
import { ref, push, set, get, remove } from 'firebase/database';
import { database } from '../../firebase/firebase';
import ViewBill from './ViewBill';
import DeleteConfirmationModal from './DeleteConfirmationModalBilling'; // Import the confirmation modal

const Billing = () => {
  const [billings, setBillings] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBillingData, setNewBillingData] = useState({ amount: '', patientId: '', status: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState({});
  const [viewBilling, setViewBilling] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // State for delete confirmation modal
  const [billingToDelete, setBillingToDelete] = useState(null); // Store the billing to delete

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

  const handleDeleteBilling = async () => {
    if (billingToDelete) {
      try {
        const billingRef = ref(database, `billing/${billingToDelete.id}`);
        await remove(billingRef);
        setBillings(billings.filter((b) => b.id !== billingToDelete.id));
        setIsDeleteModalOpen(false); // Close the delete modal after deleting
        setBillingToDelete(null); // Clear the billing to delete
      } catch (error) {
        alert('Error deleting billing: ' + error.message);
      }
    }
  };

  const openDeleteModal = (billing) => {
    setBillingToDelete(billing); // Set the billing to delete
    setIsDeleteModalOpen(true); // Open the delete confirmation modal
  };

  const handleAddBilling = async (e) => {
    e.preventDefault();

    if (!newBillingData.patientId || !newBillingData.status) {
      alert('Please fill out all fields');
      return;
    }

    try {
      const billingRef = ref(database, 'billing');
      const newBillingRef = push(billingRef);
      
      // Store the billing data with a default amount
      await set(newBillingRef, { ...newBillingData });
      setBillings([...billings, { id: newBillingRef.key, ...newBillingData }]);
      setIsAddModalOpen(false);
      setNewBillingData({ amount: '', patientId: '', status: '' });
    } catch (error) {
      alert('Error adding billing: ' + error.message);
    }
  };

  const handleViewBilling = (billing) => {
    setViewBilling(billing); // Set the selected billing for viewing
    setIsViewModalOpen(true); // Open the view modal
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setViewBilling(null); // Clear the billing data when closing the modal
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
                <td className="border-b px-4 py-2">₱ {new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(billing.amount)}</td>
                <td className="border-b px-4 py-2">{billing.status}</td>
                <td className="border-b px-4 py-2">
                  <button onClick={() => handleViewBilling(billing)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded-md">View</button>
                  <button onClick={() => openDeleteModal(billing)} className="ml-4 bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-md">Delete</button>
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

      {isViewModalOpen && viewBilling && (
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
                <label htmlFor="status" className="block text-gray-700 mb-2">Status</label>
                <select
                  id="status"
                  value={newBillingData.status}
                  onChange={(e) => setNewBillingData({ ...newBillingData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                >
                  <option value="">Select Status</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="mr-2 bg-slate-300 text-gray-700 px-4 py-2 rounded-lg">Cancel</button>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg">Add Billing</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Use the DeleteConfirmationModal component */}
      {isDeleteModalOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onConfirm={handleDeleteBilling}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Billing;

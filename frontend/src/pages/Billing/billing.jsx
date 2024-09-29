import { useState, useEffect } from 'react';
import { ref, push, set, get, remove } from 'firebase/database';
import { database } from '../../firebase/firebase';
import ViewBill from './ViewBill'; 
import DeleteConfirmationModal from './DeleteConfirmationModalBilling'; // Import the delete confirmation modal

const Billing = () => {
  const [billings, setBillings] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBillingData, setNewBillingData] = useState({ amount: '', patientId: '', status: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState({});
  const [viewBilling, setViewBilling] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // State to handle delete modal visibility
  const [billingToDelete, setBillingToDelete] = useState(null); // State to track which billing to delete

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

  const openDeleteModal = (billing) => {
    setBillingToDelete(billing); // Set the billing to delete
    setIsDeleteModalOpen(true); // Open the delete confirmation modal
  };

  const handleDeleteBilling = async () => {
    if (billingToDelete) {
      try {
        const billingRef = ref(database, `billing/${billingToDelete.id}`);
        await remove(billingRef);
        setBillings(billings.filter((b) => b.id !== billingToDelete.id));
        setIsDeleteModalOpen(false); // Close the modal after deletion
        setBillingToDelete(null); // Clear the billing to delete
      } catch (error) {
        alert('Error deleting billing: ' + error.message);
      }
    }
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
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search by patient name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-stone-300 px-4 py-2 rounded-md"
        />
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="ml-auto bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md">
          Add New Billing
        </button>
      </div>

      <div className="relative overflow-x-auto shadow-sm">
        <table className="w-full text-md text-gray-800 text-center border border-stone-200">
          <thead className="text-sm uppercase bg-stone-200">
            <tr className="bg-gray-200">
              <th className="px-6 py-3">Patient</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBillings.length > 0 ? (
              filteredBillings.map(billing => (
                <tr key={billing.id} className="bg-white border-b hover:bg-stone-100">
                  <td className="px-6 py-3">{patients[billing.patientId]}</td>
                  <td className="px-6 py-3">₱ {new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(billing.amount)}</td>
                  <td className="px-6 py-3">{billing.status}</td>
                  <td className="px-6 py-3">
                    <button onClick={() => handleViewBilling(billing)} className="ml-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md">View</button>
                    <button onClick={() => openDeleteModal(billing)} className="ml-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md">Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-3">No billings found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {isViewModalOpen && viewBilling && (
        <ViewBill billing={viewBilling} patients={patients} onClose={handleCloseModal} />
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 sm:w-2/3 md:w-1/2 lg:w-1/3">
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
                  className="mr-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">Cancel</button>
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

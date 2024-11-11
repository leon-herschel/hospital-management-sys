import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, update, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../../firebase/firebase';
import ViewBill from './ViewBill';
import DeleteConfirmationModal from './DeleteConfirmationModalBilling';
import AddBill from './AddBill';
import DateRangePicker from '../../components/DateRangePicker/DateRangePicker'; // Import DateRangePicker

const Billing = () => {
  const [billings, setBillings] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewBilling, setViewBilling] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [billingToDelete, setBillingToDelete] = useState(null);
  const [startDate, setStartDate] = useState(null); // State for start date
  const [endDate, setEndDate] = useState(null);     // State for end date

  // Fetch billings from Firebase and listen for updates
  useEffect(() => {
    const billingsRef = query(ref(database, "billing"), orderByChild('status'), equalTo('unpaid'));

    const unsubscribe = onValue(billingsRef, (snapshot) => {
      const billingList = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          billingList.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        setBillings(billingList);
      } else {
        setBillings([]); // Clear billings if no data exists
      }
    });

    // Cleanup function to unsubscribe from listener
    return () => unsubscribe();
  }, []);

  // Filter billings based on search term and date range
  const filteredBillings = billings.filter((billing) => {
    const billingDate = new Date(billing.timestamp); // Assuming the billing has a timestamp field

    // Filter by date range
    const withinDateRange =
      (!startDate || billingDate >= startDate) &&
      (!endDate || billingDate <= endDate);

    // Filter by search term
    const matchesSearchTerm = billing.patientName?.toLowerCase().includes(searchTerm.toLowerCase());

    return withinDateRange && matchesSearchTerm;
  });

  // Handle deleting a billing
  const handleDeleteBilling = async () => {
    if (billingToDelete) {
      try {
        const billingRef = ref(database, `billing/${billingToDelete.id}`);
        await remove(billingRef);
        setBillings(billings.filter((b) => b.id !== billingToDelete.id));
        setIsDeleteModalOpen(false);
        setBillingToDelete(null);
      } catch (error) {
        alert('Error deleting billing: ' + error.message);
      }
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (billing) => {
    setBillingToDelete(billing);
    setIsDeleteModalOpen(true);
  };

  // Handle marking a billing as paid
  const handleMarkAsPaid = async (billing) => {
    try {
      const billingRef = ref(database, `billing/${billing.id}`);
      await update(billingRef, { status: 'paid' });
      setBillings(billings.filter((b) => b.id !== billing.id)); // Remove from list once marked as paid
    } catch (error) {
      alert('Error updating billing status: ' + error.message);
    }
  };

  const handleCloseAddBillModal = () => {
    setIsAddModalOpen(false);
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

      {/* Date Range Picker */}
      <div className="flex justify-between items-center mb-4">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
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
                <td className="border-b px-4 py-2">{billing.patientName}</td>
                <td className="border-b px-4 py-2">₱ {new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(billing.amount)}</td>
                <td className="border-b px-4 py-2">{billing.status}</td>
                <td className="border-b px-4 py-2">
                  <button onClick={() => handleViewBilling(billing)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded-md">View</button>
                  <button onClick={() => handleMarkAsPaid(billing)} className="ml-4 bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-md">Mark as Paid</button>
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
        <ViewBill billing={viewBilling} onClose={handleCloseModal} />
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <AddBill onClose={handleCloseAddBillModal} />
          </div>
        </div>
      )}

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

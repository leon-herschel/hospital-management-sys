import { useState, useEffect } from "react";
import { database } from "../../firebase/firebase";
import { ref, query, orderByChild, equalTo, onValue } from "firebase/database";
import DeleteConfirmationModal from "./DeleteConfirmationModalBilling";
import ViewBill from "./ViewBill";
import DateRangePicker from "../../components/DateRangePicker/DateRangePicker"; // Import DateRangePicker

const PaidSection = () => {
  const [billingList, setBillingList] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // State for search term
  const [startDate, setStartDate] = useState(null); // State for start date
  const [endDate, setEndDate] = useState(null); // State for end date
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(null);
  const [viewBilling, setViewBilling] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Fetch paid billing records from Firebase
  useEffect(() => {
    const billingRef = query(
      ref(database, "billing"),
      orderByChild("status"),
      equalTo("Paid")
    );

    const unsubscribeBillingRef = onValue(billingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const billingData = Object.keys(data).map((key) => ({
          ...data[key],
          id: key,
        }));
        setBillingList(billingData);
      } else {
        setBillingList([]);
      }
    });

    return () => unsubscribeBillingRef();
  }, []);

  // Filter billings based on search term and date range
  const filteredBillings = billingList.filter((billing) => {
    const billingDate = new Date(billing.presentDate); // Assuming there's a timestamp field

    // Filter by date range
    const withinDateRange =
      (!startDate || billingDate >= startDate) &&
      (!endDate || billingDate <= endDate);

    // Filter by search term
    const matchesSearchTerm = billing.patientName
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

    return withinDateRange && matchesSearchTerm;
  });

  const handleViewBilling = (billing) => {
    setViewBilling(billing);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setViewBilling(null);
  };

  return (
    <div>
      <div className="flex justify-center">
        <h1 className="text-3xl font-bold mb-4">Billing Paid Section</h1>
      </div>

      {/* Date Range Picker */}
      <div className="mb-4">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by patient name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-4 py-2 rounded-lg w-full max-w-xs"
        />
      </div>

      {/* Billing List Table */}
      <table className="min-w-full border-collapse border border-gray-300 bg-white">
        <thead>
          <tr className="bg-gray-200">
            <th className="border-b px-4 py-2 text-left">Patient</th>
            <th className="border-b px-4 py-2 text-left">Amount</th>
            <th className="border-b px-4 py-2 text-left">Status</th>
            <th className="border-b px-4 py-2 text-left">Date Paid</th>
            <th className="border-b px-4 py-2 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredBillings.length > 0 ? (
            filteredBillings.map((billing) => (
              <tr key={billing.id} className="hover:bg-gray-100">
                <td className="border-b px-4 py-2">{billing.patientName}</td>
                <td className="border-b px-4 py-2">
                  ₱{" "}
                  {new Intl.NumberFormat("en-PH", {
                    minimumFractionDigits: 2,
                  }).format(billing.amount)}
                </td>
                <td className="border-b px-4 py-2">{billing.status}</td>
                <td className="border-b px-4 py-2">{billing.presentDate}</td>
                <td className="border-b px-4 py-2">
                  <button
                    onClick={() => handleViewBilling(billing)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
                  >
                    View
                  </button>

                  <button
                    onClick={() => openDeleteModal(billing)}
                    className="ml-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="border-b px-4 py-2 text-center">
                No Billings Found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {isViewModalOpen && viewBilling && (
        <ViewBill billing={viewBilling} onClose={handleCloseModal} />
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

export default PaidSection;

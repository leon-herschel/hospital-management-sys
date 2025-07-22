import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";
import { getAuth } from "firebase/auth";
import DateRangePicker from "../../components/DateRangePicker/DateRangePicker"; // Import your date picker component
import Pagination from "../../components/reusable/Pagination"; // Import the Pagination component

const CsrTransferHistory = () => {
  const [transferList, setTransferList] = useState([]);
  const [department, setDepartment] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1); // Initialize currentPage state
  const itemsPerPage = 10; // Define items per page

  const auth = getAuth();
  const user = auth.currentUser;

  // Fetch user's department
  useEffect(() => {
    if (user) {
      const departmentRef = ref(database, `users/${user.uid}/department`);
      onValue(departmentRef, (snapshot) => {
        const departmentData = snapshot.val();
        if (departmentData) {
          setDepartment(departmentData);
        }
      });
    }
  }, [user]);

  // Fetch transfer history based on user's department
  useEffect(() => {
    if (department) {
      const CsrHistoryRef = ref(database, "supplyHistoryTransfer");

      const unsubscribeCsrHistory = onValue(CsrHistoryRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const CsrData = Object.keys(data).map((key) => ({
            ...data[key],
            id: key,
          }));

          // Filter data based on the user's department
          if (department !== "CSR" && department !== "Admin") {
            const filteredData = CsrData.filter(
              (supply) => supply.recipientDepartment === department
            );
            setTransferList(filteredData);
          } else {
            setTransferList(CsrData);
          }
        }
      });

      return () => unsubscribeCsrHistory();
    }
  }, [department]);

  // Filter the transfer list based on the search term and date range
  const filteredTransferList = transferList.filter((csr) => {
    const transferTimestamp = new Date(csr.timestamp);

    // Single-day selection
    if (startDate && !endDate) {
      const startOfDay = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        0, 0, 0
      );
      const endOfDay = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        23, 59, 59
      );
      const withinSingleDay =
        transferTimestamp >= startOfDay && transferTimestamp <= endOfDay;
      const matchesSearchTerm =
        csr.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        csr.itemBrand?.toLowerCase().includes(searchTerm.toLowerCase());

      return withinSingleDay && matchesSearchTerm;
    }

    // Range selection
    const withinDateRange =
      (!startDate || transferTimestamp >= startDate) &&
      (!endDate || transferTimestamp <= endDate);

    const matchesSearchTerm =
      csr.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      csr.itemBrand?.toLowerCase().includes(searchTerm.toLowerCase());

    return withinDateRange && matchesSearchTerm;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTransferList.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransferList.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="w-full">
      {/* Date Range Picker */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-2">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Supply Name or Brand"
            className="border rounded-md px-4 py-2"
          />
        </div>
      </div>

      {/* Transfer History Table */}
      <div className="relative overflow-x-auto rounded-md shadow-sm">
        <table className="w-full text-md text-gray-900 text-center border border-slate-200">
          <thead className="text-md bg-slate-200">
            <tr>
              <th className="px-6 py-3">Supply Name</th>
              <th className="px-6 py-3">Brand</th>
              <th className="px-6 py-3">Quantity</th>
              <th className="px-6 py-3">Transferred by:</th>
              <th className="px-6 py-3">Timestamp</th>
              <th className="px-6 py-3">Department Receiver</th>
              <th className="px-6 py-3">Reason</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((csr) => (
                <tr key={csr.id} className="bg-white border-b hover:bg-slate-100">
                  <td className="px-6 py-3">{csr.itemName}</td>
                  <td className="px-6 py-3">{csr.itemBrand}</td>
                  <td className="px-6 py-3">{csr.quantity}</td>
                  <td className="px-6 py-3">{csr.sender}</td>
                  <td className="px-6 py-3">{csr.timestamp}</td>
                  <td className="px-6 py-3">{csr.recipientDepartment}</td>
                  <td className="px-6 py-3">{csr.reason}</td>
                </tr>
              ))
            ) : (
              <tr className="bg-white border-b hover:bg-slate-100">
                <td colSpan="7" className="px-6 py-3">
                  No {department} Transfer History found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default CsrTransferHistory;

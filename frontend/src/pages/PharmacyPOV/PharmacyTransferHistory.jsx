import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";
import { getAuth } from "firebase/auth";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const PharmacyTransferHistory = () => {
  const [transferList, setTransferList] = useState([]);
  const [department, setDepartment] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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
      const PharmacyHistoryRef = ref(database, "medicineTransferHistory");

      const unsubscribePharmacyHistory = onValue(
        PharmacyHistoryRef,
        (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const PharmacyData = Object.keys(data).map((key) => ({
              ...data[key],
              id: key,
            }));

            if (department !== "Pharmacy" && department !== "Admin") {
              const filteredData = PharmacyData.filter(
                (medicine) => medicine.recipientDepartment === department
              );
              setTransferList(filteredData);
            } else {
              setTransferList(PharmacyData);
            }
          }
        }
      );

      return () => unsubscribePharmacyHistory();
    }
  }, [department]);

  // Filter transfer list by date range and search term
  const filteredTransferList = transferList.filter((pharmacy) => {
    const pharmacyTimestamp = new Date(pharmacy.timestamp);

    // If only startDate is selected (single-day selection)
    if (startDate && !endDate) {
      const startOfDay = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        0,
        0,
        0
      );
      const endOfDay = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        23,
        59,
        59
      );
      const withinSingleDay =
        pharmacyTimestamp >= startOfDay && pharmacyTimestamp <= endOfDay;
      const matchesSearchTerm =
        pharmacy.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pharmacy.itemBrand.toLowerCase().includes(searchTerm.toLowerCase());

      return withinSingleDay && matchesSearchTerm;
    }

    // If both startDate and endDate are selected (range selection)
    const withinDateRange =
      (!startDate || pharmacyTimestamp >= startDate) &&
      (!endDate || pharmacyTimestamp <= endDate);

    // Check if the pharmacy item matches the search term
    const matchesSearchTerm =
      pharmacy.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.itemBrand?.toLowerCase().includes(searchTerm.toLowerCase());

    return withinDateRange && matchesSearchTerm;
  });

  return (
    <div className="w-full">
      {/* Date Range Picker */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-2">
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="Start Date"
            className="border rounded-md px-4 py-2"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            placeholderText="End Date"
            className="border rounded-md px-4 py-2"
          />
        </div>

        {/* Search Bar */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by Medicine Name or Brand"
          className="border rounded-md px-4 py-2"
        />
      </div>

      <div className="relative overflow-x-auto rounded-md shadow-sm">
        <table className="w-full text-md text-gray-900 text-center border border-slate-200">
          <thead className="text-md bg-slate-200">
            <tr>
              <th className="px-6 py-3">Medicine Name</th>
              <th className="px-6 py-3">Brand</th>
              <th className="px-6 py-3">Quantity</th>
              <th className="px-6 py-3">Sender</th>
              <th className="px-6 py-3">Timestamp</th>
              <th className="px-6 py-3">Recipient Department</th>
              <th className="px-6 py-3">Reason</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransferList.length > 0 ? (
              filteredTransferList.map((pharmacy) => (
                <tr
                  key={pharmacy.id}
                  className="bg-white border-b hover:bg-slate-100"
                >
                  <td className="px-6 py-3">{pharmacy.itemName}</td>
                  <td className="px-6 py-3">{pharmacy.itemBrand}</td>
                  <td className="px-6 py-3">{pharmacy.quantity}</td>
                  <td className="px-6 py-3">{pharmacy.sender}</td>
                  <td className="px-6 py-3">{pharmacy.timestamp}</td>
                  <td className="px-6 py-3">{pharmacy.recipientDepartment}</td>
                  <td className="px-6 py-3">{pharmacy.reason}</td>
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
    </div>
  );
};

export default PharmacyTransferHistory;

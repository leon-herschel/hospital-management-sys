import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";
import { getAuth } from "firebase/auth";
import AccessDenied from "../ErrorPages/AccessDenied";
import DateRangePicker from "../../components/DateRangePicker/DateRangePicker"; // Import DateRangePicker

const UsageHistory = () => {
  const [usageList, setUsageList] = useState([]);
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const auth = getAuth();
  const user = auth.currentUser;

  // Fetch user's department and role
  useEffect(() => {
    if (user) {
      const departmentRef = ref(database, `users/${user.uid}`);
      onValue(departmentRef, (snapshot) => {
        const departmentData = snapshot.val();
        if (departmentData) {
          setDepartment(departmentData.department);
          setRole(departmentData.role);
        }
      });
    }
  }, [user]);

  // Helper function to fetch usage history for a specific path
  const fetchUsageHistory = (path, callback) => {
    const usageHistoryRef = ref(database, path);
    onValue(usageHistoryRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usageData = Object.keys(data).map((key) => ({
          ...data[key],
          id: key,
        }));
        callback(usageData);
      }
    });
  };

  // Convert timestamp to a readable format
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp); // Create Date object
    return date.toLocaleString(); // Convert to readable format
  };

  // Fetch usage history based on role and department
  useEffect(() => {
    if (department && role) {
      if (role.toLowerCase() === "admin") {
        // Admin: Fetch usage history for all departments
        const departmentsRef = ref(database, "departments");
        onValue(departmentsRef, (snapshot) => {
          const departmentsData = snapshot.val();
          if (departmentsData) {
            const allUsageHistory = [];
            const departmentNames = Object.keys(departmentsData);

            // Fetch usage history for each department
            departmentNames.forEach((dept) => {
              fetchUsageHistory(`departments/${dept}/usageHistory`, (usageData) => {
                allUsageHistory.push(...usageData);
                setUsageList([...allUsageHistory]); // Update usage list after each department fetch
              });
            });
          }
        });
      } else {
        // Non-admin: Fetch usage history for specific department
        fetchUsageHistory(`departments/${department}/usageHistory`, (usageData) => {
          setUsageList(usageData);
        });
      }
    }
  }, [role, department]);

  // Filter the usage list based on the search term and date range
  const filteredUsageList = usageList.filter((usage) => {
    const usageTimestamp = new Date(usage.timestamp);

    // If only startDate is selected (single-day selection)
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
      const withinSingleDay = usageTimestamp >= startOfDay && usageTimestamp <= endOfDay;

      const matchesSearchTerm =
        usage.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usage.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usage.lastName?.toLowerCase().includes(searchTerm.toLowerCase());

      return withinSingleDay && matchesSearchTerm;
    }

    // If both startDate and endDate are selected (range selection)
    const withinDateRange =
      (!startDate || usageTimestamp >= startDate) &&
      (!endDate || usageTimestamp <= endDate);

    const matchesSearchTerm =
      usage.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usage.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usage.lastName?.toLowerCase().includes(searchTerm.toLowerCase());

    return withinDateRange && matchesSearchTerm;
  });

  if (department === "CSR" || department === "Pharmacy") {
    return <AccessDenied />;
  }

  return (
    <div className="w-full">
      {/* Date Range Picker and Search Bar */}
      <div className="flex items-center justify-between mb-4">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by Item Name, First Name, or Last Name"
          className="border rounded-md px-4 py-2"
        />
      </div>

      {/* Usage History Table */}
      <div className="relative overflow-x-auto rounded-md shadow-sm">
        <table className="w-full text-md text-gray-900 text-center border border-slate-200">
          <thead className="text-md bg-slate-200">
            <tr>
              <th className="px-6 py-3">Item Name</th>
              <th className="px-6 py-3">Patient's First Name</th>
              <th className="px-6 py-3">Patient's Last Name</th>
              <th className="px-6 py-3">Quantity</th>
              <th className="px-6 py-3">Timestamp</th>
              <th className="px-6 py-3">Type</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsageList.length > 0 ? (
              filteredUsageList.map((usage) => (
                <tr key={usage.id} className="bg-white border-b hover:bg-slate-100">
                  <td className="px-6 py-3">{usage.itemName}</td>
                  <td className="px-6 py-3">{usage.firstName}</td>
                  <td className="px-6 py-3">{usage.lastName}</td>
                  <td className="px-6 py-3">{usage.quantity}</td>
                  <td className="px-6 py-3">
                    {usage.timestamp ? formatTimestamp(usage.timestamp) : "N/A"}
                  </td>
                  <td className="px-6 py-3">{usage.type}</td>
                </tr>
              ))
            ) : (
              <tr className="bg-white border-b hover:bg-slate-100">
                <td colSpan="6" className="px-6 py-3">
                  No {role === "admin" ? "" : department} Usage History found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsageHistory;

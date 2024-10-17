import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";
import { getAuth } from "firebase/auth";

const UsageHistory = () => {
  const [usageList, setUsageList] = useState([]);
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");

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

  return (
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
          {usageList.length > 0 ? (
            usageList.map((usage) => (
              <tr key={usage.id}>
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
            <tr>
              <td colSpan="6" className="px-6 py-3">
                No {role === "admin" ? "Global" : department} Usage History found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UsageHistory;

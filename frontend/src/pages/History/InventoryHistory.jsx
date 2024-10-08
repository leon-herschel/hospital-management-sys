import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { getAuth } from 'firebase/auth';

function InventoryHistory() {
  const [inventoryHistory, setInventoryHistory] = useState([]);
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the authenticated user
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      // Fetch user department from your database (you need to store user-department mappings in Firebase)
      const userDepartmentRef = ref(database, `users/${user.uid}/department`);
      onValue(userDepartmentRef, (snapshot) => {
        const departmentData = snapshot.val();
        if (departmentData) {
          setDepartment(departmentData); // Set department based on user
        }
      });
    }
  }, []);

  useEffect(() => {
    if (department) {
      // Fetch inventory history based on department
      const inventoryRef = ref(database, `departments/${department}/inventoryHistory`);
      onValue(inventoryRef, (snapshot) => {
        const historyData = snapshot.val();
        if (historyData) {
          const formattedHistory = Object.keys(historyData).map((key) => ({
            id: key,
            ...historyData[key],
          }));
          setInventoryHistory(formattedHistory);
        } else {
          setInventoryHistory([]);
        }
        setLoading(false);
      });
    }
  }, [department]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full">
      <h1 className="text-xl font-bold mb-4">{department} Inventory History</h1>
      <div className="relative overflow-x-auto rounded-md shadow-sm">
        <table className="w-full text-md text-gray-900 text-center border border-slate-200">
          <thead className="text-md bg-slate-200">
            <tr>
              <th className="px-6 py-3">Item Name</th>
              <th className="px-6 py-3">Quantity</th>
              <th className="px-6 py-3">Sender</th>
              <th className="px-6 py-3">Recipient Department</th>
              <th className="px-6 py-3">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {inventoryHistory.length > 0 ? (
              inventoryHistory.map((item) => (
                <tr key={item.id} className="bg-white border-b hover:bg-slate-100">
                  <td className="px-6 py-3">{item.itemName}</td>
                  <td className="px-6 py-3">{item.quantity}</td>
                  <td className="px-6 py-3">{item.sender}</td>
                  <td className="px-6 py-3">{item.recipientDepartment}</td>
                  <td className="px-6 py-3">{new Date(item.timestamp).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-3">
                  No inventory history found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InventoryHistory;

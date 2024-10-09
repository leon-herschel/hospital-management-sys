import { useState, useEffect } from "react";
import { database } from "../../firebase/firebase";
import { ref, onValue } from "firebase/database";

function SupplyHistory() {
  const [supplyHistory, setSupplyHistory] = useState([]);

  useEffect(() => {
    const supplyHistoryRef = ref(database, "inventoryHistory/supplies");

    const unsubscribeSupplyHistory = onValue(supplyHistoryRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const supplyData = Object.keys(data).map((key) => ({
          ...data[key],
          id: key,
        }));
        setSupplyHistory(supplyData);
      } else {
        setSupplyHistory([]);
      }
    });
    return () => unsubscribeSupplyHistory();
  }, []);

  return (
    <div className="relative overflow-x-auto rounded-md shadow-sm">
      <table className="w-full text-md text-gray-900 text-center border border-slate-200">
        <thead className="text-md bg-slate-200">
          <tr>
            <th className="px-6 py-3">Supply Name</th>
            <th className="px-6 py-3">Quantity</th>
            <th className="px-6 py-3">Patient Name</th>
            <th className="px-6 py-3">Nurse Name</th>
            <th className="px-6 py-3">Time Stamp</th>
          </tr>
        </thead>
        <tbody>
          {supplyHistory.length > 0 ? (
            supplyHistory.map((supply) => (
              <tr key={supply.id}>
                <td className="px-6 py-3">{supply.itemName}</td>
                <td className="px-6 py-3">{supply.quantity}</td>
                <td className="px-6 py-3">{supply.patientName}</td>
                <td className="px-6 py-3">{supply.nurseName}</td>
                <td className="px-6 py-3">
                  {new Date(supply.timestamp).toLocaleString()}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="px-6 py-3">
                No supply history available yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default SupplyHistory;

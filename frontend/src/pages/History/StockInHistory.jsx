import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";

const StockInHistory = () => {
  const [selectedTab, setSelectedTab] = useState("medicine");
  const [medicineHistory, setMedicineHistory] = useState([]);
  const [supplyHistory, setSupplyHistory] = useState([]);

  useEffect(() => {
    // Fetch the stock-in history for medicines
    const medicineHistoryRef = ref(database, "medicineStockInHistory");
    onValue(medicineHistoryRef, (snapshot) => {
      const data = snapshot.val();
      const historyArray = data ? Object.values(data) : [];
      setMedicineHistory(historyArray);
    });

    // Fetch the stock-in history for supplies
    const supplyHistoryRef = ref(database, "supplyStockInHistory");
    onValue(supplyHistoryRef, (snapshot) => {
      const data = snapshot.val();
      const historyArray = data ? Object.values(data) : [];
      setSupplyHistory(historyArray);
    });
  }, []);

  const historyToShow =
    selectedTab === "medicine" ? medicineHistory : supplyHistory;

  return (
    <div className="max-w-full mx-auto mt-2 bg-white rounded-lg shadow-md p-6">
      {/* Tabs for selecting Medicine or Supply */}
      <div className="flex mb-4">
        <button
          onClick={() => setSelectedTab("medicine")}
          className={`px-6 py-2 rounded-md transition duration-200 ${
            selectedTab === "medicine"
              ? "bg-slate-900 text-white"
              : "bg-slate-200 text-gray-900"
          }`}
        >
          Medicine Stock In History
        </button>
        <button
          onClick={() => setSelectedTab("supply")}
          className={`ml-2 px-6 py-2 rounded-md transition duration-200 ${
            selectedTab === "supply"
              ? "bg-slate-900 text-white"
              : "bg-slate-200 text-gray-900"
          }`}
        >
          Supply Stock In History
        </button>
      </div>

      <table className="w-full text-md text-gray-900 text-center border border-slate-200">
        <thead className="text-md bg-slate-200">
          <tr>
            <th className="px-6 py-3">Item Name</th>
            <th className="px-6 py-3">Quantity Added</th>
            <th className="px-6 py-3">New Quantity</th>
            <th className="px-6 py-3">User</th>
            <th className="px-6 py-3">Department</th>
            <th className="px-6 py-3">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {historyToShow.length > 0 ? (
            historyToShow.map((entry, index) => (
              <tr key={index} className="bg-white border-b hover:bg-slate-100">
                <td className="px-6 py-3">{entry.itemName}</td>
                <td className="px-6 py-3">{entry.quantityAdded}</td>
                <td className="px-6 py-3">{entry.newQuantity}</td>
                <td className="px-6 py-3">{entry.email}</td>
                <td className="px-6 py-3">{entry.department}</td>
                <td className="px-6 py-3">
                  {new Date(entry.timestamp).toLocaleString()}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="px-6 py-3">
                No stock-in history found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StockInHistory;

import { useState, useEffect } from "react";
import { database } from "../../firebase/firebase";
import { ref, onValue } from "firebase/database";

function MedicineHistory() {
  const [medicineHistory, setMedicineHistory] = useState([]);

  useEffect(() => {
    const medicineHistoryRef = ref(database, "inventoryHistory/medicines");

    const unsubscribeMedicineHistory = onValue(
      medicineHistoryRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const medicineData = Object.keys(data).map((key) => ({
            ...data[key],
            id: key,
          }));
          setMedicineHistory(medicineData);
        } else {
          setMedicineHistory([]);
        }
      },
    );
    return () => unsubscribeMedicineHistory();
  }, []);

  return (
    <div className="relative overflow-x-auto rounded-md shadow-sm">
      <table className="w-full text-md text-gray-900 text-center border border-slate-200">
        <thead className="text-md bg-slate-200">
          <tr>
            <th className="px-6 py-3">Medicine Name</th>
            <th className="px-6 py-3">Quantity</th>
            <th className="px-6 py-3">Patient Name</th>
            <th className="px-6 py-3">Nurse Name</th>
            <th className="px-6 py-3">Time Stamp</th>
          </tr>
        </thead>
        <tbody>
          {medicineHistory.length > 0 ? (
            medicineHistory.map((medicine) => (
              <tr key={medicine.id}>
                <td className="px-6 py-3">{medicine.itemName}</td>
                <td className="px-6 py-3">{medicine.quantity}</td>
                <td className="px-6 py-3">{medicine.patientName}</td>
                <td className="px-6 py-3">{medicine.nurseName}</td>
                <td className="px-6 py-3">
                  {new Date(medicine.timestamp).toLocaleString()}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="px-6 py-3">
                No medicine history available yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default MedicineHistory;

import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/firebase";

const DepartmentBreakdown = ({ itemName, onClose }) => {
  const [departmentsData, setDepartmentsData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartmentBreakdown = async () => {
      const departmentsSnapshot = await get(ref(database, "departments"));
      const departments = departmentsSnapshot.val() || {};

      const breakdown = {};

      Object.entries(departments).forEach(([deptName, deptData]) => {
        const supplies = deptData.localSupplies || {};
        const meds = deptData.localMeds || {};

        const supplyItem = Object.values(supplies).find((item) => item.itemName === itemName);
        const medItem = Object.values(meds).find((item) => item.genericName === itemName);

        if (supplyItem || medItem) {
          const item = supplyItem || medItem;
          breakdown[deptName] = item.quantity;
        }
      });

      setDepartmentsData(breakdown);
      setLoading(false);
    };

    fetchDepartmentBreakdown();
  }, [itemName]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
      <div className="relative bg-white rounded-lg p-4 w-1/3">
        <button onClick={onClose} className="absolute top-2 right-2 text-red-500 font-bold">
          &times;
        </button>
        <h2 className="text-lg font-bold mb-4">Department Breakdown for {itemName}</h2>
        <table className="w-full text-md text-center border border-slate-200">
          <thead>
            <tr>
              <th className="px-4 py-2">Department</th>
              <th className="px-4 py-2">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(departmentsData).length > 0 ? (
              Object.entries(departmentsData).map(([dept, quantity]) => (
                <tr key={dept}>
                  <td className="px-4 py-2">{dept}</td>
                  <td className="px-4 py-2">{quantity}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="px-4 py-2">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DepartmentBreakdown;

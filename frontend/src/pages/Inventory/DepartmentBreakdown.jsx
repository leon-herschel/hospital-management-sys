import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/firebase";

const DepartmentBreakdown = ({ itemName, onClose }) => {
  const [departmentsData, setDepartmentsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Pagination logic
  const totalItems = Object.entries(departmentsData).length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = Object.entries(departmentsData)
    .slice(indexOfFirstItem, indexOfLastItem)
    .map(([dept, quantity]) => ({ dept, quantity }));

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Calculate total quantity
  const totalQuantity = Object.values(departmentsData).reduce((acc, quantity) => acc + quantity, 0);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
      <div className="relative bg-white rounded-lg p-4 w-1/3 max-w-4xl">
        <button onClick={onClose} className="absolute top-2 right-2 text-red-500 font-bold">
          &times;
        </button>
        <h2 className="text-lg font-bold mb-4">Department Breakdown for {itemName}</h2>

        {/* Table displaying department data */}
        <table className="w-full text-md text-center border border-slate-200">
          <thead>
            <tr>
              <th className="px-4 py-2">Department</th>
              <th className="px-4 py-2">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map(({ dept, quantity }) => (
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

        {/* Pagination Controls */}
        <div className="flex justify-center mt-4">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              onClick={() => handlePageChange(index + 1)}
              className={`px-4 py-2 mx-1 border rounded ${currentPage === index + 1 ? "bg-blue-500 text-white" : "bg-white text-gray-700 border-gray-300"}`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {/* Total Quantity */}
        <div className="mt-4 text-lg font-semibold">
          <p>Total Quantity: {totalQuantity}</p>
        </div>
      </div>
    </div>
  );
};

export default DepartmentBreakdown;

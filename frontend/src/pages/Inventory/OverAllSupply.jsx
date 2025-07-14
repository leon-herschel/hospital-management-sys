import { useEffect, useState } from "react";
import { ref, get, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";
import { calculateStatus } from "./CalculateStatusLogic";
import DepartmentBreakdown from "./DepartmentBreakdown";
import Pagination from "../../components/reusable/Pagination";
import { sortByField } from "../../components/reusable/Sorter";

const OverAllSupply = () => {
  const [overallInventory, setOverallInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const departmentsRef = ref(database, "departments");

    const fetchOverallInventory = async () => {
      const departmentsSnapshot = await get(departmentsRef);
      const departmentsData = departmentsSnapshot.val() || {};

      const totalInventory = {};

      Object.entries(departmentsData).forEach(([departmentKey, departmentValue]) => {
        const departmentSupplies = departmentValue.localSupplies || {};

        Object.entries(departmentSupplies).forEach(([key, value]) => {
          const itemName = value.itemName;
          const maxQuantity = value.maxQuantity || value.quantity;

          if (totalInventory[itemName]) {
            totalInventory[itemName].totalQuantity += value.quantity || 0;
          } else {
            totalInventory[itemName] = {
              itemName: itemName,
              totalQuantity: value.quantity || 0,
              maxQuantity: maxQuantity,
              status: calculateStatus(value.quantity || 0, maxQuantity),
            };
          }
        });
      });

      const inventoryArray = Object.values(totalInventory);

      // Apply alphabetical sorting using itemName
      const sortedInventory = sortByField(inventoryArray, "itemName");

      setOverallInventory(sortedInventory);
    };

    fetchOverallInventory();
    const unsubscribeDepartments = onValue(ref(database, "departments"), fetchOverallInventory);

    return () => unsubscribeDepartments();
  }, []);

  const filteredInventory = overallInventory.filter((item) =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInventory.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="max-w-full mx-auto mt-2 bg-white rounded-lg shadow-md p-6">
      <h1 className="text-xl font-bold mb-4">Overall Supplies Inventory</h1>
      <input
        type="text"
        placeholder="Search for items..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full border border-slate-300 px-4 py-2 rounded-md mb-4"
      />

      <div className="relative overflow-x-auto rounded-md shadow-sm">
        <table className="w-full text-md text-gray-900 text-center border border-slate-200">
          <thead className="text-md bg-slate-200">
            <tr>
              <th className="px-6 py-3">Item Name</th>
              <th className="px-6 py-3">Total Quantity</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((item) => (
                <tr key={item.itemName} className="bg-white border-b hover:bg-slate-100">
                  <td className="px-6 py-3">{item.itemName}</td>
                  <td className="px-6 py-3">{item.totalQuantity}</td>
                  <td className="px-6 py-3">{item.status}</td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => setSelectedItem(item.itemName)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-3">No supplies found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {selectedItem && (
        <DepartmentBreakdown
          itemName={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};

export default OverAllSupply;

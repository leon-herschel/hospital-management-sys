import { useEffect, useState } from "react";
import { ref, get, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";

const OverAllSupply = () => {
  const [overallInventory, setOverallInventory] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const departmentsRef = ref(database, "departments");

    const fetchDepartments = async () => {
      try {
        const departmentsSnapshot = await get(departmentsRef);
        return departmentsSnapshot.exists() ? departmentsSnapshot.val() : {};
      } catch (error) {
        console.error("Error fetching departments:", error);
        return {};
      }
    };

    const fetchOverallInventory = async () => {
      const departmentsData = await fetchDepartments();

      const totalInventory = {};

      // Process each department's supplies under the 'localSupplies' node
      Object.entries(departmentsData).forEach(
        ([departmentKey, departmentValue]) => {
          const departmentSupplies = departmentValue.localSupplies || {}; // Ensure you're targeting the correct supplies node within departments

          Object.entries(departmentSupplies).forEach(([key, value]) => {
            const itemName = value.itemName; // Use itemName as the unique identifier

            if (totalInventory[itemName]) {
              // If the item exists in the main supplies, add the department's quantity
              totalInventory[itemName].totalQuantity += value.quantity || 0;
            } else {
              // If the item is not in the main supplies, create a new entry
              totalInventory[itemName] = {
                itemName: itemName,
                totalQuantity: value.quantity || 0, // Only department's quantity
              };
            }
          });
        }
      );

      setOverallInventory(totalInventory);
    };

    fetchOverallInventory();

    const unsubscribeDepartments = onValue(
      departmentsRef,
      fetchOverallInventory
    );

    return () => {
      unsubscribeDepartments();
    };
  }, []);

  // Filter the inventory based on the search term
  const filteredInventory = Object.entries(overallInventory).filter(
    ([key, item]) =>
      item.itemName &&
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <table className="w-full text-md text-gray-900 text-center border border-slate-200">
        <thead className="text-md bg-slate-200">
          <tr>
            <th className="px-6 py-3">Item Name</th>
            <th className="px-6 py-3">Total Quantity</th>
          </tr>
        </thead>
        <tbody>
          {filteredInventory.length > 0 ? (
            filteredInventory.map(([itemName, item]) => (
              <tr key={itemName} className="bg-white border-b hover:bg-slate-100">
                <td className="px-6 py-3">{item.itemName}</td>
                <td className="px-6 py-3">
                  {item.totalQuantity}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2" className="px-6 py-3">
                No supplies found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OverAllSupply;

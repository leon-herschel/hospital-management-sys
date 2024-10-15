import React, { useEffect, useState } from "react";
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
    <div className="max-w-full mx-auto mt-6 bg-white rounded-lg shadow-lg p-6">
      <h1 className="text-xl font-bold mb-4">Overall Supplies Inventory</h1>
      <input
        type="text"
        placeholder="Search for items..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border p-2 mb-4 w-full"
      />
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2">Item Name</th>
            <th className="border border-gray-300 p-2">Total Quantity</th>
          </tr>
        </thead>
        <tbody>
          {filteredInventory.length > 0 ? (
            filteredInventory.map(([itemName, item]) => (
              <tr key={itemName}>
                <td className="border border-gray-300 p-2">{item.itemName}</td>
                <td className="border border-gray-300 p-2">
                  {item.totalQuantity}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2" className="block md:table-cell p-2 text-center">
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

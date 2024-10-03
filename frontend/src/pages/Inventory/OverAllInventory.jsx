import React, { useEffect, useState } from 'react';
import { ref, get, onValue } from 'firebase/database';
import { database } from '../../firebase/firebase';

const OverallInventory = () => {
  const [overallInventory, setOverallInventory] = useState({});

  useEffect(() => {
    const fetchOverallInventory = async () => {
      const suppliesRef = ref(database, 'supplies');
      const departmentsRef = ref(database, 'departments');

      // Fetch supplies quantities
      const suppliesSnapshot = await get(suppliesRef);
      const suppliesData = suppliesSnapshot.exists() ? suppliesSnapshot.val() : {};

      // Fetch local supplies quantities from each department
      const departmentsSnapshot = await get(departmentsRef);
      const departmentsData = departmentsSnapshot.exists() ? departmentsSnapshot.val() : {};

      const totalInventory = {};

      // Process main supplies
      Object.entries(suppliesData).forEach(([key, value]) => {
        totalInventory[key] = {
          itemName: value.itemName,
          totalQuantity: value.quantity || 0,
        };
      });

      // Process each department's local supplies
      Object.entries(departmentsData).forEach(([departmentKey, departmentValue]) => {
        const localSupplies = departmentValue.localSupplies || {};
        
        Object.entries(localSupplies).forEach(([key, value]) => {
          if (totalInventory[key]) {
            totalInventory[key].totalQuantity += value.quantity || 0;
          } else {
            totalInventory[key] = {
              itemName: value.itemName,
              totalQuantity: value.quantity || 0,
            };
          }
        });
      });

      setOverallInventory(totalInventory);
    };

    fetchOverallInventory();

    // Optionally listen for changes in the supplies and departments
    const unsubscribeSupplies = onValue(ref(database, 'supplies'), fetchOverallInventory);
    const unsubscribeDepartments = onValue(ref(database, 'departments'), fetchOverallInventory);
    
    return () => {
      unsubscribeSupplies();
      unsubscribeDepartments();
    };
  }, []);

  return (
    <div className="max-w-full mx-auto mt-6 bg-white rounded-lg shadow-lg p-6">
      <h1 className="text-xl font-bold mb-4">Overall Inventory</h1>
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2">Item Name</th>
            <th className="border border-gray-300 p-2">Total Quantity</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(overallInventory).map(([key, item]) => (
            <tr key={key}>
              <td className="border border-gray-300 p-2">{item.itemName}</td>
              <td className="border border-gray-300 p-2">{item.totalQuantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OverallInventory;

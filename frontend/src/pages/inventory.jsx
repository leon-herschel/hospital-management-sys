import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../dbconfig/db";
import { Link } from "react-router-dom";

function inventory() {
  const [inventoryList, setInventoryList] = useState([]);

  const inventoryCollection = ref(database, "inventory");

  useEffect(() => {
    const unsubscribe = onValue(inventoryCollection, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const inventoryData = Object.keys(data).map((key) => ({
          ...data[key],
          id: key,
        }));
        setInventoryList(inventoryData);
      } else {
        setInventoryList([]);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [inventoryCollection]);

  return (
    <div>
      <h2>inventory System</h2>
      <div>
        <Link to="/addInventory">
          <button>Add New Item</button>
        </Link>
      </div>
      <table className="min-w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-left">
              Item Name
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left">
              Quantity
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left">
              Department
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left">
              Status
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {inventoryList.length > 0 ? (
            inventoryList.map((inventory) => (
              <tr key={inventory.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">
                  {inventory.itemName}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {inventory.quantity}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {inventory.department}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {inventory.status}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="5"
                className="border border-gray-300 px-4 py-2 text-center"
              >
                No items in inventory
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default inventory;

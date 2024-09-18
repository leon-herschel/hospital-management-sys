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
      <table>
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Quantity</th>
            <th>Department</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {/* Check if inventoryList exists and has items */}
          {inventoryList.length > 0 ? (
            inventoryList.map((inventory) => (
              <tr key={inventory.id}>
                <td>{inventory.itemName}</td>
                <td>{inventory.quantity}</td>
                <td>{inventory.department}</td>
                <td>{inventory.status}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No items in inventory</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default inventory;

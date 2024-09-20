import { useState, useEffect } from "react";
import { ref, onValue, remove } from "firebase/database";
import AddInventory from "../components/addInventory";

function inventory() {
  const [inventoryList, setInventoryList] = useState([]);
  const [modal, setModal] = useState(false);
  const inventoryCollection = ref(database, "inventory");

  const toggleModal = () => {
    setModal(!modal);
  };

  if (modal) {
    document.body.classList.add("active-modal");
  } else {
    document.body.classList.remove("active-modal");
  }

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

  const handleDelete = async (id) => {
    await remove(ref(database, `inventory/${id}`));
  };

  return (
    <div>
      <h2>inventory System</h2>
      <div>
        <button onClick={toggleModal}>Add New Item</button>
      </div>
      <table className="min-w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-center">
              Item Name
            </th>
            <th className="border border-gray-300 px-4 py-2 text-center">
              Quantity
            </th>
            <th className="border border-gray-300 px-4 py-2 text-center">
              Department
            </th>
            <th className="border border-gray-300 px-4 py-2 text-center">
              Status
            </th>
            <th className="border border-gray-300 px-4 py-2 text-center">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {inventoryList.length > 0 ? (
            inventoryList.map((inventory) => (
              <tr key={inventory.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {inventory.itemName}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {inventory.quantity}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {inventory.department}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {inventory.status}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  <button>EDIT</button> |
                  <button onClick={() => handleDelete(inventory.id)}>
                    DELETE
                  </button>
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
      <AddInventory isOpen={modal} toggleModal={toggleModal} />
    </div>
  );
}

export default inventory;

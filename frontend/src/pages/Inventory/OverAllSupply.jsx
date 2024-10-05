import { useState, useEffect } from "react";
import { database } from "../../firebase/firebase";
import { ref, onValue } from "firebase/database";

const OverAllSupply = () => {
  const [overAll, setOverAll] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  useEffect(() => {
    const overAllRef = ref(database, "overAllInventory/supplies");

    const unsubscribeOverAll = onValue(
      overAllRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const overAllData = Object.keys(data).map((key) => ({
            ...data[key],
            id: key,
          }));
          setOverAll(overAllData);
        } else {
          setOverAll([]);
        }
        setLoading(false); // Set loading to false when data is fetched
      },
      (error) => {
        setError(error); // Set error if fetching fails
        setLoading(false);
      },
    );

    return () => unsubscribeOverAll();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Loading indicator
  }

  if (error) {
    return <div>Error fetching data: {error.message}</div>; // Error message
  }

  return (
    <div>
      <h1>Overall Supply Inventory</h1>
      <table className="min-w-full border-collapse block md:table">
        <thead className="block md:table-header-group">
          <tr className="border border-gray-300 md:table-row absolute -top-full md:top-auto -left-full md:left-auto md:relative ">
            <th className="block md:table-cell p-2">Item Name</th>
            <th className="block md:table-cell p-2">Quantity</th>
            <th className="block md:table-cell p-2">Status</th>
          </tr>
        </thead>
        <tbody className="block md:table-row-group">
          {overAll.length > 0 ? (
            overAll.map((supply) => (
              <tr
                key={supply.id}
                className="bg-gray-100 border border-gray-300 md:border-none block md:table-row"
              >
                <td className="block md:table-cell p-2">{supply.itemName}</td>
                <td className="block md:table-cell p-2">{supply.quantity}</td>
                <td className="block md:table-cell p-2">{supply.status}</td>
              </tr>
            ))
          ) : (
            <tr className="block md:table-row">
              <td colSpan="3" className="block md:table-cell p-2 text-center">
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

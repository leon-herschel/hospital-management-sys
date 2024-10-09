import { useState, useEffect } from "react";
import { database } from "../../firebase/firebase";
import { ref, onValue } from "firebase/database";

const OverAllMedicine = () => {
  const [overAll, setOverAll] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const overAllRef = ref(database, "overAllInventory/medicines");

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
      }
    );

    return () => unsubscribeOverAll();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Loading indicator
  }

  if (error) {
    return <div>Error fetching data: {error.message}</div>; // Error message
  }

  const filteredInventory = Object.entries(overAll).filter(
    ([key, item]) =>
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-full mx-auto mt-6 bg-white rounded-lg shadow-lg p-6">
      <h1 className="text-xl font-bold mb-4">Overall Medicine Inventory</h1>
      <input
        type="text"
        placeholder="Search for items..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border p-2 mb-4 w-full"
      />
      <table className="min-w-full border-collapse block md:table">
        <thead className="block md:table-header-group">
          <tr className="border border-gray-300 md:table-row absolute -top-full md:top-auto -left-full md:left-auto md:relative ">
            <th className="block md:table-cell p-2">Item Name</th>
            <th className="block md:table-cell p-2">Quantity</th>
            <th className="block md:table-cell p-2">Status</th>
          </tr>
        </thead>
        <tbody className="block md:table-row-group">
          {filteredInventory.length > 0 ? (
            filteredInventory.map((medicine) => (
              <tr key={medicine.id} className="bg-gray-100 border border-gray-300 md:border-none block md:table-row">
                <td className="block md:table-cell p-2">{medicine.itemName}</td>
                <td className="block md:table-cell p-2">{medicine.quantity}</td>
                <td className="block md:table-cell p-2">{medicine.status}</td>
              </tr>
            ))
          ) : (
            <tr className="block md:table-row">
              <td colSpan="3" className="block md:table-cell p-2 text-center">
                No medicines found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OverAllMedicine;

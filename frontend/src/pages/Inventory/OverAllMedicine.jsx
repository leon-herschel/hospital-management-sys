import { useState, useEffect } from "react";
import { database } from "../../firebase/firebase";
import { ref, onValue, get } from "firebase/database";

const OverAllMedicine = () => {
  const [medsList, setMedsList] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Fetch all departments
    const departmentsRef = ref(database, "departments");
    onValue(
      departmentsRef,
      async (snapshot) => {
        const departmentsData = snapshot.val();
        if (departmentsData) {
          const totalMeds = {};

          // Iterate over each department
          for (const department of Object.keys(departmentsData)) {
            const localMedsRef = ref(
              database,
              `departments/${department}/localMeds`
            );
            const medsSnapshot = await get(localMedsRef);
            const localMedsData = medsSnapshot.val();

            if (localMedsData) {
              // Aggregate medicines by itemName
              Object.entries(localMedsData).forEach(([key, value]) => {
                const itemName = value.itemName;

                if (totalMeds[itemName]) {
                  // If the medicine already exists, add to the quantity
                  totalMeds[itemName].quantity += value.quantity || 0;
                } else {
                  // If it doesn't exist, create a new entry
                  totalMeds[itemName] = {
                    id: key,
                    itemName: itemName,
                    quantity: value.quantity || 0,
                    status: value.status, // Retain status for the medicine
                  };
                }
              });
            }
          }

          // Convert the object to an array for rendering
          setMedsList(Object.values(totalMeds));
        } else {
          setMedsList([]);
        }
        setLoading(false); // Set loading to false when data is fetched
      },
      (error) => {
        setError(error); // Set error if fetching fails
        setLoading(false);
      }
    );
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Loading indicator
  }

  if (error) {
    return <div>Error fetching data: {error.message}</div>; // Error message
  }

  const filteredInventory = medsList.filter((item) =>
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
        <thead>
          <tr>
            <th className="border border-gray-300 p-3">Item Name</th>
            <th className="border border-gray-300 p-3">Quantity</th>
            <th className="border border-gray-300 p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredInventory.length > 0 ? (
            filteredInventory.map((medicine) => (
              <tr key={medicine.id}>
                <td className="border border-gray-300 p-3">
                  {medicine.itemName}
                </td>
                <td className="border border-gray-300 p-3">
                  {medicine.quantity}
                </td>
                <td className="border border-gray-300 p-3">
                  {medicine.status}
                </td>
              </tr>
            ))
          ) : (
            <tr>
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

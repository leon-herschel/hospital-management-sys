import { useState, useEffect } from "react";
import { ref, onValue, get } from "firebase/database";
import { database } from "../../firebase/firebase";
import { calculateStatus } from "./CalculateStatusLogic";
import DepartmentBreakdown from "./DepartmentBreakdown";
import Pagination from "../../components/reusable/Pagination"; // Import your Pagination component

const OverAllMedicine = () => {
  const [medsList, setMedsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Current page state
  const itemsPerPage = 10; // Items per page

  useEffect(() => {
    const fetchData = async () => {
      try {
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
                    const genericName = value.genericName;
                    const maxQuantity = value.maxQuantity || value.quantity;
  
                    if (totalMeds[genericName]) {
                      totalMeds[genericName].quantity += value.quantity || 0;
                    } else {
                      totalMeds[genericName] = {
                        id: key,
                        shortDesc: value.shortDesc || "",
                        standardDesc: value.standardDesc || "",
                        customDesc: value.customDesc || "",
                        genericName: genericName,
                        specifications: value.specifications || "",
                        itemGroup: value.itemGroup || "",
                        itemCategory: value.itemCategory || "",
                        examinationType: value.examinationType || "",
                        nhipCategory: value.nhipCategory || "",
                        drugAdminGroup: value.drugAdminGroup || "",
                        smallUnit: value.smallUnit || "",
                        conversion: value.conversion || "",
                        bigUnit: value.bigUnit || "",
                        expiryDate: value.expiryDate || "",
                        quantity: value.quantity || 0,
                        maxQuantity: maxQuantity,
                        status: calculateStatus(value.quantity || 0, maxQuantity),
                      };
                    }
                  });
                }
              }
              setMedsList(Object.values(totalMeds));
            } else {
              setMedsList([]);
            }
            setLoading(false);
          },
          (error) => {
            setError(error);
            setLoading(false);
          }
        );
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);
  

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error fetching data: {error.message}</div>;
  }

  const filteredInventory = medsList.filter((item) =>
    item.genericName && item.genericName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInventory.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="max-w-full mx-auto mt-2 bg-white rounded-lg shadow-md p-6">
      <h1 className="text-xl font-bold mb-4">Overall Medicine Inventory</h1>
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
            <th className="px-6 py-3">Short Description</th>
                    <th className="px-6 py-3">Standard Description</th>
                    <th className="px-6 py-3">Custom Description</th>
                    <th className="px-6 py-3">Generic Name</th>
                    <th className="px-6 py-3">Specificications</th>
                    <th className="px-6 py-3">Item Group</th>
                    <th className="px-6 py-3">Item Category</th>
                    <th className="px-6 py-3">Examination Type</th>
                    <th className="px-6 py-3">NHIP Category</th>
                    <th className="px-6 py-3">Drug Admin Group</th>
                    <th className="px-6 py-3">Small Unit</th>
                    <th className="px-6 py-3">Conversion</th>
                    <th className="px-6 py-3">Big Unit</th>
                    <th className="px-6 py-3">Expiry Date</th>
                    <th className="px-6 py-3">Quantity</th>
                    <th className="px-6 py-3"> Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((medicine) => (
                <tr key={medicine.id} className="bg-white border-b hover:bg-slate-100">
                <td className="px-6 py-3">{medicine.shortDesc}</td>
                        <td className="px-6 py-3">{medicine.standardDesc}</td>
                        <td className="px-6 py-3">{medicine.customDesc}</td>
                        <td className="px-6 py-3">{medicine.genericName}</td>
                        <td className="px-6 py-3">{medicine.specifications}</td>
                        <td className="px-6 py-3">{medicine.itemGroup}</td>
                        <td className="px-6 py-3">{medicine.itemCategory}</td>
                        <td className="px-6 py-3">{medicine.examinationType}</td>
                        <td className="px-6 py-3">{medicine.nhipCategory}</td>
                        <td className="px-6 py-3">{medicine.drugAdminGroup}</td>
                        <td className="px-6 py-3">{medicine.smallUnit}</td>
                        <td className="px-6 py-3">{medicine.conversion}</td>
                        <td className="px-6 py-3">{medicine.bigUnit}</td>
                        <td className="px-6 py-3">{medicine.expiryDate}</td>
                        <td className="px-6 py-3">{medicine.quantity}</td>
                        <td className="px-6 py-3">{medicine.status}</td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => setSelectedItem(medicine.genericName)} // Open modal for selected item
                      className="bg-blue-500 text-white px-4 py-2 rounded-md"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="15" className="px-6 py-3">
                  No medicines found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Component */}
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

      {/* Render DepartmentBreakdown modal if an item is selected */}
      {selectedItem && (
        <DepartmentBreakdown
          itemName={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};

export default OverAllMedicine;

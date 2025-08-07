import { useState, useEffect } from "react";
import { ref, onValue, get } from "firebase/database";
import { database } from "../../firebase/firebase";
import { Search, Package, Eye, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { calculateStatus } from "./CalculateStatusLogic";
import DepartmentBreakdown from "./DepartmentBreakdown";
import Pagination from "../../components/reusable/Pagination";
import { sortByField } from "../../components/reusable/Sorter";
import { useAuth } from "../../context/authContext/authContext";

const OverAllSupplyInventory = () => {
  const { user, role } = useAuth(); // Get user and role from auth context
  const [suppliesList, setSuppliesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data to get clinic affiliation if not admin
        let userClinicAffiliation = null;
        
        if (role !== 'admin' && user?.uid) {
          const userRef = ref(database, `users/${user.uid}`);
          const userSnapshot = await get(userRef);
          const userData = userSnapshot.val();
          userClinicAffiliation = userData?.clinicAffiliation;
        }

        // Fetch clinic inventory stock
        const clinicInventoryRef = ref(database, "clinicInventoryStock");
        const inventoryItemsRef = ref(database, "inventoryItems");
        
        onValue(
          clinicInventoryRef,
          async (clinicSnapshot) => {
            const clinicInventoryData = clinicSnapshot.val();
            
            // Fetch inventory items data to get item details
            const inventoryItemsSnapshot = await get(inventoryItemsRef);
            const inventoryItemsData = inventoryItemsSnapshot.val();
            
            if (clinicInventoryData && inventoryItemsData) {
              const supplyInventory = {};
              
              // Process each clinic in clinic inventory
              Object.entries(clinicInventoryData).forEach(([clinicKey, itemStocks]) => {
                // For non-admin users, only process their clinic's inventory
                if (role !== 'admin' && userClinicAffiliation && clinicKey !== userClinicAffiliation) {
                  return; // Skip this clinic
                }
                
                // The actual item keys are nested within each clinic entry
                Object.entries(itemStocks).forEach(([itemKey, stockData]) => {
                  // Get item details from inventoryItems collection
                  const itemDetails = inventoryItemsData[itemKey];
                  
                  // Only process items with itemGroup "Supply"
                  if (itemDetails && itemDetails.itemGroup === "Supply") {
                    let totalClinicQuantity = stockData.quantity || 0;
                    let totalTransferredQuantity = 0;
                    
                    // Add transferred quantity if exists
                    if (stockData.deparmentStock || stockData.departmentStock) {
                      const deptStock = stockData.deparmentStock || stockData.departmentStock;
                      if (typeof deptStock === 'object' && deptStock.quantity) {
                        totalTransferredQuantity = deptStock.quantity;
                      } else if (typeof deptStock === 'object') {
                        // Handle multiple departments
                        Object.values(deptStock).forEach(dept => {
                          if (typeof dept === 'number') {
                            totalTransferredQuantity += dept;
                          } else if (dept && dept.quantity) {
                            totalTransferredQuantity += dept.quantity;
                          }
                        });
                      }
                    }
                    
                    // Calculate overall total
                    const overallTotal = totalClinicQuantity + totalTransferredQuantity;
                    
                    // Use itemName as key for aggregation (in case same supply appears multiple times)
                    const itemName = itemDetails.itemName || 'Unknown';
                    
                    // For admin: aggregate across all clinics
                    // For regular users: only their clinic (already filtered above)
                    if (supplyInventory[itemName]) {
                      // If supply already exists, aggregate the quantities
                      supplyInventory[itemName].clinicQuantity += totalClinicQuantity;
                      supplyInventory[itemName].transferredQuantity += totalTransferredQuantity;
                      supplyInventory[itemName].overallTotal += overallTotal;
                      // Add clinic info for admin view
                      if (role === 'admin') {
                        supplyInventory[itemName].clinics = supplyInventory[itemName].clinics || [];
                        supplyInventory[itemName].clinics.push({
                          clinicKey,
                          clinicQuantity: totalClinicQuantity,
                          transferredQuantity: totalTransferredQuantity
                        });
                      }
                    } else {
                      // Create new entry
                      supplyInventory[itemName] = {
                        id: itemKey,
                        itemName: itemName,
                        specifications: itemDetails.specifications || "",
                        itemGroup: itemDetails.itemGroup || "",
                        itemCategory: itemDetails.itemCategory || "",
                        smallUnit: itemDetails.unitOfMeasure?.smallUnit || "",
                        conversion: itemDetails.unitOfMeasure?.conversionFactor || "",
                        bigUnit: itemDetails.unitOfMeasure?.bigUnit || "",
                        clinicQuantity: totalClinicQuantity,
                        transferredQuantity: totalTransferredQuantity,
                        overallTotal: overallTotal,
                        maxQuantity: itemDetails.maxQuantity || overallTotal,
                        status: calculateStatus(overallTotal, itemDetails.maxQuantity || overallTotal),
                        // Add clinic info for admin view
                        clinics: role === 'admin' ? [{
                          clinicKey,
                          clinicQuantity: totalClinicQuantity,
                          transferredQuantity: totalTransferredQuantity
                        }] : undefined
                      };
                    }
                  }
                });
              });
              
              // Convert to array and sort
              const sortedSupplies = sortByField(Object.values(supplyInventory), "itemName");
              setSuppliesList(sortedSupplies);
            } else {
              setSuppliesList([]);
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching data:", error);
            setError(error);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("Error in fetchData:", err);
        setError(err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center space-y-2">
          <Package className="animate-spin" size={32} />
          <div className="text-lg">Loading supply inventory...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-full mx-auto mt-2 bg-red-50 rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertTriangle size={20} />
          <span>Error fetching data: {error.message}</span>
        </div>
      </div>
    );
  }

  const filteredInventory = suppliesList.filter((item) =>
    item.itemName && item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInventory.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Calculate totals for summary
  const totalSupplies = filteredInventory.length;
  const totalClinicStock = filteredInventory.reduce((sum, item) => sum + item.clinicQuantity, 0);
  const totalTransferred = filteredInventory.reduce((sum, item) => sum + item.transferredQuantity, 0);
  const totalOverall = filteredInventory.reduce((sum, item) => sum + item.overallTotal, 0);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Good':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'Low':
        return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'Critical':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-full mx-auto mt-2 bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center space-x-2">
        <Package size={24} />
        <span>Overall Supply Inventory</span>
      </h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
          <h3 className="text-sm font-semibold text-blue-800">Total Supplies</h3>
          <p className="text-2xl font-bold text-blue-900">{totalSupplies}</p>
          <p className="text-xs text-blue-600">Different items</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
          <h3 className="text-sm font-semibold text-green-800">Clinic Stock</h3>
          <p className="text-2xl font-bold text-green-900">{totalClinicStock}</p>
          <p className="text-xs text-green-600">Units in main clinic</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
          <h3 className="text-sm font-semibold text-orange-800">Transferred</h3>
          <p className="text-2xl font-bold text-orange-900">{totalTransferred}</p>
          <p className="text-xs text-orange-600">Units in departments</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
          <h3 className="text-sm font-semibold text-purple-800">Overall Total</h3>
          <p className="text-2xl font-bold text-purple-900">{totalOverall}</p>
          <p className="text-xs text-purple-600">Total units available</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search for supplies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Supply Table */}
      <div className="relative overflow-x-auto rounded-md shadow-sm">
        <table className="w-full text-sm text-gray-900 text-center border border-gray-200">
          <thead className="text-sm bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">Item Name</th>
              <th className="px-4 py-3">Specifications</th>
              <th className="px-4 py-3">Item Group</th>
              <th className="px-4 py-3">Item Category</th>
              <th className="px-4 py-3">Small Unit</th>
              <th className="px-4 py-3">Conversion</th>
              <th className="px-4 py-3">Big Unit</th>
              <th className="px-4 py-3">Clinic Stock</th>
              <th className="px-4 py-3">Transferred</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((supply) => (
                <tr key={supply.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-left">
                    <div className="font-medium">{supply.itemName}</div>
                    <div className="text-xs text-gray-500">{supply.specifications}</div>
                  </td>
                  <td className="px-4 py-3">{supply.specifications}</td>
                  <td className="px-4 py-3">
                    <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded">
                      {supply.itemGroup}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                      {supply.itemCategory}
                    </span>
                  </td>
                  <td className="px-4 py-3">{supply.smallUnit}</td>
                  <td className="px-4 py-3">{supply.conversion}</td>
                  <td className="px-4 py-3">{supply.bigUnit}</td>
                  <td className="px-4 py-3 font-semibold text-green-700">{supply.clinicQuantity}</td>
                  <td className="px-4 py-3 font-semibold text-orange-700">{supply.transferredQuantity}</td>
                  <td className="px-4 py-3 font-bold text-purple-700">{supply.overallTotal}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-1">
                      {getStatusIcon(supply.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        supply.status === 'Good' ? 'bg-green-100 text-green-800' :
                        supply.status === 'Low' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {supply.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedItem(supply.itemName)}
                      className="flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md transition-colors text-xs"
                    >
                      <Eye size={14} />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="12" className="px-6 py-8 text-gray-500">
                  <div className="flex flex-col items-center space-y-2">
                    <Package size={32} className="text-gray-300" />
                    <span>No supplies found.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Component */}
      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={handlePageChange} 
        />
      )}

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

export default OverAllSupplyInventory;
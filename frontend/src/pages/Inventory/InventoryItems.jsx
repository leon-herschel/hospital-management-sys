import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";
import QRCode from "react-qr-code";
import ViewMedicineModal from "./ViewMedicineModal";
import {
  TrashIcon,
  PencilSquareIcon,
  EyeIcon,
  PlusIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  Bars3BottomLeftIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { Pill, Package, Search, Calendar, FileText, Grid3X3, List } from "lucide-react";
import DateRangePicker from "../../components/DateRangePicker/DateRangePicker";
import AddMedicineModal from "./AddMedicineModal";
import AddSupplyModal from "./AddSupplyModal";
import EditItemsSupply from "./EditItemsSupply";
import DeleteItemsSupply from "./DeleteItemsSupply";
import ReferrenceItemSuccessModal from "./ReferrenceItemSuccessModal";
import jsPDF from "jspdf";
import "jspdf-autotable";

const Inventory = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedTab, setSelectedTab] = useState("Medicine");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // "table" or "grid"
  
  // Success Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successOperation, setSuccessOperation] = useState({
    type: '', // 'add', 'update', 'delete'
    itemName: '',
    itemType: ''
  });

  useEffect(() => {
    const inventoryRef = ref(database, "inventoryItems");
    const unsubscribe = onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const items = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        setInventoryItems(items);
      } else {
        setInventoryItems([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const filteredItems = inventoryItems
    .filter((item) => {
      const matchesGroup = item.itemGroup === selectedTab;
      const matchesSearch = item.itemName
        ?.toLowerCase()
        .includes(search.toLowerCase());

      const createdAtDate = item.createdAt ? new Date(item.createdAt) : null;
      const inRange =
        (!startDate || (createdAtDate && createdAtDate >= startDate)) &&
        (!endDate || (createdAtDate && createdAtDate <= endDate));

      return matchesGroup && matchesSearch && inRange;
    })
    .sort((a, b) => a.itemName.localeCompare(b.itemName));

  const handleView = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  // Success Modal Handler
  const showSuccess = (operationType, itemName, itemType) => {
    setSuccessOperation({
      type: operationType,
      itemName,
      itemType
    });
    setShowSuccessModal(true);
  };

  const generateReport = () => {
    const doc = new jsPDF();

    const reportTitle = `${selectedTab} Inventory Report`;

    doc.setFontSize(16);
    doc.text(reportTitle, 14, 20);

    let currentY = 28;

    if (startDate && endDate) {
      doc.setFontSize(10);
      doc.text(
        `Date Range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        14,
        currentY
      );
      currentY += 6;
    }

    let head;
    let body;

    if (selectedTab === "Medicine") {
      head = [
        [
          "#",
          "Item Name",
          "Brand",
          "Generic Name",
          "Dosage",
          "Category",
          "Qty",
          "Created At",
        ],
      ];
      body = filteredItems.map((item, index) => [
        index + 1,
        item.itemName,
        item.brand || "-",
        item.genericName || "-",
        item.defaultDosage || "-",
        item.itemCategory || "-",
        item.quantity || 0,
        new Date(item.createdAt).toLocaleString("en-PH"),
      ]);
    } else {
      head = [["#", "Item Name", "Category", "Qty", "Created At"]];
      body = filteredItems.map((item, index) => [
        index + 1,
        item.itemName,
        item.itemCategory || "-",
        item.quantity || 0,
        new Date(item.createdAt).toLocaleString("en-PH"),
      ]);
    }

    doc.autoTable({
      startY: currentY,
      head,
      body,
      styles: { fontSize: 8 },
      theme: "striped",
    });

    doc.save(`${selectedTab.toLowerCase()}_inventory_report.pdf`);
  };

  const ItemCard = ({ item }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 hover:border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              item.itemGroup === 'Medicine' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {item.itemGroup === 'Medicine' ? <Pill className="w-3 h-3 mr-1" /> : <Package className="w-3 h-3 mr-1" />}
              {item.itemGroup}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {item.itemCategory}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 text-lg mb-1">{item.itemName}</h3>
          {item.brand && (
            <p className="text-sm text-gray-600 mb-2">Brand: {item.brand}</p>
          )}
          {item.genericName && (
            <p className="text-sm text-gray-600 mb-2">Generic: {item.genericName}</p>
          )}
        </div>
        <div className="ml-4 flex flex-col items-center">
          <QRCode value={item.id} size={60} />
          <p className="text-xs text-gray-500 mt-1">ID: {item.id.slice(-6)}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Cost Price:</span>
          <span className="font-medium">₱{item.defaultCostPrice?.toFixed(2) || '0.00'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Retail Price:</span>
          <span className="font-medium">₱{item.defaultRetailPrice?.toFixed(2) || '0.00'}</span>
        </div>
        <div className="text-xs text-gray-500 mt-3">
          Created: {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-PH") : "-"}
        </div>
      </div>

      <div className="flex space-x-2 pt-4 border-t border-gray-100">
        <button
          onClick={() => handleView(item)}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
        >
          <EyeIcon className="w-4 h-4" />
          <span>View</span>
        </button>
        <button
          onClick={() => handleEdit(item)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
        >
          <PencilSquareIcon className="w-4 h-4" />
          <span>Edit</span>
        </button>
        <button
          onClick={() => handleDelete(item)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
        >
          <TrashIcon className="w-4 h-4" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
              <p className="text-gray-600">Manage your medicine and supply inventory</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={generateReport}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Generate Report</span>
              </button>
              
              
              {selectedTab === "Medicine" && (
                <button
                  onClick={() => setShowMedicineModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center space-x-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Add Medicine</span>
                </button>
              )}

              {selectedTab === "Supply" && (
                <button
                  onClick={() => setShowSupplyModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center space-x-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Add Supply</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs and Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setSelectedTab("Medicine")}
                className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                  selectedTab === "Medicine"
                    ? "bg-white text-green-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Pill className="w-4 h-4" />
                <span>Medicine</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedTab === "Medicine" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                }`}>
                  {inventoryItems.filter(item => item.itemGroup === "Medicine").length}
                </span>
              </button>
              <button
                onClick={() => setSelectedTab("Supply")}
                className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                  selectedTab === "Supply"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Supply</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedTab === "Supply" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"
                }`}>
                  {inventoryItems.filter(item => item.itemGroup === "Supply").length}
                </span>
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>

              {/* Date Range */}
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={(date) => setStartDate(date)}
                onEndDateChange={(date) => setEndDate(date)}
              />

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === "table" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                  }`}
                  title="Table View"
                >
                  <Bars3BottomLeftIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === "grid" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                  }`}
                  title="Grid View"
                >
                  <Squares2X2Icon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                selectedTab === "Medicine" ? "bg-green-100" : "bg-blue-100"
              }`}>
                {selectedTab === "Medicine" ? 
                  <Pill className={`w-8 h-8 ${selectedTab === "Medicine" ? "text-green-600" : "text-blue-600"}`} /> :
                  <Package className={`w-8 h-8 ${selectedTab === "Medicine" ? "text-green-600" : "text-blue-600"}`} />
                }
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No {selectedTab.toLowerCase()} items found</h3>
              <p className="text-gray-600 mb-6">Get started by adding your first {selectedTab.toLowerCase()} item to the inventory.</p>
              <button
                onClick={() => selectedTab === "Medicine" ? setShowMedicineModal(true) : setShowSupplyModal(true)}
                className={`px-6 py-3 text-white rounded-xl font-medium transition-colors flex items-center space-x-2 ${
                  selectedTab === "Medicine" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add {selectedTab}</span>
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item Details</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">QR Code</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pricing</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            item.itemGroup === 'Medicine' ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            {item.itemGroup === 'Medicine' ? 
                              <Pill className={`w-5 h-5 ${item.itemGroup === 'Medicine' ? 'text-green-600' : 'text-blue-600'}`} /> :
                              <Package className={`w-5 h-5 ${item.itemGroup === 'Medicine' ? 'text-green-600' : 'text-blue-600'}`} />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{item.itemName}</p>
                            {item.brand && (
                              <p className="text-sm text-gray-600 truncate">Brand: {item.brand}</p>
                            )}
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                item.itemGroup === 'Medicine' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {item.itemGroup}
                              </span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                {item.itemCategory}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center">
                          <QRCode value={item.id} size={50} />
                          <p className="text-xs text-gray-500 mt-1">ID: {item.id.slice(-6)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="text-gray-600">Cost: </span>
                            <span className="font-medium">₱{item.defaultCostPrice?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600">Retail: </span>
                            <span className="font-medium">₱{item.defaultRetailPrice?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString("en-PH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors"
                            onClick={() => handleView(item)}
                            title="View Details"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                            onClick={() => handleEdit(item)}
                            title="Edit Item"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                            onClick={() => handleDelete(item)}
                            title="Delete Item"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showViewModal && selectedItem && (
        <ViewMedicineModal
          item={selectedItem}
          onClose={() => setShowViewModal(false)}
        />
      )}

      {showEditModal && selectedItem && (
        <EditItemsSupply
          isOpen={showEditModal}
          item={selectedItem}
          onClose={() => setShowEditModal(false)}
          onUpdated={(itemName, itemType) => {
            setShowEditModal(false);
            showSuccess('update', itemName || selectedItem.itemName, itemType || selectedItem.itemGroup);
          }}
        />
      )}

      {showDeleteModal && selectedItem && (
        <DeleteItemsSupply
          isOpen={showDeleteModal}
          item={selectedItem}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={(itemName, itemType) => {
            setShowDeleteModal(false);
            showSuccess('delete', itemName || selectedItem.itemName, itemType || selectedItem.itemGroup);
          }}
        />
      )}

      {showMedicineModal && (
        <AddMedicineModal
          isOpen={showMedicineModal}
          toggleModal={() => setShowMedicineModal(false)}
          onSuccess={(itemName) => {
            setShowMedicineModal(false);
            showSuccess('add', itemName, 'Medicine');
          }}
        />
      )}

      {showSupplyModal && (
        <AddSupplyModal
          isOpen={showSupplyModal}
          toggleModal={() => setShowSupplyModal(false)}
          onSuccess={(itemName) => {
            setShowSupplyModal(false);
            showSuccess('add', itemName, 'Supply');
          }}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <ReferrenceItemSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          operationType={successOperation.type}
          itemName={successOperation.itemName}
          itemType={successOperation.itemType}
          autoClose={true}
          autoCloseDelay={3000}
        />
      )}
    </div>
  );
};

export default Inventory;
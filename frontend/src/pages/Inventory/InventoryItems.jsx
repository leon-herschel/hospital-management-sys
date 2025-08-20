import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";
import QRCode from "react-qr-code";
import ViewMedicineModal from "./ViewMedicineModal";
import {
  TrashIcon,
  PencilSquareIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import DateRangePicker from "../../components/DateRangePicker/DateRangePicker";
import AddMedicineModal from "./AddMedicineModal";
import AddSupplyModal from "./AddSupplyModal";
import jsPDF from "jspdf";
import "jspdf-autotable";


const Inventory = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedTab, setSelectedTab] = useState("Medicine");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showSupplyModal, setShowSupplyModal] = useState(false);

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

  const toggleModal = () => setShowAddModal(!showAddModal);

  const handleView = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };
  
  const generateReport = () => {
    const doc = new jsPDF();
  
    // Dynamic title
    const reportTitle = `${selectedTab} Inventory Report`;
  
    doc.setFontSize(16);
    doc.text(reportTitle, 14, 20);
  
    let currentY = 28;
  
    // If date range selected, print it
    if (startDate && endDate) {
      doc.setFontSize(10);
      doc.text(
        `Date Range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        14,
        currentY
      );
      currentY += 6;
    }
  
    // Table data dynamically
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
      // Supply tab columns
      head = [
        ["#", "Item Name", "Category", "Qty", "Created At"],
      ];
      body = filteredItems.map((item, index) => [
        index + 1,
        item.itemName,
        item.itemCategory || "-",
        item.quantity || 0,
        new Date(item.createdAt).toLocaleString("en-PH"),
      ]);
    }
  
    // Generate the table
    doc.autoTable({
      startY: currentY,
      head,
      body,
      styles: { fontSize: 8 },
      theme: "striped",
    });
  
    doc.save(`${selectedTab.toLowerCase()}_inventory_report.pdf`);
  };
  
  
  return (
    <div className="w-full">
      {/* Tabs and Search */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedTab("Medicine")}
            className={`px-6 py-2 rounded-md ${
              selectedTab === "Medicine"
                ? "bg-slate-900 text-white font-bold"
                : "bg-slate-200 text-gray-900"
            }`}
          >
            Medicine
          </button>
          <button
            onClick={() => setSelectedTab("Supply")}
            className={`px-6 py-2 rounded-md ${
              selectedTab === "Supply"
                ? "bg-slate-900 text-white font-bold"
                : "bg-slate-200 text-gray-900"
            }`}
          >
            Supply
          </button>
        </div>

        {selectedTab === "Medicine" && (
          <button
            onClick={() => setShowMedicineModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
          >
            Add Medicine
          </button>
        )}

        {selectedTab === "Supply" && (
          <button
            onClick={() => setShowSupplyModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
          >
            Add Supply
          </button>
        )}
      </div>
      <button
    onClick={generateReport}
    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
  >
    Generate Report
  </button>
      {/* Date Range Picker */}
      <div className="flex justify-end mb-4">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={(date) => setStartDate(date)}
          onEndDateChange={(date) => setEndDate(date)}
        />
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto rounded-md shadow-sm">
        <table className="w-full text-sm text-center border border-slate-200">
          <thead className="bg-slate-200 text-gray-700">
            <tr>
              <th className="px-4 py-2">Item Name</th>
              <th className="px-4 py-2">Brand</th>
              <th className="px-4 py-2">QR Code</th>
              <th className="px-4 py-2">Created At</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-4 text-center">
                  No items found.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className="bg-white border-t hover:bg-slate-100"
                >
                  <td className="px-4 py-2">{item.itemName}</td>
                  <td className="px-4 py-2">{item.brand || "-"}</td>
                  <td className="px-4 py-2 flex justify-center">
                    <QRCode value={item.id} size={50} />
                  </td>
                  <td className="px-4 py-2">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString("en-PH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded-md flex items-center space-x-1"
                        onClick={() => handleView(item)}
                      >
                        <EyeIcon className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md flex items-center space-x-1">
                        <PencilSquareIcon className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md flex items-center space-x-1">
                        <TrashIcon className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showViewModal && selectedItem && (
  <ViewMedicineModal
    item={selectedItem}
    onClose={() => setShowViewModal(false)}
  />
)}
      {/* Modals */}
      
      {showMedicineModal && (
  <AddMedicineModal
    isOpen={showMedicineModal}
    toggleModal={() => setShowMedicineModal(false)}
  />
)}

{showSupplyModal && (
  <AddSupplyModal
    isOpen={showSupplyModal}
    toggleModal={() => setShowSupplyModal(false)}
  />
)}



    </div>

    
  );
};

export default Inventory;
import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";
import QRCode from "react-qr-code";
import AddClinicInventory from "./addClinicInventory";
import DateRangePicker from "../../components/DateRangePicker/DateRangePicker";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function ClinicInventory() {
  const [inventory, setInventory] = useState([]);
  const [inventoryNames, setInventoryNames] = useState({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const toggleModal = () => setIsAddModalOpen(!isAddModalOpen);

  useEffect(() => {
    const inventoryRef = ref(database, "inventoryItems");
    onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val() || {};
      const nameMap = {};
      Object.entries(data).forEach(([id, details]) => {
        nameMap[id] = details.itemName;
      });
      setInventoryNames(nameMap);
    });

    const clinicInventoryRef = ref(database, "clinicInventoryStock");
    onValue(clinicInventoryRef, (snapshot) => {
      const data = snapshot.val() || {};
      const formattedData = [];

      Object.entries(data).forEach(([clinicId, clinicItems]) => {
        Object.entries(clinicItems).forEach(([itemId, itemDetails]) => {
          formattedData.push({
            clinicId,
            itemId,
            ...itemDetails,
          });
        });
      });

      setInventory(formattedData);
    });
  }, []);

  const filteredAndSortedInventory = inventory
    .filter((item) => {
      const name = inventoryNames[item.itemId] || "";
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
      const itemDate = new Date(item.lastUpdated);
      const inDateRange =
        (!startDate || itemDate >= startDate) &&
        (!endDate || itemDate <= endDate);
      return matchesSearch && inDateRange;
    })
    .sort((a, b) => {
      const nameA = inventoryNames[a.itemId]?.toLowerCase() || "";
      const nameB = inventoryNames[b.itemId]?.toLowerCase() || "";
      return nameA.localeCompare(nameB);
    });

  const handleGeneratePDF = () => {
  const doc = new jsPDF();
  const lineSpacing = 10;
  let y = 15;

  doc.setFontSize(14);
  doc.text("Clinic Inventory Report", 14, y);

  // Show date range only if selected
  if (startDate && endDate) {
    y += lineSpacing;
    doc.setFontSize(11);
    doc.text(
      `Date Range: ${startDate.toISOString().split("T")[0]} to ${endDate
        .toISOString()
        .split("T")[0]}`,
      14,
      y
    );
  }

  const tableStartY = y + lineSpacing + 5;

  const tableData = filteredAndSortedInventory.map((item) => [
    inventoryNames[item.itemId] || item.itemId,
    item.quantity,
    item.lastUpdated,
    item.status,
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [["Item Name", "Quantity", "Last Updated", "Status"]],
    body: tableData,
    styles: { fontSize: 10 },
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename =
    startDate && endDate
      ? `Clinic_Inventory_${timestamp}_filtered.pdf`
      : `Clinic_Inventory_${timestamp}.pdf`;

  doc.save(filename);
};

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-2xl font-semibold">Clinic Inventory</h2>
        <div className="flex gap-2">
          <button
            onClick={handleGeneratePDF}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Generate PDF
          </button>
          <button
            onClick={toggleModal}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Item to Clinic Inventory
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by item name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-4 py-2 rounded-md w-full max-w-sm"
        />

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={(date) => setStartDate(date)}
          onEndDateChange={(date) => setEndDate(date)}
        />
      </div>

      <div className="overflow-x-auto bg-white rounded-md shadow-md">
        <table className="w-full border text-center">
          <thead className="bg-slate-200">
            <tr>
              <th className="px-4 py-2">Item Name</th>
              <th className="px-4 py-2">Quantity</th>
              <th className="px-4 py-2">Last Updated</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">QR Code</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedInventory.length > 0 ? (
              filteredAndSortedInventory.map((item) => (
                <tr key={`${item.clinicId}-${item.itemId}`} className="border-t">
                  <td className="px-4 py-2">{inventoryNames[item.itemId] || item.itemId}</td>
                  <td className="px-4 py-2">{item.quantity}</td>
                  <td className="px-4 py-2">{item.lastUpdated}</td>
                  <td className="px-4 py-2">{item.status}</td>
                  <td className="px-4 py-2">
                    <QRCode value={item.itemId} size={50} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-4">
                  No clinic inventory data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl relative">
            <button
              onClick={toggleModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              ✕
            </button>
            <AddClinicInventory />
          </div>
        </div>
      )}
    </div>
  );
}

export default ClinicInventory;

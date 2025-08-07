import { useState } from "react";
import OverAllSupply from "./OverAllSupply";
import OverAllMedicine from "./OverAllMedicine";
import { useAccessControl } from "../../components/roles/accessControl";
import AccessDenied from "../ErrorPages/AccessDenied";
import { useAuth } from "../../context/authContext/authContext";


const OverAllInventory = () => {
  const { department } = useAuth(); 
  const permissions = useAccessControl(); 
  const [selectedTab, setSelectedTab] = useState("medicine");

  
  const generatePDF = () => {
  const { startDate, endDate } = dateRange[0];

  const filteredByDate = medsList.filter(item => {
    if (!item.expiryDate) return false;
    const itemDate = new Date(item.expiryDate);
    return itemDate >= startDate && itemDate <= endDate;
  });

  const doc = new jsPDF();
  doc.text("Medicine Inventory Report", 14, 20);
  doc.text(`From: ${startDate.toDateString()} To: ${endDate.toDateString()}`, 14, 30);

  const tableData = filteredByDate.map(item => [
    item.genericName,
    item.quantity,
    item.expiryDate || "N/A",
    item.status
  ]);

  doc.autoTable({
    head: [["Generic Name", "Quantity", "Expiry Date", "Status"]],
    body: tableData,
    startY: 40,
  });

  doc.save(`Medicine_Inventory_Report.pdf`);
};


  return (
    <div> 
      <button
        onClick={() => setSelectedTab("medicine")}
        className={`mb-2 space-x-4 px-6 py-2 rounded-md transition duration-200 ${
          selectedTab === "medicine"
            ? "bg-slate-900 text-white"
            : "bg-slate-200 text-gray-900"
        }`}
      >
        Medicine Overall Inventory
      </button>
      <button
        onClick={() => setSelectedTab("supply")}
        className={`space-x-4 px-6 py-2 rounded-md transition duration-200 ${
          selectedTab === "supply"
            ? "bg-slate-900 text-white"
            : "bg-slate-200 text-gray-900"
        }`}
      >
        Supply Overall Inventory
      </button>
      {selectedTab === "supply" && <OverAllSupply />}
      {selectedTab === "medicine" && <OverAllMedicine />}
    </div>
  );
};

export default OverAllInventory;

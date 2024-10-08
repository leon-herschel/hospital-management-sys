import { useState } from "react";
import MedicineHistory from "../PharmacyPOV/MedicineHistory";
import SupplyHistory from "../CSR POV/SupplyHistory";

function InventoryHistory() {
  const [selectedHistory, setSelectedHistory] = useState("medicine");

  const handleClick = (historyType) => {
    setSelectedHistory(historyType);
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-start items-center">
        <button
          onClick={() => handleClick("medicine")}
          className={`space-x-4 px-6 py-2 rounded-md transition duration-200 ${
            selectedHistory === "medicine"
              ? "bg-slate-900 text-white text-bold"
              : "bg-slate-200 text-gray-900"
          }`}
        >
          Medicine History
        </button>
        <button
          onClick={() => handleClick("supply")}
          className={`space-x-4 px-6 py-2 rounded-md transition duration-200 ${
            selectedHistory === "supply"
              ? "bg-slate-900 text-white text-bold"
              : "bg-slate-200 text-gray-900"
          }`}
        >
          Supply History
        </button>
      </div>

      {selectedHistory === "medicine" && <MedicineHistory />}
      {selectedHistory === "supply" && <SupplyHistory />}
      
    </div>
  );
}

export default InventoryHistory;

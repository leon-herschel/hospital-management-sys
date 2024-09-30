import { useState } from "react";
import MedicineHistory from "./MedicineHistory";
import SupplyHistory from "./SupplyHistory";

function InventoryHistory() {
  const [selectedHistory, setSelectedHistory] = useState("medicine");

  const handleClick = (historyType) => {
    setSelectedHistory(historyType);
  };
  return (
    <div>
      <button
        onClick={() => handleClick("medicine")}
        className="px-8 py-3 rounded-md transition duration-200"
      >
        MEDICINE HISTORY
      </button>
      <button
        onClick={() => handleClick("supply")}
        className="px-8 py-3 rounded-md transition duration-200"
      >
        SUPPLY HISTORY
      </button>

      {selectedHistory === "medicine" && <MedicineHistory />}
      {selectedHistory === "supply" && <SupplyHistory />}
    </div>
  );
}

export default InventoryHistory;

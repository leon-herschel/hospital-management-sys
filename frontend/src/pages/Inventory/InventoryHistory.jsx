import { useState } from "react";
import MedicineHistory from "./MedicineHistory";

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
      {selectedHistory === "supply" && <p>No supply history yet</p>}
    </div>
  );
}

export default InventoryHistory;

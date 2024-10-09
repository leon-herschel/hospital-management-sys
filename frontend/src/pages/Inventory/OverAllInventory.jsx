import { useState } from "react";
import OverAllSupply from "./OverAllSupply";
import OverAllMedicine from "./OverAllMedicine";

const OverAllInventory = () => {

  const [selectedTab, setSelectedTab] = useState("medicine")
  return (
    <div>
     <button onClick={() => setSelectedTab("medicine")} className={`space-x-4 px-6 py-2 rounded-md transition duration-200 ${
              selectedTab === "medicine"
                ? "bg-slate-900 text-white text-bold"
                : "bg-slate-200 text-gray-900"
            }`}>Medicine Overall Inventory</button>
     <button onClick={() => setSelectedTab("supply")} className={`space-x-4 px-6 py-2 rounded-md transition duration-200 ${
              selectedTab === "supply"
                ? "bg-slate-900 text-white text-bold"
                : "bg-slate-200 text-gray-900"
            }`}>Supply Overall Inventory</button>
     {selectedTab === "supply" && <OverAllSupply />}
     {selectedTab === "medicine" && <OverAllMedicine />}
    </div>
  );
}

export default OverAllInventory;

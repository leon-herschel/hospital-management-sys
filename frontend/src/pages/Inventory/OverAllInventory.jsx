import { useState } from "react";
import OverAllSupply from "./OverAllSupply";
import OverAllMedicine from "./OverAllMedicine";
import { useAccessControl } from "../../components/roles/accessControl";
import AccessDenied from "../ErrorPages/AccessDenied";

const OverAllInventory = () => {
  const permissions = useAccessControl();

  const [selectedTab, setSelectedTab] = useState("medicine")

  if (!permissions?.accessOverallInventory) {
    return <AccessDenied />;
  }
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

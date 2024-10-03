import { useState } from "react";
import OverAllMedicine from "./OverAllMedicine";
import OverAllSupply from "./OverAllSupply";

const OverAllInventory = () => {

    const [selectedInventory, setSelectedInventory] = useState(null);

    return (
        <div>
            <button onClick={() => setSelectedInventory("medicine")}>Medicines</button>
            <button onClick={() => setSelectedInventory("supply")}>Supplies</button>

            {selectedInventory === "medicine" && <OverAllMedicine />}
            {selectedInventory === "supply" && <OverAllSupply />}
        </div>
    );
}

export default OverAllInventory;

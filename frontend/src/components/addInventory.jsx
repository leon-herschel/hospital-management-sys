import React, { useState } from "react";
import { ref, push, set } from "firebase/database";
import { database } from "../dbconfig/db";

function AddInventory() {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");

  const handlesubmit = () => {
    if (!itemName || !quantity || !department || !status) {
      alert("Please fill in all the required fields");
      return;
    }
    const inventoryRef = ref(database, "inventory");
    const NewInventoryRef = push(inventoryRef);

    if (NewInventoryRef) {
      set(NewInventoryRef, {
        itemName: itemName,
        quantity: quantity,
        department: department,
        status: status,
      })
        .then(() => {
          alert("Inventory has been updated sucessfully");
          setItemName("");
          setQuantity("");
          setStatus("");
          setDepartment("");
        })
        .catch((error) => {
          alert("Error updating inventory: ", error);
        });
    }
  };

  return (
    <div>
      <h2>Add New Item</h2>

      <div>
        <label htmlFor="item">Item Name</label>
        <input
          type="text"
          id="item"
          name="item"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="quantity">Quantity</label>
        <input
          type="text"
          id="quantity"
          name="quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="department">Department</label>
        <select
          id="department"
          name="department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="" disabled>
            Select Department
          </option>
          <option value="IT">IT</option>
          <option value="Nursing">Nursing</option>
          <option value="MedTech">Medical Technology</option>
        </select>
      </div>

      <div>
        <label htmlFor="status">Status</label>
        <select
          id="status"
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="" disabled>
            Select Status
          </option>
          <option value="ok">Ok</option>
          <option value="low">Low</option>
          <option value="verylow">Very Low</option>
        </select>
      </div>

      <button onClick={handlesubmit}>Submit</button>
    </div>
  );
}

export default AddInventory;

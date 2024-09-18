import { Link } from "react-router-dom";

function inventory() {
  return (
    <div>
      <h2>inventory System</h2>
      <div>
        <Link to="/addInventory">
          <button>Add New Item</button>
        </Link>
      </div>
      <table>
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Quantity</th>
            <th>Department</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  );
}

export default inventory;

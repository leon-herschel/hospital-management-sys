import React from "react";

const SupplyTable = ({ supplies }) => {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <table className="table-auto w-full border-collapse">
      <thead>
        <tr>
          <th className="border px-4 py-2">Supply Name</th>
          <th className="border px-4 py-2">Quantity</th>
          <th className="border px-4 py-2">Timestamp</th>
        </tr>
      </thead>
      <tbody>
        {supplies.map((supply) => (
          <tr key={supply.id} className="border-t">
            <td className="border px-4 py-2">{supply.name}</td>
            <td className="border px-4 py-2">{supply.quantity}</td>
            <td className="border px-4 py-2">{formatDate(supply.timestamp)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default SupplyTable;

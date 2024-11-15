import React from "react";

const MedicineTable = ({ medicines }) => {
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
          <th className="border px-4 py-2">Medicine Name</th>
          <th className="border px-4 py-2">Quantity</th>
          <th className="border px-4 py-2">Timestamp</th>
        </tr>
      </thead>
      <tbody>
        {medicines.map((med) => (
          <tr key={med.id} className="border-t">
            <td className="border px-4 py-2">{med.name}</td>
            <td className="border px-4 py-2">{med.quantity}</td>
            <td className="border px-4 py-2">{formatDate(med.timestamp)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default MedicineTable;

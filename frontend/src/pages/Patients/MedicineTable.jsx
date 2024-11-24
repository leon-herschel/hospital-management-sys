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
    <div className="relative overflow-x-auto rounded-md shadow-sm">
      <table className="w-full text-md text-gray-900 text-center border border-slate-200">
        <thead className="text-md bg-slate-200">
          <tr>
            <th className="px-6 py-3">Medicine Name</th>
            <th className="px-6 py-3">Quantity</th>
            <th className="px-6 py-3">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {medicines.map((med) => (
            <tr key={med.id} className="bg-white border-b hover:bg-slate-100">
              <td className="px-6 py-3">{med.name}</td>
              <td className="px-6 py-3">{med.quantity}</td>
              <td className="px-6 py-3">{formatDate(med.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MedicineTable;

import React from "react";

const ItemUsageTable = ({ items }) => {
  if (!items || items.length === 0) {
    return <div>No items used yet.</div>;
  }

  return (
    <table className="w-full border border-gray-300 mt-4">
      <thead className="bg-gray-200">
        <tr>
          <th className="py-2 px-4 border">Item Name</th>
          <th className="py-2 px-4 border">Type</th>
          <th className="py-2 px-4 border">Used By</th>
          <th className="py-2 px-4 border">Used At</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={index} className="text-center">
            <td className="py-2 px-4 border">{item.name}</td>
            <td className="py-2 px-4 border">{item.type}</td>
            <td className="py-2 px-4 border">{item.addedBy || "Unknown"}</td>
            <td className="py-2 px-4 border">
              {item.usedAt
                ? new Date(item.usedAt).toLocaleString()
                : item.timestamp
                ? new Date(item.timestamp).toLocaleString()
                : "No timestamp"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ItemUsageTable;

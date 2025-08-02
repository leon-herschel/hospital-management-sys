import React from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";

const ViewMedicineModal = ({ item, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-xl font-bold mb-4">Inventory Item Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><strong>Item Name:</strong> {item.itemName}</div>
          <div><strong>Brand:</strong> {item.brand || "-"}</div>
          <div><strong>Generic Name:</strong> {item.genericName || "-"}</div>
          <div><strong>Item Category:</strong> {item.itemCategory}</div>
          <div><strong>Item Group:</strong> {item.itemGroup}</div>
          <div><strong>Dosage:</strong> {item.defaultDosage || "-"}</div>
          <div><strong>Specifications:</strong> {item.specifications}</div>
          <div><strong>Cost Price:</strong> ₱{Number(item.defaultCostPrice).toFixed(2)}</div>
          <div><strong>Retail Price:</strong> ₱{Number(item.defaultRetailPrice).toFixed(2)}</div>
          <div><strong>Quantity:</strong> {item.quantity || 0}</div>
          <div><strong>Big Unit:</strong> {item.unitOfMeasure?.bigUnit || "-"}</div>
          <div><strong>Small Unit:</strong> {item.unitOfMeasure?.smallUnit || "-"}</div>
          <div><strong>Conversion Factor:</strong> {item.unitOfMeasure?.conversionFactor || "-"}</div>
          <div><strong>Created At:</strong> {new Date(item.createdAt).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

export default ViewMedicineModal;

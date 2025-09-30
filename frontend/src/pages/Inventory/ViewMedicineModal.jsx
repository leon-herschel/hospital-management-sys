import React from "react";
import { X, Pill, Package, Banknote, Calendar, Info, Hash } from "lucide-react";

const ViewMedicineModal = ({ item, onClose }) => {
  const formatPrice = (price) => `₱${Number(price).toFixed(2)}`;
  const formatDate = (date) => new Date(date).toLocaleString();

  const sections = [
    {
      title: "Basic Information",
      icon: <Info className="w-4 h-4" />,
      fields: [
        { label: "Item Name", value: item.itemName, icon: <Pill className="w-4 h-4" /> },
        { label: "Brand", value: item.brand || "-" },
        { label: "Generic Name", value: item.genericName || "-" },
        { label: "Specifications", value: item.specifications, colSpan: 2 }
      ]
    },
    {
      title: "Category & Classification",
      icon: <Package className="w-4 h-4" />,
      fields: [
        { label: "Item Category", value: item.itemCategory },
        { label: "Item Group", value: item.itemGroup },
        { label: "Dosage", value: item.defaultDosage || "-" }
      ]
    },
    {
      title: "Pricing & Inventory",
      icon: <Banknote className="w-4 h-4" />,
      fields: [
        { label: "Cost Price", value: formatPrice(item.defaultCostPrice) },
        { label: "Retail Price", value: formatPrice(item.defaultRetailPrice) },
        { label: "Current Quantity", value: item.quantity || 0, icon: <Hash className="w-4 h-4" /> }
      ]
    },
    {
      title: "Units of Measure",
      icon: <Package className="w-4 h-4" />,
      fields: [
        { label: "Big Unit", value: item.unitOfMeasure?.bigUnit || "-" },
        { label: "Small Unit", value: item.unitOfMeasure?.smallUnit || "-" },
        { label: "Conversion Factor", value: item.unitOfMeasure?.conversionFactor || "-" }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-full">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Medicine Details</h2>
              <p className="text-blue-100 mt-1">Complete inventory information</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid gap-6">
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-blue-600">{section.icon}</div>
                  <h3 className="font-semibold text-gray-800">{section.title}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.fields.map((field, fieldIndex) => (
                    <div 
                      key={fieldIndex} 
                      className={`bg-white p-4 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow ${
                        field.colSpan === 2 ? 'md:col-span-2 lg:col-span-2' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {field.icon && <div className="text-gray-500">{field.icon}</div>}
                        <span className="text-sm font-medium text-gray-600">{field.label}</span>
                      </div>
                      <div className="text-gray-900 font-medium break-words">
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Metadata */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-5 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-800">Record Information</h3>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600">Created At</span>
                </div>
                <div className="text-gray-900 font-medium">
                  {formatDate(item.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewMedicineModal;
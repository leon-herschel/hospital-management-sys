import React, { useState, useEffect } from "react";
import { get, ref, set } from "firebase/database";
import { database } from "../../firebase/firebase";
import { X, Save, Pill, Package } from "lucide-react";

function EditItemsSupply({ isOpen, item, onClose, onUpdated }) {
  const [itemName, setItemName] = useState("");
  const [brand, setBrand] = useState("");
  const [genericName, setGenericName] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [bigUnit, setBigUnit] = useState("");
  const [smallUnit, setSmallUnit] = useState("");
  const [conversionFactor, setConversionFactor] = useState("");
  const [defaultDosage, setDefaultDosage] = useState("");
  const [defaultCostPrice, setDefaultCostPrice] = useState("");
  const [defaultRetailPrice, setDefaultRetailPrice] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");

  const isMedicine = item?.itemGroup === "Medicine";

  useEffect(() => {
    if (item && isOpen) {
      // Pre-fill form with existing item data
      setItemName(item.itemName || "");
      setBrand(item.brand || "");
      setGenericName(item.genericName || "");
      setItemCategory(item.itemCategory || "");
      setBigUnit(item.unitOfMeasure?.bigUnit || "");
      setSmallUnit(item.unitOfMeasure?.smallUnit || "");
      setConversionFactor(item.unitOfMeasure?.conversionFactor || "");
      setDefaultDosage(item.defaultDosage || "");
      setDefaultCostPrice(item.defaultCostPrice || "");
      setDefaultRetailPrice(item.defaultRetailPrice || "");
      setSpecifications(item.specifications || "");
      setSelectedSupplier(item.supplierName || "");

      // Fetch suppliers
      const fetchSuppliers = async () => {
        try {
          const snapshot = await get(ref(database, "suppliers"));
          if (snapshot.exists()) {
            const data = snapshot.val();
            const supplierList = Object.entries(data).map(([id, value]) => ({
              id,
              name: value.name || id,
            }));
            setSuppliers(supplierList);
          }
        } catch (error) {
          console.error("Failed to fetch suppliers:", error);
        }
      };

      fetchSuppliers();
    }
  }, [item, isOpen]);

  const handleSubmit = async () => {
    if (!itemName || !itemCategory || !defaultCostPrice || !defaultRetailPrice || !specifications) {
      alert("Please fill out all required fields.");
      return;
    }

    // Additional validation for medicine items
    if (isMedicine && (!brand || !genericName || !bigUnit || !smallUnit || !conversionFactor || !defaultDosage)) {
      alert("Please fill out all required medicine fields.");
      return;
    }

    try {
      setLoading(true);
      const itemRef = ref(database, `inventoryItems/${item.id}`);
      
      let updatedData = {
        itemName,
        itemCategory,
        itemGroup: item.itemGroup,
        defaultCostPrice: parseFloat(defaultCostPrice),
        defaultRetailPrice: parseFloat(defaultRetailPrice),
        specifications,
        supplierName: selectedSupplier,
        createdAt: item.createdAt, // Keep original creation date
        updatedAt: new Date().toISOString(),
      };

      // Add medicine-specific fields
      if (isMedicine) {
        updatedData = {
          ...updatedData,
          brand,
          genericName,
          defaultDosage,
          unitOfMeasure: {
            bigUnit,
            smallUnit,
            conversionFactor: parseInt(conversionFactor),
          },
        };
      }

      await set(itemRef, updatedData);
      
      if (onUpdated) {
        onUpdated();
      }
      onClose();
      alert(`${itemName} has been updated successfully!`);
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Failed to update item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r px-6 py-4 text-white ${
          isMedicine ? 'from-green-600 to-green-700' : 'from-blue-600 to-blue-700'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-xl">
                {isMedicine ? <Pill className="w-6 h-6" /> : <Package className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold">Edit {item.itemGroup} Item</h2>
                <p className={`text-sm ${isMedicine ? 'text-green-100' : 'text-blue-100'}`}>
                  Update item information
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="hover:bg-white/20 p-2 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          <div className="space-y-6">
            {/* Supplier and Basic Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Supplier
                </label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all ${
                    isMedicine ? 'focus:ring-green-500' : 'focus:ring-blue-500'
                  }`}
                >
                  <option value="" disabled>Select supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Item Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter item name"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all ${
                    isMedicine ? 'focus:ring-green-500' : 'focus:ring-blue-500'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Category *
                </label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all ${
                    isMedicine ? 'focus:ring-green-500' : 'focus:ring-blue-500'
                  }`}
                >
                  <option value="" disabled>Select category</option>
                  {isMedicine ? (
                    <>
                      <option value="Nebules and Sprays">Nebules and Sprays</option>
                      <option value="Tablets and Capsules">Tablets and Capsules</option>
                      <option value="Syrup, Suspension and Drops">Syrup, Suspension and Drops</option>
                      <option value="Creams and Ointments">Creams and Ointments</option>
                      <option value="Ampoules and Vials">Ampoules and Vials</option>
                      <option value="Eye and Ear Preparation">Eye and Ear Preparation</option>
                      <option value="I.V Fluids">I.V Fluids</option>
                      <option value="Suppositories">Suppositories</option>
                      <option value="Oxygen">Oxygen</option>
                    </>
                  ) : (
                    <>
                      <option value="Syringes">Syringes</option>
                      <option value="Cotton and Gauze">Cotton and Gauze</option>
                      <option value="Surgical Tools">Surgical Tools</option>
                      <option value="Bandages and Tape">Bandages and Tape</option>
                      <option value="IV Sets">IV Sets</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Medicine-specific fields */}
            {isMedicine && (
              <>
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">Medicine Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Brand *
                      </label>
                      <input
                        type="text"
                        placeholder="Brand name"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Generic Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Generic name"
                        value={genericName}
                        onChange={(e) => setGenericName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Default Dosage *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 500mg"
                        value={defaultDosage}
                        onChange={(e) => setDefaultDosage(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Unit of Measure */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">Unit of Measure</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Big Unit *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Box"
                        value={bigUnit}
                        onChange={(e) => setBigUnit(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Small Unit *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Tablet"
                        value={smallUnit}
                        onChange={(e) => setSmallUnit(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Conversion Factor *
                      </label>
                      <input
                        type="number"
                        placeholder="e.g., 10"
                        value={conversionFactor}
                        onChange={(e) => setConversionFactor(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-blue-600 mt-3">
                    How many small units make one big unit? (e.g., 10 tablets = 1 box)
                  </p>
                </div>
              </>
            )}

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Cost Price *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-500">₱</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={defaultCostPrice}
                    onChange={(e) => setDefaultCostPrice(e.target.value)}
                    className={`w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all ${
                      isMedicine ? 'focus:ring-green-500' : 'focus:ring-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Retail Price *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-500">₱</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={defaultRetailPrice}
                    onChange={(e) => setDefaultRetailPrice(e.target.value)}
                    className={`w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all ${
                      isMedicine ? 'focus:ring-green-500' : 'focus:ring-blue-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Specifications *
              </label>
              <textarea
                placeholder="Enter item specifications and description..."
                value={specifications}
                onChange={(e) => setSpecifications(e.target.value)}
                rows={3}
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all resize-none ${
                  isMedicine ? 'focus:ring-green-500' : 'focus:ring-blue-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              * Required fields
            </p>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`px-6 py-2.5 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2 ${
                  isMedicine ? 'bg-green-600' : 'bg-blue-600'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Update Item</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditItemsSupply;
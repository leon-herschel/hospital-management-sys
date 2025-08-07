import React, { useState, useEffect } from 'react';
import { ref, update, get } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { Save, X, Package } from 'lucide-react';

function EditClinicInventory({ item, onClose }) {
  const [formData, setFormData] = useState({
    quantity: item.quantity || 0,
    status: item.status || 'In Stock',
    lastUpdated: new Date().toISOString().split('T')[0]
  });
  const [itemName, setItemName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch item name from inventoryItems
    const fetchItemName = async () => {
      try {
        const itemRef = ref(database, `inventoryItems/${item.itemId}`);
        const snapshot = await get(itemRef);
        if (snapshot.exists()) {
          setItemName(snapshot.val().itemName || item.itemId);
        } else {
          setItemName(item.itemId);
        }
      } catch (error) {
        console.error('Error fetching item name:', error);
        setItemName(item.itemId);
      }
    };

    fetchItemName();
  }, [item.itemId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value
    }));
  };

  const determineStatus = (quantity) => {
    if (quantity <= 0) return 'Critical';
    if (quantity <= 20) return 'Low Stock';
    return 'In Stock';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const updatedData = {
        ...formData,
        status: determineStatus(formData.quantity),
        lastUpdated: new Date().toISOString().split('T')[0]
      };

      const clinicInventoryRef = ref(database, `clinicInventoryStock/${item.clinicId}/${item.itemId}`);
      await update(clinicInventoryRef, updatedData);

      alert('Inventory item updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating inventory:', error);
      setError('Failed to update inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-6 h-6 text-blue-500" />
        <h2 className="text-2xl font-bold text-gray-800">Edit Inventory Item</h2>
      </div>
<div className="overflow-y-auto max-h-[70vh] pr-2">
      <form onSubmit={handleSubmit} className="space-y-6">
      
        {/* Item Information Display */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Item Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Item Name</label>
              <p className="text-gray-900 font-medium">{itemName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Clinic ID</label>
              <p className="text-gray-900 font-medium">{item.clinicId}</p>
            </div>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
              Current Quantity *
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="0"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter current quantity"
            />
            <p className="text-sm text-gray-500 mt-1">
              Status will be automatically determined: 0 = Critical, 1-20 = Low Stock, 21+ = In Stock
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Status
            </label>
            <div className={`px-3 py-2 rounded-md font-medium ${
              determineStatus(formData.quantity) === 'In Stock' ? 'bg-green-100 text-green-800' :
              determineStatus(formData.quantity) === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {determineStatus(formData.quantity)}
            </div>
          </div>
        </div>

        {/* Current vs New Comparison */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-700 mb-2">Changes Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Current Quantity: <span className="font-medium">{item.quantity}</span></p>
              <p className="text-sm text-gray-600">Current Status: <span className="font-medium">{item.status}</span></p>
            </div>
            <div>
              <p className="text-sm text-blue-600">New Quantity: <span className="font-medium">{formData.quantity}</span></p>
              <p className="text-sm text-blue-600">New Status: <span className="font-medium">{determineStatus(formData.quantity)}</span></p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Update Item
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </form>
    </div>
    </div>
  );
}

export default EditClinicInventory;
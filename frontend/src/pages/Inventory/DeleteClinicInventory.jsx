import React, { useState, useEffect } from 'react';
import { ref, remove, get } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { Trash2, AlertTriangle, X } from 'lucide-react';

function DeleteClinicInventory({ item, onClose, onSuccess}) {
  const [itemName, setItemName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmText, setConfirmText] = useState('');

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

  const handleDelete = async () => {
  if (confirmText !== 'DELETE') {
    setError('Please type "DELETE" to confirm the deletion.');
    return;
  }

  setLoading(true);
  setError('');

  try {
    const clinicInventoryRef = ref(database, `clinicInventoryStock/${item.clinicId}/${item.itemId}`);
    await remove(clinicInventoryRef);

    // ✅ Trigger success (same style as your edit)
    if (onSuccess) onSuccess("Inventory item deleted successfully!");

    // ✅ Close modal
    if (onClose) onClose();
  } catch (error) {
    console.error('Error deleting inventory:', error);
    setError('Failed to delete inventory item. Please try again.');
  } finally {
    setLoading(false);
  }
};


  const isDeleteEnabled = confirmText === 'DELETE';

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <Trash2 className="w-6 h-6 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-800">Delete Inventory Item</h2>
      </div>
<div className="overflow-y-auto max-h-[70vh] pr-2">
      {/* Warning Banner */}
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Warning: This action cannot be undone
            </h3>
            <p className="text-sm text-red-700 mt-1">
              This will permanently delete the inventory item from the clinic's stock. All data associated with this item will be lost.
            </p>
          </div>
        </div>
      </div>

      {/* Item Information */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Item to be deleted:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Item Name</label>
            <p className="text-gray-900 font-medium text-lg">{itemName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Clinic ID</label>
            <p className="text-gray-900 font-medium">{item.clinicId}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Current Quantity</label>
            <p className="text-gray-900 font-medium">{item.quantity} units</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Status</label>
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
              item.status === 'In Stock' ? 'bg-green-100 text-green-800' :
              item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {item.status}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Last Updated</label>
            <p className="text-gray-900 font-medium">{item.lastUpdated}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Item ID</label>
            <p className="text-gray-900 font-mono text-sm">{item.itemId}</p>
          </div>
        </div>
      </div>

      {/* Confirmation Input */}
      <div className="mb-6">
        <label htmlFor="confirmText" className="block text-sm font-medium text-gray-700 mb-2">
          Type <span className="font-bold text-red-600">"DELETE"</span> to confirm:
        </label>
        <input
          type="text"
          id="confirmText"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          placeholder="Type DELETE to confirm"
        />
        <p className="text-sm text-gray-500 mt-1">
          This confirmation is required to prevent accidental deletions.
        </p>
      </div>

      {/* Consequences List */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-yellow-800 mb-2">What will happen:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• The item will be permanently removed from {item.clinicId}'s inventory</li>
          <li>• All quantity data ({item.quantity} units) will be lost</li>
          <li>• Historical records for this item in this clinic will be deleted</li>
          <li>• This action cannot be reversed</li>
        </ul>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleDelete}
          disabled={loading || !isDeleteEnabled}
          className="flex-1 bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Delete Permanently
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
    </div>
    </div>
  );
}

export default DeleteClinicInventory;
import React, { useState } from "react";
import { ref, remove } from "firebase/database";
import { database } from "../../firebase/firebase";
import { X, Trash2, AlertTriangle } from "lucide-react";

function DeleteItemsSupply({ isOpen, item, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!item) return;

    try {
      setLoading(true);
      const itemRef = ref(database, `inventoryItems/${item.id}`);
      await remove(itemRef);
      
      if (onDeleted) {
        onDeleted();
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Delete Item</h2>
                <p className="text-red-100 text-sm">This action cannot be undone</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="hover:bg-white/20 p-2 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <Trash2 className="w-16 h-16 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Are you sure you want to delete this item?
              </h3>
              <p className="text-gray-600 mb-4">
                You are about to permanently delete:
              </p>
              
              <div className="bg-white border border-red-200 rounded-lg p-4 text-left">
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold text-gray-700">Item Name: </span>
                    <span className="text-gray-900">{item.itemName}</span>
                  </div>
                  {item.brand && (
                    <div>
                      <span className="font-semibold text-gray-700">Brand: </span>
                      <span className="text-gray-900">{item.brand}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-gray-700">Category: </span>
                    <span className="text-gray-900">{item.itemCategory}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Type: </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      item.itemGroup === 'Medicine' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.itemGroup}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-amber-800 text-sm font-medium">
                Warning: This will permanently remove the item from your inventory. 
                All associated data will be lost.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Item</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteItemsSupply;
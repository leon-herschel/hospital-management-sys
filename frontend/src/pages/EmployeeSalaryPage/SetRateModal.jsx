import React from 'react';
import { DollarSign, Settings, Loader } from 'lucide-react';

const SetRateModal = ({ 
  isOpen, 
  onClose, 
  employee, 
  newRate, 
  setNewRate, 
  onSave, 
  isSaving 
}) => {
  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white rounded-t-xl">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Set Hourly Rate
          </h3>
        </div>
        
        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee
            </label>
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">{employee.name}</p>
              <p className="text-sm text-gray-600 mt-1">
                {employee.role} • {employee.department}
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Hourly Rate (₱)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                placeholder="Enter hourly rate..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="50"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
              <span className="font-medium">Current rate:</span> ₱{employee.hourlyRate || 0}
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex gap-3 p-6 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!newRate || isSaving}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {isSaving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Update Rate'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetRateModal;
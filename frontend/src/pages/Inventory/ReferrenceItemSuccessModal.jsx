import React, { useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XMarkIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { CheckCircle, Plus, Edit, Trash2 } from 'lucide-react';

const ReferrenceItemSuccessModal = ({ 
  isOpen, 
  onClose, 
  operationType, // 'add', 'update', 'delete'
  itemName,
  itemType, // 'Medicine' or 'Supply'
  autoClose = true,
  autoCloseDelay = 3000 
}) => {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  const getOperationDetails = () => {
    switch (operationType) {
      case 'add':
        return {
          icon: <Plus className="w-8 h-8" />,
          heroIcon: <PlusCircleIcon className="w-8 h-8" />,
          title: `${itemType} Added Successfully!`,
          message: `"${itemName}" has been added to your inventory.`,
          bgColor: 'bg-green-100',
          textColor: 'text-green-600',
          borderColor: 'border-green-200'
        };
      case 'update':
        return {
          icon: <Edit className="w-8 h-8" />,
          heroIcon: <PencilSquareIcon className="w-8 h-8" />,
          title: `${itemType} Updated Successfully!`,
          message: `"${itemName}" has been updated in your inventory.`,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-600',
          borderColor: 'border-blue-200'
        };
      case 'delete':
        return {
          icon: <Trash2 className="w-8 h-8" />,
          heroIcon: <TrashIcon className="w-8 h-8" />,
          title: `${itemType} Deleted Successfully!`,
          message: `"${itemName}" has been removed from your inventory.`,
          bgColor: 'bg-red-100',
          textColor: 'text-red-600',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: <CheckCircle className="w-8 h-8" />,
          heroIcon: <CheckCircleIcon className="w-8 h-8" />,
          title: 'Operation Successful!',
          message: 'The operation has been completed successfully.',
          bgColor: 'bg-green-100',
          textColor: 'text-green-600',
          borderColor: 'border-green-200'
        };
    }
  };

  const operationDetails = getOperationDetails();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Success
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Success Icon */}
          <div className={`w-16 h-16 ${operationDetails.bgColor} ${operationDetails.borderColor} border-2 rounded-full flex items-center justify-center mx-auto mb-4`}>
            <div className={operationDetails.textColor}>
              {operationDetails.icon}
            </div>
          </div>

          {/* Success Message */}
          <h4 className="text-xl font-semibold text-gray-900 mb-2">
            {operationDetails.title}
          </h4>
          
          <p className="text-gray-600 mb-6">
            {operationDetails.message}
          </p>

          {/* Item Details */}
          <div className={`${operationDetails.bgColor} ${operationDetails.borderColor} border rounded-lg p-4 mb-6`}>
            <div className="flex items-center justify-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                itemType === 'Medicine' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {itemType}
              </span>
            </div>
            <p className="text-sm text-gray-700 mt-2 font-medium">
              {itemName}
            </p>
          </div>

          {/* Progress Bar (if auto-closing) */}
          {autoClose && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2">
                Auto-closing in {Math.ceil(autoCloseDelay / 1000)} seconds
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full ${
                    operationType === 'add' ? 'bg-green-500' :
                    operationType === 'update' ? 'bg-blue-500' : 'bg-red-500'
                  } transition-all duration-${autoCloseDelay} ease-linear`}
                  style={{
                    animation: `shrink ${autoCloseDelay}ms linear forwards`
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={onClose}
            className={`w-full py-3 px-4 text-white font-medium rounded-xl transition-colors ${
              operationType === 'add' ? 'bg-green-600 hover:bg-green-700' :
              operationType === 'update' ? 'bg-blue-600 hover:bg-blue-700' :
              operationType === 'delete' ? 'bg-red-600 hover:bg-red-700' :
              'bg-green-600 hover:bg-green-700'
            }`}
          >
            Continue
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default ReferrenceItemSuccessModal;
import React from 'react';
import { X, CheckCircle, CreditCard, Trash2, FileText } from 'lucide-react';

const BillingSuccessModal = ({ 
  isOpen, 
  onClose, 
  type, 
  patientName, 
  amount, 
  additionalInfo 
}) => {
  if (!isOpen) return null;

  const getModalConfig = () => {
    switch (type) {
      case 'bill_generated':
        return {
          icon: <FileText className="h-12 w-12 text-emerald-600" />,
          title: 'Bill Generated Successfully!',
          message: `A new bill has been generated for ${patientName}`,
          bgColor: 'from-emerald-50 to-green-50',
          borderColor: 'border-emerald-200',
          iconBg: 'bg-emerald-100',
          buttonColor: 'from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700'
        };
      case 'marked_paid':
        return {
          icon: <CreditCard className="h-12 w-12 text-blue-600" />,
          title: 'Payment Recorded Successfully!',
          message: `Bill for ${patientName} has been marked as paid`,
          bgColor: 'from-blue-50 to-indigo-50',
          borderColor: 'border-blue-200',
          iconBg: 'bg-blue-100',
          buttonColor: 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
        };
      case 'bill_deleted':
        return {
          icon: <Trash2 className="h-12 w-12 text-red-600" />,
          title: 'Bill Deleted Successfully!',
          message: `Bill for ${patientName} has been permanently deleted`,
          bgColor: 'from-red-50 to-pink-50',
          borderColor: 'border-red-200',
          iconBg: 'bg-red-100',
          buttonColor: 'from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700'
        };
      default:
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-600" />,
          title: 'Operation Successful!',
          message: 'The operation completed successfully',
          bgColor: 'from-green-50 to-emerald-50',
          borderColor: 'border-green-200',
          iconBg: 'bg-green-100',
          buttonColor: 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
        };
    }
  };

  const config = getModalConfig();

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className={`p-3 ${config.iconBg} rounded-full`}>
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Success</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-150"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className={`bg-gradient-to-r ${config.bgColor} border ${config.borderColor} rounded-xl p-6 mb-6`}>
            <div className="text-center">
              <div className={`${config.iconBg} rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4`}>
                {config.icon}
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {config.title}
              </h2>
              <p className="text-slate-700 mb-4">
                {config.message}
              </p>
              
              {/* Amount display if provided */}
              {amount && (
                <div className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-lg p-3 mb-4">
                  <div className="text-lg font-bold text-slate-900">
                    Amount: ₱{amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              )}

              {/* Additional info */}
              {additionalInfo && (
                <div className="text-sm text-slate-600 bg-white/40 rounded-lg p-3">
                  {additionalInfo}
                </div>
              )}
            </div>
          </div>

          {/* Anti-double billing note for paid bills */}
          {type === 'marked_paid' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-amber-800 mb-1">Anti-Double-Billing Protection</p>
                  <p className="text-amber-700">
                    All items in this bill are now marked as paid and will be automatically 
                    excluded from future bills for this patient.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className={`bg-gradient-to-r ${config.buttonColor} text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200`}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSuccessModal;
import React from 'react';
import {
  CheckCircleIcon,
  XMarkIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  IdentificationIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

const CertificateSuccessModal = ({ 
  isOpen, 
  onClose, 
  certificateData, 
  patientData, 
  doctorData, 
  certificateId,
  onDownloadPdf 
}) => {
  if (!isOpen) return null;

  const getCurrentDateTime = () => {
    return new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <div className="flex items-center space-x-3">
            <CheckCircleIcon className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-xl font-semibold text-white">Certificate Generated Successfully!</h3>
              <p className="text-green-100 text-sm">Medical certificate has been signed and saved</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-green-200 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Success Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <h4 className="font-semibold text-green-800">Certificate Successfully Created</h4>
                <p className="text-sm text-green-600">Digitally signed and saved to patient records</p>
              </div>
            </div>
            
            {/* Certificate ID */}
            <div className="bg-white rounded-lg p-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Certificate ID:</span>
                <span className="font-mono text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                  {certificateId}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-medium text-gray-700">Generated:</span>
                <span className="text-sm text-gray-600">{getCurrentDateTime()}</span>
              </div>
            </div>
          </div>

          {/* Certificate Details Summary */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 flex items-center">
              <ClipboardDocumentCheckIcon className="w-5 h-5 mr-2 text-blue-600" />
              Certificate Summary
            </h4>

            {/* Patient Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                <UserIcon className="w-4 h-4 mr-2 text-blue-600" />
                Patient Information
              </h5>
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium">Name:</span> {patientData?.name}</div>
                <div><span className="font-medium">ID:</span> {patientData?.patientId}</div>
                <div><span className="font-medium">Age:</span> {patientData?.age} years old</div>
                <div><span className="font-medium">Gender:</span> {patientData?.gender}</div>
              </div>
            </div>

            {/* Doctor Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                <IdentificationIcon className="w-4 h-4 mr-2 text-blue-600" />
                Attending Physician
              </h5>
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium">Doctor:</span> Dr. {doctorData?.fullName}</div>
                <div><span className="font-medium">License:</span> {doctorData?.prcId}</div>
                <div><span className="font-medium">Specialty:</span> {doctorData?.specialty || 'General Practice'}</div>
                <div><span className="font-medium">Department:</span> {doctorData?.department || 'General Medicine'}</div>
              </div>
            </div>

            {/* Medical Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                <DocumentTextIcon className="w-4 h-4 mr-2 text-blue-600" />
                Medical Details
              </h5>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Diagnosis:</span> {certificateData?.diagnosis}</div>
                {certificateData?.restDays && (
                  <div><span className="font-medium">Rest Period:</span> {certificateData.restDays} day(s)</div>
                )}
                {certificateData?.dateFrom && certificateData?.dateTo && (
                  <div>
                    <span className="font-medium">Period:</span> {' '}
                    {new Date(certificateData.dateFrom).toLocaleDateString()} - {' '}
                    {new Date(certificateData.dateTo).toLocaleDateString()}
                  </div>
                )}
                {certificateData?.followUpDate && (
                  <div>
                    <span className="font-medium">Follow-up:</span> {' '}
                    {new Date(certificateData.followUpDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Items */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-800 mb-3">What's Next?</h5>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex items-center">
                <CheckCircleIcon className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                <span>Certificate has been saved to patient's medical records</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                <span>Digital signature has been applied and verified</span>
              </div>
              <div className="flex items-center">
                <DocumentTextIcon className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                <span>Ready for PDF download and distribution</span>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-xs text-gray-500">Signed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">💾</div>
              <div className="text-xs text-gray-500">Saved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">🏥</div>
              <div className="text-xs text-gray-500">In Records</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onDownloadPdf}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <DocumentTextIcon className="w-4 h-4" />
              <span>Download PDF Certificate</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
          
          {/* Additional Actions */}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <button className="text-blue-600 hover:text-blue-800 underline">
              View Patient Records
            </button>
            <span className="text-gray-400">•</span>
            <button className="text-blue-600 hover:text-blue-800 underline">
              Generate Another Certificate
            </button>
            <span className="text-gray-400">•</span>
            <button className="text-blue-600 hover:text-blue-800 underline">
              Print Certificate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateSuccessModal;
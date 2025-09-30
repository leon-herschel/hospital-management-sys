import React from 'react';
import { X, Smartphone, Copy, CheckCircle, Clock, User, CreditCard, Shield, Calendar } from 'lucide-react';

const GcashTransactionDetailsModal = ({ isOpen, onClose, transaction }) => {
    if (!isOpen || !transaction || transaction.paymentMethod !== 'gcash') return null;

    // Helper function to copy text to clipboard
    const copyToClipboard = async (text, elementId) => {
        try {
            await navigator.clipboard.writeText(text);
            const button = document.getElementById(elementId);
            if (button) {
                const originalHTML = button.innerHTML;
                button.innerHTML = '<svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>Copied!';
                setTimeout(() => {
                    button.innerHTML = originalHTML;
                }, 2000);
            }
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const gcashDetails = transaction.gcashPaymentDetails || {};
    const formatCurrency = (amount) => new Intl.NumberFormat('en-PH', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
    }).format(amount || 0);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-blue-600 rounded-full">
                            <Smartphone className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">GCash Transaction Details</h2>
                            <p className="text-sm text-blue-700 font-medium">Verified Mobile Payment</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X size={24} className="text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Transaction Status Banner */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-center space-x-2">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            <span className="text-lg font-semibold text-green-800">Payment Verified & Complete</span>
                        </div>
                        <p className="text-center text-sm text-green-700 mt-1">
                            This GCash transaction has been successfully processed and verified
                        </p>
                    </div>

                    {/* Main Transaction Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Patient & Bill Information */}
                        <div className="bg-gray-50 p-5 rounded-xl">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-600" />
                                Bill Information
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Patient Name</label>
                                    <p className="text-gray-900 font-semibold">{transaction.patientFullName}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Bill ID</label>
                                    <p className="text-gray-900 font-mono">{transaction.id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Clinic</label>
                                    <p className="text-gray-900">{transaction.clinicName || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Bill Amount</label>
                                    <p className="text-2xl font-bold text-blue-600">₱{formatCurrency(transaction.amount)}</p>
                                </div>
                            </div>
                        </div>

                        {/* GCash Payment Information */}
                        <div className="bg-blue-50 p-5 rounded-xl">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-blue-600" />
                                GCash Details
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Amount Paid</label>
                                    <p className="text-2xl font-bold text-green-600">
                                        ₱{formatCurrency(transaction.gcashPaidAmount || transaction.amount)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Payment Status</label>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <div className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-200">
                                            <CheckCircle className="w-4 h-4 mr-1" />
                                            Verified
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* GCash Reference Number */}
                    <div className="bg-white border border-blue-200 rounded-xl p-6 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-blue-600" />
                                Reference Number
                            </h3>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="font-mono text-xl font-bold text-blue-900 tracking-wider">
                                    {transaction.gcashReference || 'N/A'}
                                </div>
                                {transaction.gcashReference && (
                                    <button
                                        id="copy-reference-btn"
                                        onClick={() => copyToClipboard(transaction.gcashReference, 'copy-reference-btn')}
                                        className="flex items-center px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                                    >
                                        <Copy className="h-4 w-4 mr-1" />
                                        Copy
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-blue-700 mt-2">
                                Use this reference number to verify the transaction in your GCash app
                            </p>
                        </div>
                    </div>

                    {/* Merchant & Transaction Details */}
                    {gcashDetails && Object.keys(gcashDetails).length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-green-600" />
                                Transaction Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    {gcashDetails.merchantNumber && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Merchant Number</label>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="font-mono text-gray-900 font-semibold">{gcashDetails.merchantNumber}</p>
                                                <button
                                                    id="copy-merchant-btn"
                                                    onClick={() => copyToClipboard(gcashDetails.merchantNumber, 'copy-merchant-btn')}
                                                    className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {gcashDetails.merchantName && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Merchant Name</label>
                                            <p className="text-gray-900 font-semibold">{gcashDetails.merchantName}</p>
                                        </div>
                                    )}
                                    {gcashDetails.sessionId && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Session ID</label>
                                            <p className="font-mono text-sm text-gray-700 break-all">{gcashDetails.sessionId}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Transaction Date</label>
                                        <p className="text-gray-900">{formatDate(transaction.transactionDate)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Payment Date</label>
                                        <p className="text-gray-900">{formatDate(transaction.paidDate)}</p>
                                    </div>
                                    {gcashDetails.verifiedAt && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Verified Date</label>
                                            <p className="text-gray-900">{formatDate(gcashDetails.verifiedAt)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Information */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <Shield className="h-6 w-6 text-green-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Security & Verification</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="text-sm text-green-800 font-medium">Payment Verified</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="text-sm text-green-800 font-medium">Secured by GCash</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="text-sm text-green-800 font-medium">Transaction Complete</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="text-sm text-green-800 font-medium">Receipt Generated</span>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-green-100 rounded-lg">
                            <p className="text-sm text-green-800">
                                <strong>Security Note:</strong> This transaction has been verified through GCash's secure payment system. 
                                All payment details are encrypted and processed safely.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>
                                Generated on {new Date().toLocaleDateString('en-PH', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                Close
                            </button>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                Print Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GcashTransactionDetailsModal;
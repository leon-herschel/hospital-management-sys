import React from 'react';
import { X, Calendar, User, MapPin, Phone, Mail, CreditCard } from 'lucide-react';

const PaidBillingModal = ({ isOpen, onClose, billing }) => {
    if (!isOpen || !billing) return null;

    // Use actual billedItems from the billing data
    const billedItems = billing.billedItems || [];

    // Helper function to format item type display
    const formatItemType = (itemType) => {
        const typeMap = {
            'medicine': 'Medicine/Supply',
            'service': 'Medical Service',
            'consultation': 'Consultation'
        };
        return typeMap[itemType] || itemType;
    };

    // Helper function to get type styling
    const getTypeStyle = (itemType) => {
        const styleMap = {
            'medicine': 'bg-blue-100 text-blue-800 border-blue-200',
            'service': 'bg-green-100 text-green-800 border-green-200',
            'consultation': 'bg-purple-100 text-purple-800 border-purple-200'
        };
        return styleMap[itemType] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    // Calculate subtotal from actual billed items
    const subtotal = billedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
                        <p className="text-gray-600 mt-1">Transaction ID: {billing.id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X size={24} className="text-gray-600" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div className="p-6">
                        {/* Patient & Transaction Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* Patient Information */}
                            <div className="bg-gray-50 p-5 rounded-lg">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-600" />
                                    Patient Information
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Full Name</label>
                                        <p className="text-gray-900 font-semibold">{billing.patientFullName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Patient ID</label>
                                        <p className="text-gray-900">{billing.patientId || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Contact</label>
                                        <p className="text-gray-900">{billing.patientContact || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Email</label>
                                        <p className="text-gray-900">{billing.patientEmail || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction Information */}
                            <div className="bg-gray-50 p-5 rounded-lg">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-green-600" />
                                    Transaction Details
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Status</label>
                                        <span className="block px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 font-semibold border border-green-200 w-fit">
                                            {billing.status}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Transaction Date</label>
                                        <p className="text-gray-900">
                                            {billing.transactionDate ? 
                                                new Date(billing.transactionDate).toLocaleDateString('en-PH', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : 'N/A'
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Paid Date</label>
                                        <p className="text-gray-900">
                                            {billing.paidDate ? 
                                                new Date(billing.paidDate).toLocaleDateString('en-PH', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : 'N/A'
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Clinic</label>
                                        <p className="text-gray-900 font-semibold">{billing.clinicName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Processed By</label>
                                        <p className="text-gray-900">
                                            {billing.processedBy ? 
                                                `${billing.processedBy.firstName} ${billing.processedBy.lastName}` : 
                                                'System Generated'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Services/Items Table */}
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Services & Items</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {billedItems.length} item{billedItems.length !== 1 ? 's' : ''} billed
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                {billedItems.length > 0 ? (
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Service/Item
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Type
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Details
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Quantity
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Unit Price
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Total
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {billedItems.map((item, index) => (
                                                <tr key={`${item.itemId}-${index}`} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                                                        {item.timestamp && (
                                                            <div className="text-xs text-gray-500">
                                                                Used: {new Date(item.timestamp).toLocaleDateString('en-PH')}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeStyle(item.itemType)}`}>
                                                            {formatItemType(item.itemType)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        {item.itemType === 'consultation' && item.consultationType && (
                                                            <div>
                                                                <div className="font-medium">{item.consultationType}</div>
                                                                {item.requestedBy && (
                                                                    <div className="text-xs text-gray-500">by {item.requestedBy}</div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {item.itemType === 'medicine' && (
                                                            <div className="text-xs text-gray-500">
                                                                Medicine/Supply Item
                                                            </div>
                                                        )}
                                                        {item.itemType === 'service' && (
                                                            <div className="text-xs text-gray-500">
                                                                Medical Service
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                        {item.quantity || 1}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                        ₱{new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(item.pricePerUnit || item.unitPrice || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                                                        ₱{new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(item.totalPrice || 0)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="px-6 py-8 text-center">
                                        <div className="text-gray-500">
                                            <div className="text-4xl mb-2">📋</div>
                                            <p>No items found for this billing</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Payment Summary</h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal ({billedItems.length} item{billedItems.length !== 1 ? 's' : ''}):</span>
                                    <span className="text-gray-900">₱{new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(subtotal)}</span>
                                </div>
                                {billing.discount && billing.discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Discount:</span>
                                        <span className="text-red-600">-₱{new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(billing.discount)}</span>
                                    </div>
                                )}
                                {billing.tax && billing.tax > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Tax:</span>
                                        <span className="text-gray-900">₱{new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(billing.tax)}</span>
                                    </div>
                                )}
                                <div className="border-t border-green-300 pt-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                                        <span className="text-2xl font-bold text-green-600">
                                            ₱{new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(billing.amount || 0)}
                                        </span>
                                    </div>
                                </div>
                                {/* Show calculation verification if there's a discrepancy */}
                                {Math.abs(subtotal - (billing.amount || 0)) > 0.01 && (
                                    <div className="text-xs text-gray-500 mt-2">
                                        Note: Total may include adjustments, discounts, or taxes not itemized above.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Method & Notes */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Method</h4>
                                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                                    {billing.paymentMethod || 'Cash'}
                                </p>
                            </div>
                            {billing.notes && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                                        {billing.notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Additional Information */}
                        {billing.createdAt && (
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2 text-sm text-blue-800">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                        Bill created: {new Date(billing.createdAt).toLocaleDateString('en-PH', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            Close
                        </button>
                        <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            Print Receipt
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaidBillingModal;
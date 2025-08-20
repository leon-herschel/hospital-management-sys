import React from 'react';
import { X, Calendar, User, MapPin, Phone, Mail, CreditCard } from 'lucide-react';

const PaidBillingModal = ({ isOpen, onClose, billing }) => {
    if (!isOpen || !billing) return null;

    // Mock services/items data - replace with actual data structure from your Firebase
    const services = billing.services || billing.items || [
        { id: 1, name: 'General Consultation', price: 500.00, quantity: 1 },
        { id: 2, name: 'Blood Test', price: 800.00, quantity: 1 },
        { id: 3, name: 'X-Ray', price: 1200.00, quantity: 1 }
    ];

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
                                </div>
                            </div>
                        </div>

                        {/* Services/Items Table */}
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Services & Items</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Service/Item
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Quantity
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Unit Price
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {services.map((service, index) => (
                                            <tr key={service.id || index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{service.name}</div>
                                                    {service.description && (
                                                        <div className="text-sm text-gray-500">{service.description}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {service.quantity || 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    ₱{new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(service.price || 0)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                    ₱{new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format((service.price || 0) * (service.quantity || 1))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Payment Summary</h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="text-gray-900">₱{new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(billing.subtotal || billing.amount || 0)}</span>
                                </div>
                                {billing.discount && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Discount:</span>
                                        <span className="text-red-600">-₱{new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(billing.discount)}</span>
                                    </div>
                                )}
                                {billing.tax && (
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
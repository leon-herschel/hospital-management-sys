import { useState, useEffect, useMemo } from 'react';
import { database } from '../../firebase/firebase';
import { ref, query, orderByChild, equalTo, onValue } from "firebase/database";
import { ChevronLeft, ChevronRight, Download, Search, TrendingUp, DollarSign, FileText, Users, Eye } from 'lucide-react';
import DateRangePicker from '../../components/DateRangePicker/DateRangePicker';
import PaidBillingModal from './PaidBillingModal'; // Import the modal

const PaidSection = () => {
    const [billingList, setBillingList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [sortField, setSortField] = useState('paidDate');
    const [sortDirection, setSortDirection] = useState('desc');
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBilling, setSelectedBilling] = useState(null);

    // Clinic info - should match your main billing component
    // const CLINIC_ID = 'your-clinic-id';

    // Your original Firebase fetch logic - unchanged
    useEffect(() => {
        const billingRef = query(
            ref(database, "clinicBilling"), 
            orderByChild('status'), 
            equalTo('paid')
        );

        const unsubscribeBillingRef = onValue(billingRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const billingData = Object.keys(data).map((key) => {
                    const billing = data[key];
                    // Filter by clinic if needed
                    // if (billing.clinicId === CLINIC_ID) {
                        return {
                            ...billing,
                            id: key,
                        };
                    // }
                    // return null;
                }).filter(Boolean); // Remove null entries
                
                setBillingList(billingData);
            } else {
                setBillingList([]);
            }
        });

        return () => unsubscribeBillingRef();
    }, []);

    // Enhanced filtering with sorting
    const filteredBillings = useMemo(() => {
        let filtered = billingList.filter((billing) => {
            // Use transactionDate or paidDate for filtering
            const billingDate = new Date(billing.paidDate || billing.transactionDate);

            // Filter by date range
            const withinDateRange =
                (!startDate || billingDate >= startDate) &&
                (!endDate || billingDate <= endDate);

            // Filter by search term (use patientFullName instead of patientName)
            const matchesSearchTerm = billing.patientFullName?.toLowerCase().includes(searchTerm.toLowerCase());

            return withinDateRange && matchesSearchTerm;
        });

        // Add sorting
        filtered.sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];
            
            if (sortField === 'amount') {
                aVal = parseFloat(aVal) || 0;
                bVal = parseFloat(bVal) || 0;
            } else if (sortField === 'paidDate' || sortField === 'transactionDate') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            } else {
                aVal = String(aVal || '').toLowerCase();
                bVal = String(bVal || '').toLowerCase();
            }

            if (sortDirection === 'asc') {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            } else {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
            }
        });

        return filtered;
    }, [billingList, searchTerm, startDate, endDate, sortField, sortDirection]);

    // Calculate total paid amount - your original logic
    const totalPaidAmount = filteredBillings.reduce((total, billing) => total + (billing.amount || 0), 0);

    // Pagination
    const totalPages = Math.ceil(filteredBillings.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedBillings = filteredBillings.slice(startIndex, startIndex + itemsPerPage);

    // Sort handler
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
        setCurrentPage(1);
    };

    // Modal handlers
    const handleViewDetails = (billing) => {
        setSelectedBilling(billing);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedBilling(null);
    };

    // Export functionality
    const handleExport = () => {
        const csvContent = [
            ['Patient Name', 'Amount', 'Status', 'Transaction Date', 'Paid Date', 'Clinic'].join(','),
            ...filteredBillings.map(billing => [
                `"${billing.patientFullName || ''}"`,
                billing.amount || 0,
                billing.status || '',
                billing.transactionDate ? new Date(billing.transactionDate).toLocaleDateString() : '',
                billing.paidDate ? new Date(billing.paidDate).toLocaleDateString() : '',
                `"${billing.clinicName || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `paid-billings-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Reset current page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, startDate, endDate]);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Enhanced Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">Paid Billings</h1>
                        <p className="text-gray-600 mt-1">Manage and analyze your clinic's revenue stream</p>
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                        disabled={filteredBillings.length === 0}
                    >
                        <Download size={20} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Enhanced Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                            <p className="text-2xl font-bold text-green-600">
                                ₱{new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(totalPaidAmount)}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Transactions</p>
                            <p className="text-2xl font-bold text-blue-600">{filteredBillings.length}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Average Amount</p>
                            <p className="text-2xl font-bold text-purple-600">
                                ₱{filteredBillings.length > 0 ? 
                                    new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(totalPaidAmount / filteredBillings.length) : 
                                    '0.00'
                                }
                            </p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                            <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">This Month</p>
                            <p className="text-2xl font-bold text-orange-600">
                                {filteredBillings.filter(b => {
                                    const billDate = new Date(b.paidDate || b.transactionDate);
                                    const thisMonth = new Date();
                                    return billDate.getMonth() === thisMonth.getMonth() && 
                                           billDate.getFullYear() === thisMonth.getFullYear();
                                }).length}
                            </p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-full">
                            <Users className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Search and Filter Controls - Improved layout */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                <div className="space-y-4">
                    {/* First row: Search and Items per page */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Enhanced Search Input - spans 2 columns on large screens */}
                        <div className="relative lg:col-span-2">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by patient name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                            />
                        </div>

                        {/* Items per page */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Per Page</label>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>

                    {/* Second row: Date Range Picker - Full width */}
                    <div className="w-full">
                        <DateRangePicker
                            startDate={startDate}
                            endDate={endDate}
                            onStartDateChange={setStartDate}
                            onEndDateChange={setEndDate}
                        />
                    </div>
                </div>
            </div>

            {/* Enhanced Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-green-50 to-green-100">
                            <tr>
                                {[
                                    { key: 'patientFullName', label: 'Patient Name' },
                                    { key: 'amount', label: 'Amount' },
                                    { key: 'status', label: 'Status' },
                                    { key: 'transactionDate', label: 'Transaction Date' },
                                    { key: 'paidDate', label: 'Paid Date' },
                                    { key: 'clinicName', label: 'Clinic' }
                                ].map(({ key, label }) => (
                                    <th
                                        key={key}
                                        onClick={() => handleSort(key)}
                                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-green-200 select-none transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            {label}
                                            {sortField === key && (
                                                <span className="text-green-600 font-bold">
                                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {paginatedBillings.length > 0 ? (
                                paginatedBillings.map((billing, index) => (
                                    <tr
                                        key={billing.id}
                                        className={`hover:bg-gray-50 transition-colors ${
                                            index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                                        }`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-gray-900">{billing.patientFullName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-xl font-bold text-green-600">
                                                ₱{new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(billing.amount)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-4 py-2 rounded-full text-sm bg-green-100 text-green-800 font-semibold border border-green-200">
                                                {billing.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {billing.transactionDate ? 
                                                new Date(billing.transactionDate).toLocaleDateString('en-PH', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : 'N/A'
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {billing.paidDate ? 
                                                new Date(billing.paidDate).toLocaleDateString('en-PH', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : 'N/A'
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {billing.clinicName || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button 
                                                onClick={() => handleViewDetails(billing)}
                                                className="text-green-600 hover:text-green-800 transition-colors p-2 rounded-full hover:bg-green-50"
                                                title="View payment details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="text-6xl mb-4 opacity-50">💰</div>
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Paid Billings Found</h3>
                                            <p className="text-gray-500">Try adjusting your search or date range</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Enhanced Pagination */}
                {filteredBillings.length > 0 && totalPages > 1 && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-semibold">{startIndex + 1}</span> to{' '}
                                <span className="font-semibold">{Math.min(startIndex + itemsPerPage, filteredBillings.length)}</span> of{' '}
                                <span className="font-semibold">{filteredBillings.length}</span> results
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                {/* Page numbers */}
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                                                currentPage === page
                                                    ? 'bg-green-600 text-white border-green-600 shadow-sm'
                                                    : 'text-gray-700 border-gray-300 hover:bg-gray-100'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Enhanced Results Summary */}
            {filteredBillings.length > 0 && (
                <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200 text-center">
                    <div className="text-sm text-gray-600">
                        {searchTerm && (
                            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                                Search: "{searchTerm}"
                            </span>
                        )}
                        {(startDate || endDate) && (
                            <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded mr-2">
                                Period: {startDate ? startDate.toLocaleDateString() : 'All time'} 
                                {' '} to {endDate ? endDate.toLocaleDateString() : 'Now'}
                            </span>
                        )}
                        <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">
                            Total Revenue: ₱{new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(totalPaidAmount)}
                        </span>
                    </div>
                </div>
            )}

            {/* Modal Component */}
            <PaidBillingModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                billing={selectedBilling}
            />
        </div>
    );
};

export default PaidSection;
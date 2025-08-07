import { useState, useEffect } from 'react';
import { database } from '../../firebase/firebase';
import { ref, query, orderByChild, equalTo, onValue } from "firebase/database";
import DateRangePicker from '../../components/DateRangePicker/DateRangePicker';

const PaidSection = () => {
    const [billingList, setBillingList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    // Clinic info - should match your main billing component
    const CLINIC_ID = "clin_cebu_doctors_id";

    // Fetch paid billing records from clinicBilling node
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
                    if (billing.clinicId === CLINIC_ID) {
                        return {
                            ...billing,
                            id: key,
                        };
                    }
                    return null;
                }).filter(Boolean); // Remove null entries
                
                setBillingList(billingData);
            } else {
                setBillingList([]);
            }
        });

        return () => unsubscribeBillingRef();
    }, []);

    // Filter billings based on search term and date range
    const filteredBillings = billingList.filter((billing) => {
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

    // Calculate total paid amount
    const totalPaidAmount = filteredBillings.reduce((total, billing) => total + (billing.amount || 0), 0);

    return (
        <div>
            <div className="flex justify-center">
                <h1 className="text-3xl font-bold mb-4">Paid Billings</h1>
            </div>

            {/* Summary Card */}
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-green-800">Total Paid Bills</h3>
                        <p className="text-sm text-green-600">{filteredBillings.length} transactions</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-green-800">
                            ₱{new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(totalPaidAmount)}
                        </p>
                        <p className="text-sm text-green-600">Total Revenue</p>
                    </div>
                </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                {/* Date Range Picker */}
                <div className="flex-1">
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onStartDateChange={setStartDate}
                        onEndDateChange={setEndDate}
                    />
                </div>

                {/* Search Input */}
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search by patient name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border px-4 py-2 rounded-lg w-full"
                    />
                </div>
            </div>

            {/* Billing List Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300 bg-white">
                    <thead>
                        <tr className="bg-green-100">
                            <th className="border-b px-4 py-2 text-left">Patient Name</th>
                            <th className="border-b px-4 py-2 text-left">Amount</th>
                            <th className="border-b px-4 py-2 text-left">Status</th>
                            <th className="border-b px-4 py-2 text-left">Transaction Date</th>
                            <th className="border-b px-4 py-2 text-left">Paid Date</th>
                            <th className="border-b px-4 py-2 text-left">Clinic</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBillings.length > 0 ? (
                            filteredBillings.map(billing => (
                                <tr key={billing.id} className="hover:bg-gray-50">
                                    <td className="border-b px-4 py-2 font-medium">
                                        {billing.patientFullName}
                                    </td>
                                    <td className="border-b px-4 py-2 font-semibold text-green-600">
                                        ₱{new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(billing.amount)}
                                    </td>
                                    <td className="border-b px-4 py-2">
                                        <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">
                                            {billing.status}
                                        </span>
                                    </td>
                                    <td className="border-b px-4 py-2 text-sm">
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
                                    <td className="border-b px-4 py-2 text-sm">
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
                                    <td className="border-b px-4 py-2 text-sm text-gray-600">
                                        {billing.clinicName || 'N/A'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="border-b px-4 py-8 text-center text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <div className="text-4xl mb-2">💰</div>
                                        <p className="text-lg font-medium">No Paid Billings Found</p>
                                        <p className="text-sm">Try adjusting your search or date range</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Results Summary */}
            {filteredBillings.length > 0 && (
                <div className="mt-4 text-sm text-gray-600 text-center">
                    Showing {filteredBillings.length} paid billing(s) 
                    {(startDate || endDate) && (
                        <span>
                            {' '}from {startDate ? startDate.toLocaleDateString() : 'beginning'} 
                            {' '}to {endDate ? endDate.toLocaleDateString() : 'now'}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default PaidSection;
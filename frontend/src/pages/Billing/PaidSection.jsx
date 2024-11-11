import { useState, useEffect } from 'react';
import { database } from '../../firebase/firebase';
import { ref, query, orderByChild, equalTo, onValue } from "firebase/database";
import DateRangePicker from '../../components/DateRangePicker/DateRangePicker'; // Import DateRangePicker

const PaidSection = () => {
    const [billingList, setBillingList] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); // State for search term
    const [startDate, setStartDate] = useState(null); // State for start date
    const [endDate, setEndDate] = useState(null);     // State for end date

    // Fetch paid billing records from Firebase
    useEffect(() => {
        const billingRef = query(ref(database, "billing"), orderByChild('status'), equalTo('paid'));

        const unsubscribeBillingRef = onValue(billingRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const billingData = Object.keys(data).map((key) => ({
                    ...data[key],
                    id: key,
                }));
                setBillingList(billingData);
            } else {
                setBillingList([]);
            }
        });

        return () => unsubscribeBillingRef();
    }, []);

    // Filter billings based on search term and date range
    const filteredBillings = billingList.filter((billing) => {
        const billingDate = new Date(billing.timestamp); // Assuming there's a timestamp field

        // Filter by date range
        const withinDateRange =
            (!startDate || billingDate >= startDate) &&
            (!endDate || billingDate <= endDate);

        // Filter by search term
        const matchesSearchTerm = billing.patientName?.toLowerCase().includes(searchTerm.toLowerCase());

        return withinDateRange && matchesSearchTerm;
    });

    return (
        <div>
            <div className="flex justify-center">
                <h1 className="text-3xl font-bold mb-4">Billing Paid Section</h1>
            </div>

            {/* Date Range Picker */}
            <div className="mb-4">
                <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                />
            </div>

            {/* Search Input */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by patient name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border px-4 py-2 rounded-lg w-full max-w-xs"
                />
            </div>

            {/* Billing List Table */}
            <table className="min-w-full border-collapse border border-gray-300 bg-white">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border-b px-4 py-2 text-left">Patient</th>
                        <th className="border-b px-4 py-2 text-left">Amount</th>
                        <th className="border-b px-4 py-2 text-left">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredBillings.length > 0 ? (
                        filteredBillings.map(billing => (
                            <tr key={billing.id} className="hover:bg-gray-100">
                                <td className="border-b px-4 py-2">{billing.patientName}</td>
                                <td className="border-b px-4 py-2">₱ {new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(billing.amount)}</td>
                                <td className="border-b px-4 py-2">{billing.status}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3" className="border-b px-4 py-2 text-center">No Billings Found</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default PaidSection;

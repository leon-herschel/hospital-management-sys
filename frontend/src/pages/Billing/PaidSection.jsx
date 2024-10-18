import { useState, useEffect } from 'react';
import { database } from '../../firebase/firebase';
import { ref, query, orderByChild, equalTo, onValue } from "firebase/database";

const PaidSection = () => {
    const [billingList, setBillingList] = useState([]);

    useEffect(() => {
        // Use Firebase query to filter the records before fetching
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

    return (
        <div>
            <div className="flex justify-center">
                <h1 className="text-3xl font-bold mb-4">Billing Paid Section</h1>
            </div>
            <table className="min-w-full border-collapse border border-gray-300 bg-white">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border-b px-4 py-2 text-left">Paid</th>
                        <th className="border-b px-4 py-2 text-left">Amount</th>
                        <th className="border-b px-4 py-2 text-left">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {billingList.length > 0 ? (
                        billingList.map(billing => (
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

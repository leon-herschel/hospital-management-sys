import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";
import { getAuth } from "firebase/auth";

const PharmacyTransferHistory = () => {
    const [transferList, setTransferList] = useState([]);
    const [department, setDepartment] = useState("");

    const auth = getAuth();
    const user = auth.currentUser;

    // Fetch user's department
    useEffect(() => {
        if (user) {
            const departmentRef = ref(database, `users/${user.uid}/department`);

            onValue(departmentRef, (snapshot) => {
                const departmentData = snapshot.val();
                if (departmentData) {
                    setDepartment(departmentData);
                }
            });
        }
    }, [user]);

    // Fetch transfer history based on user's department
    useEffect(() => {
        if (department) {
            const PharmacyHistoryRef = ref(database, "medicineTransferHistory");

            const unsubscribePharmacyHistory = onValue(PharmacyHistoryRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const PharmacyData = Object.keys(data)
                        .map((key) => ({
                            ...data[key],
                            id: key,
                        }))
                        .filter((medicine) => medicine.recipientDepartment === department);

                    setTransferList(PharmacyData);
                }
            });

            return () => unsubscribePharmacyHistory();
        }
    }, [department]);

    return (
        <div className="relative overflow-x-auto rounded-md shadow-sm">
            <table className="w-full text-md text-gray-900 text-center border border-slate-200">
                <thead className="text-md bg-slate-200">
                    <tr>
                        <th className="px-6 py-3">Medicine Name</th>
                        <th className="px-6 py-3">Quantity</th>
                        <th className="px-6 py-3">Sender</th>
                        <th className="px-6 py-3">Timestamp</th>
                        <th className="px-6 py-3">Recipient Department</th>
                        <th className="px-6 py-3">Reason</th>
                    </tr>
                </thead>
                <tbody>
                    {transferList.length > 0 ? (
                        transferList.map((pharmacy) => (
                            <tr key={pharmacy.id}>
                                <td className="px-6 py-3">{pharmacy.itemName}</td>
                                <td className="px-6 py-3">{pharmacy.quantity}</td>
                                <td className="px-6 py-3">{pharmacy.sender}</td>
                                <td className="px-6 py-3">{pharmacy.timestamp}</td>
                                <td className="px-6 py-3">{pharmacy.recipientDepartment}</td>
                                <td className="px-6 py-3">{pharmacy.reason}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="px-6 py-3">
                                No {department} Transfer History found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default PharmacyTransferHistory;

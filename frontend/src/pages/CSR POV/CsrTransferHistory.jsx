import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";
import { getAuth } from "firebase/auth";
import AccessDenied from "../ErrorPages/AccessDenied";

const CsrTransferHistory = () => {
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
            const CsrHistoryRef = ref(database, "supplyHistoryTransfer");

            const unsubscribeCsrHistory = onValue(CsrHistoryRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const CsrData = Object.keys(data).map((key) => ({
                        ...data[key],
                        id: key,
                    }));

                    // If the user's department is not CSR, filter by recipientDepartment
                    if (department !== "CSR") {
                        const filteredData = CsrData.filter(
                            (supply) => supply.recipientDepartment === department
                        );
                        setTransferList(filteredData);
                    } else {
                        // If the department is CSR, show all data without filtering
                        setTransferList(CsrData);
                    }
                }
            });

            return () => unsubscribeCsrHistory();
        }
    }, [department]);

    if (department !== "CSR" && department !== "Admin") {
        return <AccessDenied />;
    }

    return (
        <div className="relative overflow-x-auto rounded-md shadow-sm">
            <table className="w-full text-md text-gray-900 text-center border border-slate-200">
                <thead className="text-md bg-slate-200">
                    <tr>
                        <th className="px-6 py-3">Supply Name</th>
                        <th className="px-6 py-3">Quantity</th>
                        <th className="px-6 py-3">Sender</th>
                        <th className="px-6 py-3">Timestamp</th>
                        <th className="px-6 py-3">Department Receiver</th>
                        <th className="px-6 py-3">Reason</th>
                    </tr>
                </thead>
                <tbody>
                    {transferList.length > 0 ? (
                        transferList.map((csr) => (
                            <tr key={csr.id}>
                                <td className="px-6 py-3">{csr.itemName}</td>
                                <td className="px-6 py-3">{csr.quantity}</td>
                                <td className="px-6 py-3">{csr.sender}</td>
                                <td className="px-6 py-3">{csr.timestamp}</td>
                                <td className="px-6 py-3">{csr.recipientDepartment}</td>
                                <td className="px-6 py-3">{csr.reason}</td>
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
};

export default CsrTransferHistory;

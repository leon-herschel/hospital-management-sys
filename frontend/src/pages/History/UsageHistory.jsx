import {useState, useEffect} from "react";
import {ref, onValue} from "firebase/database";
import { database } from "../../firebase/firebase";
import {getAuth} from "firebase/auth";

const UsageHistory = () => {

    const [usageList, setUsageList] = useState([]);
    const [department, setDepartment]= useState("");

    const auth = getAuth();
    const user = auth.currentUser;

    // Fetch user's dept
    useEffect(() => {
        if (user) {
            const departmentRef = ref(database, `users/${user.uid}/department`)

            onValue(departmentRef, (snapshot) => {
                const departmentData = snapshot.val();
                if (departmentData) {
                    setDepartment(departmentData)
                }
            })
        }
    }, [user]);

    useEffect(() => {
        if (department) {
            const usageHistoryRef = ref(database, `departments/${department}/usageHistory`)

            const unsubscribeUsageHistory = onValue(usageHistoryRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const usageData = Object.keys(data).map((key) => ({
                        ...data[key],
                        id:key,
                    }))
                    setUsageList(usageData)
                } else {
                    setUsageList([]);
                }
            })
            return () => unsubscribeUsageHistory();
        }
    }, [department]);

    return (
        <div className="relative overflow-x-auto rounded-md shadow-sm">
            <table className="w-full text-md text-gray-900 text-center border border-slate-200">
                <thead className="text-md bg-slate-200">
                    <tr>
                        <th className="px-6 py-3">Item Name</th>
                        <th className="px-6 py-3">Patient's First Name</th>
                        <th className="px-6 py-3">Patient's Last Name</th>
                        <th className="px-6 py-3">Quantity</th>
                        <th className="px-6 py-3">Timestamp</th>
                        <th className="px-6 py-3">Type</th>
                    </tr>
                </thead>
                <tbody>
                    {usageList.length > 0 ? (
                        usageList.map((usage) => (
                            <tr key={usage.id}>
                                 <td className="px-6 py-3">{usage.itemName}</td>
                                 <td className="px-6 py-3">{usage.firstName}</td>
                                 <td className="px-6 py-3">{usage.lastName}</td>
                                 <td className="px-6 py-3">{usage.quantity}</td>
                                 <td className="px-6 py-3">{usage.timestamp}</td>
                                 <td className="px-6 py-3">{usage.type}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td  colSpan="6" className="px-6 py-3">
                                No {department} Usage History found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default UsageHistory;

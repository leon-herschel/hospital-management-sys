import { useState, useEffect } from "react";
import { ShoppingCartIcon, CreditCardIcon, UserIcon, UsersIcon, ArrowRightIcon, UserPlusIcon } from '@heroicons/react/16/solid';
import { ref, get } from "firebase/database";
import { database } from "../../firebase/firebase";
import { calculateStatus } from "../Inventory/CalculateStatusLogic";
import { getAuth } from "firebase/auth";
import { Link } from 'react-router-dom';  // Import Link

const Dashboard = () => {
    const [lowStockCount, setLowStockCount] = useState(0);
    const [userRole, setUserRole] = useState(""); 
    const [newPatientCount, setNewPatientsCount] = useState(0);
    const [pendingRequestCount, setPendingRequestsCount] = useState(0);

    useEffect(() => {
        const fetchUserRole = async () => {
            const auth = getAuth();
            const user = auth.currentUser;
            if (user) {
                const userRef = ref(database, `users/${user.uid}`);
                const snapshot = await get(userRef);
                const userData = snapshot.val();
                setUserRole(userData.department);
            }
        };

        const fetchNewPatientsToday = async () => {
            try {
                const patientsRef = ref(database, "patient");
                const snapshot = await get(patientsRef);
                const patientsData = snapshot.val();

                if (patientsData) {
                    let patientsTodayCount = 0;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // Set to midnight for accurate comparison

                    Object.entries(patientsData).forEach(([key, patient]) => {
                        const patientTimestamp = patient.dateTime;  // Assuming this is in milliseconds
                        const patientDate = new Date(patientTimestamp);
                        patientDate.setHours(0, 0, 0, 0); // Set time to midnight to compare just the date

                        // Compare patient date with today's date
                        if (patientDate.getTime() === today.getTime()) {
                            // Check if user role matches or is admin
                            if (userRole === "Admin" || userRole === patient.roomType) {
                                patientsTodayCount++;
                            }
                        }
                    });

                    setNewPatientsCount(patientsTodayCount);  // Update the state with today's patient count
                }
            } catch (error) {
                console.error("Error fetching patients data:", error);
            }
        };

        const fetchLowStockItems = async () => {
            try {
                let lowStockItems = 0;

                if (userRole === "CSR" || userRole === "Admin") {
                    const departmentsRef = ref(database, "departments");
                    const snapshot = await get(departmentsRef);
                    const departmentsData = snapshot.val();

                    if (departmentsData) {
                        for (const department of Object.keys(departmentsData)) {
                            const localSuppliesRef = ref(database, `departments/${department}/localSupplies`);
                            const suppliesSnapshot = await get(localSuppliesRef);
                            const localSuppliesData = suppliesSnapshot.val();

                            if (localSuppliesData) {
                                Object.entries(localSuppliesData).forEach(([key, value]) => {
                                    const quantity = value.quantity || 0;
                                    const maxQuantity = value.maxQuantity || quantity;
                                    const status = calculateStatus(quantity, maxQuantity);

                                    if (status === "Low Stock" || status === "Very Low") {
                                        lowStockItems += 1;
                                    }
                                });
                            }
                        }
                    }
                }

                if (userRole === "Pharmacy" || userRole === "Admin") {
                    const departmentsRef = ref(database, "departments");
                    const snapshot = await get(departmentsRef);
                    const departmentsData = snapshot.val();

                    if (departmentsData) {
                        for (const department of Object.keys(departmentsData)) {
                            const localMedsRef = ref(database, `departments/${department}/localMeds`);
                            const medsSnapshot = await get(localMedsRef);
                            const localMedsData = medsSnapshot.val();

                            if (localMedsData) {
                                Object.entries(localMedsData).forEach(([key, value]) => {
                                    const quantity = value.quantity || 0;
                                    const maxQuantity = value.maxQuantity || quantity;
                                    const status = calculateStatus(quantity, maxQuantity);

                                    if (status === "Low Stock" || status === "Very Low") {
                                        lowStockItems += 1;
                                    }
                                });
                            }
                        }
                    }
                }

                setLowStockCount(lowStockItems);
            } catch (error) {
                console.error("Error fetching low stock data:", error);
            }
        };

        const fetchPendingRequests = async () => {
            try {
                let pendingRequests = 0;
        
                const auth = getAuth();
                const user = auth.currentUser;
        
                if (user) {
                    // Get the email of the logged-in user
                    const email = user.email;
        
                    if (userRole === "Admin") {
                        // Admin: fetch requests from both CSR and Pharmacy
                        const csrRequestsRef = ref(database, "departments/CSR/Request");
                        const csrSnapshot = await get(csrRequestsRef);
                        const csrRequestsData = csrSnapshot.val();
                        pendingRequests += csrRequestsData ? Object.keys(csrRequestsData).length : 0;
        
                        const pharmacyRequestsRef = ref(database, "departments/Pharmacy/Request");
                        const pharmacySnapshot = await get(pharmacyRequestsRef);
                        const pharmacyRequestsData = pharmacySnapshot.val();
                        pendingRequests += pharmacyRequestsData ? Object.keys(pharmacyRequestsData).length : 0;
                    } else if (userRole === "CSR") {
                        // CSR: fetch only supply requests for CSR
                        const supplyRequestsRef = ref(database, "departments/CSR/Request");
                        const snapshot = await get(supplyRequestsRef);
                        const supplyRequestsData = snapshot.val();
        
                        pendingRequests = supplyRequestsData ? Object.keys(supplyRequestsData).length : 0;
                    } else if (userRole === "Pharmacy") {
                        // Pharmacy: fetch only medicine requests for Pharmacy
                        const medRequestsRef = ref(database, "departments/Pharmacy/Request");
                        const snapshot = await get(medRequestsRef);
                        const medRequestsData = snapshot.val();
        
                        pendingRequests = medRequestsData ? Object.keys(medRequestsData).length : 0;
                    }
        
                    setPendingRequestsCount(pendingRequests);
                }
            } catch (error) {
                console.error("Error fetching pending requests data:", error);
            }
        };
        

        const initializeDashboard = async () => {
            await fetchUserRole();
            await fetchLowStockItems();
            await fetchNewPatientsToday();
            await fetchPendingRequests();
        };

        initializeDashboard();
    }, [userRole]);

    return (
        <div className="px-8">
            <div className="w-full text-center mb-8">
                <p className="text-2xl font-semibold">Quick Stats</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
                {/* Total Low Stock */}
                <div className="h-56 w-full rounded-lg bg-white shadow-lg flex flex-col justify-between">
                    <div className="px-6 pt-6 text-md font-semibold">
                        Low Stock
                    </div>
                    <div className="flex flex-row justify-between px-6">
                        <div className="relative h-14 w-14 rounded-full bg-rose-500 text-center text-pink-50">
                            <ShoppingCartIcon className="h-8 w-8 mx-auto my-3 text-white" />
                        </div>
                        <h2 className="self-center text-3xl font-bold">{lowStockCount}</h2>
                    </div>
                    <div className="px-6 pb-6">
                        <Link
                            className="text-md flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition duration-200"
                            to="/OverallInventory"
                        >
                            <span>View more</span>
                            <ArrowRightIcon className="h-5 w-5" />
                        </Link>
                    </div>
                </div>

                {/* New Patients Today */}
                <div className="h-56 w-full rounded-lg bg-white shadow-lg flex flex-col justify-between">
                    <div className="px-6 pt-6 text-md font-semibold">New Patients Today</div>
                    <div className="flex flex-row justify-between px-6">
                        <div className="relative h-14 w-14 rounded-full bg-yellow-500 text-center text-yellow-50">
                            <UserPlusIcon className="h-8 w-8 mx-auto my-3 text-white" />
                        </div>
                        <h2 className="self-center text-3xl font-bold">{newPatientCount}</h2>
                    </div>
                    <div className="px-6 pb-6">
                        <Link
                            className="text-md flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition duration-200" to="/patients">
                            <span>View more</span>
                            <ArrowRightIcon className="h-5 w-5" />
                        </Link>
                    </div>
                </div>

                {/* Usage Analytics */}
                <div className="h-56 w-full rounded-lg bg-white shadow-lg flex flex-col justify-between">
                    <div className="px-6 pt-6 text-md font-semibold">Usage Analytics</div>
                    <div className="flex flex-row justify-between px-6">
                        <div className="relative h-14 w-14 rounded-full bg-green-500 text-center text-green-50">
                            <UserIcon className="h-8 w-8 mx-auto my-3 text-white" />
                        </div>
                        <h2 className="self-center text-3xl font-bold">345</h2>
                    </div>
                    <div className="px-6 pb-6">
                        <a className="text-md flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition duration-200" href="#">
                            <span>View more</span>
                            <ArrowRightIcon className="h-5 w-5" />
                        </a>
                    </div>
                </div>

                <div className="h-56 w-full rounded-lg bg-white shadow-lg flex flex-col justify-between">
                    <div className="px-6 pt-6 text-md font-semibold">Pending Request</div>
                    <div className="flex flex-row justify-between px-6">
                        <div className="relative h-14 w-14 rounded-full bg-indigo-500 text-center text-indigo-50">
                            <UsersIcon className="h-8 w-8 mx-auto my-3 text-white" />
                        </div>
                        <h2 className="self-center text-3xl font-bold">{pendingRequestCount}</h2>
                    </div>
                    <div className="px-6 pb-6">
                        <a className="text-md flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition duration-200" href="#">
                            <span>View more</span>
                            <ArrowRightIcon className="h-5 w-5" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;

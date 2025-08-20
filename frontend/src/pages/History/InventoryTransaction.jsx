import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { getAuth } from "firebase/auth";
import { database } from "../../firebase/firebase";
import AccessDenied from "../ErrorPages/AccessDenied";

const InventoryTransaction = () => {
  const [transactionList, setTransactionList] = useState([]);
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [clinicId, setClinicId] = useState("");
  const [user, setUser] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const auth = getAuth();

  // Fetch current user and user data
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        const userRef = ref(database, `users/${firebaseUser.uid}`);
        onValue(userRef, (snapshot) => {
          const userData = snapshot.val();
          if (userData) {
            setDepartment(userData.department || "");
            setRole(userData.role || "");
            setClinicId(userData.clinicAffiliation || "");
          }
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch transactions
  useEffect(() => {
    if (!user || !role) return;

    const inventoryRef = ref(database, "inventoryTransactions");
    setLoading(true);

    const unsubscribe = onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setTransactionList([]);
        setLoading(false);
        return;
      }

      let transactions = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
      }));

      if (role.toLowerCase() === "admin" || role.toLowerCase() === "superadmin") {
        // No filtering
      } else if (role.toLowerCase() === "manager") {
        transactions = transactions.filter((t) => t.clinicId === clinicId);
      } else if (role.toLowerCase() === "staff" || role.toLowerCase() === "doctor") {
        transactions = transactions.filter(
          (t) =>
            t.clinicId === clinicId &&
            (t.sourceDepartment === department ||
              t.destinationDepartment === department ||
              t.processedByUserId === user.uid)
        );
      } else {
        transactions = transactions.filter((t) => t.processedByUserId === user.uid);
      }

      setTransactionList(transactions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, role, department, clinicId]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return "Invalid Date";
    }
  };

  const filteredTransactionList = transactionList.filter((transaction) => {
    const transactionTimestamp = new Date(transaction.timestamp);

    let isInRange = true;
    if (startDate && !endDate) {
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startDate);
      endOfDay.setHours(23, 59, 59, 999);
      isInRange = transactionTimestamp >= startOfDay && transactionTimestamp <= endOfDay;
    } else if (startDate && endDate) {
      isInRange = transactionTimestamp >= startDate && transactionTimestamp <= endDate;
    }

    const matchesSearchTerm =
      transaction.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.processedByUserFirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.processedByUserLastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.transactionType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.sourceDepartment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.destinationDepartment?.toLowerCase().includes(searchTerm.toLowerCase());

    return isInRange && matchesSearchTerm;
  });

  // Get transaction type display text with styling
  const getTransactionTypeDisplay = (type) => {
    const typeColors = {
      stock_in: "bg-green-100 text-green-800",
      usage: "bg-red-100 text-red-800",
      transfer_out: "bg-blue-100 text-blue-800",
      transfer_in: "bg-purple-100 text-purple-800",
      adjustment: "bg-yellow-100 text-yellow-800"
    };

    const typeLabels = {
      stock_in: "Stock In",
      usage: "Usage",
      transfer_out: "Transfer Out",
      transfer_in: "Transfer In",
      adjustment: "Adjustment"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[type] || 'bg-gray-100 text-gray-800'}`}>
        {typeLabels[type] || type}
      </span>
    );
  };

  // Simple date picker component
  const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={startDate ? startDate.toISOString().split('T')[0] : ''}
        onChange={(e) => onStartDateChange(e.target.value ? new Date(e.target.value) : null)}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Start Date"
      />
      <span className="text-gray-500">to</span>
      <input
        type="date"
        value={endDate ? endDate.toISOString().split('T')[0] : ''}
        onChange={(e) => onEndDateChange(e.target.value ? new Date(e.target.value) : null)}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="End Date"
      />
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">  
          <p className="text-gray-600 mt-2">View and track all inventory transaction history with real-time updates</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transactions..."
              className="border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-80"
            />
          </div>
        </div>

        {/* Transaction Stats - Updated in real-time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
                <p className="text-2xl font-bold text-gray-900">{filteredTransactionList.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Stock In</h3>
                <p className="text-2xl font-bold text-green-600">
                  {filteredTransactionList.filter(t => t.transactionType === 'stock_in').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path>
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Usage</h3>
                <p className="text-2xl font-bold text-red-600">
                  {filteredTransactionList.filter(t => t.transactionType === 'usage').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Transfers</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredTransactionList.filter(t => t.transactionType === 'transfer_out' || t.transactionType === 'transfer_in').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Adjustments</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredTransactionList.filter(t => t.transactionType === 'adjustment').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading transactions...</span>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        {!loading && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-900">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Item & Type
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Processed By
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactionList.length > 0 ? (
                    filteredTransactionList
                      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                      .map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">
                                {transaction.itemName || "Unknown Item"}
                              </span>
                              <div className="mt-1">
                                {getTransactionTypeDisplay(transaction.transactionType)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-medium ${
                              transaction.quantityChanged > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.quantityChanged > 0 ? '+' : ''}{transaction.quantityChanged}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">
                                {`${transaction.processedByUserFirstName || 'Unknown'} ${transaction.processedByUserLastName || 'User'}`}
                              </span>
                              <span className="text-xs text-gray-500">
                                ID: {transaction.processedByUserId?.substring(0, 8)}...
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col text-sm">
                              {transaction.sourceDepartment && (
                                <span className="text-gray-600">
                                  From: <span className="font-medium">{transaction.sourceDepartment}</span>
                                </span>
                              )}
                              {transaction.destinationDepartment && (
                                <span className="text-gray-600">
                                  To: <span className="font-medium">{transaction.destinationDepartment}</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-900">{transaction.reason || "No reason provided"}</span>
                            {transaction.relatedPatientId && (
                              <div className="text-xs text-gray-500 mt-1">
                                Patient: {transaction.relatedPatientId}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {transaction.timestamp ? formatTimestamp(transaction.timestamp) : "N/A"}
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                          <p className="text-lg font-medium text-gray-900 mb-1">No transactions found</p>
                          <p className="text-gray-500">Try adjusting your search criteria or date range</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer with transaction count */}
        {!loading && filteredTransactionList.length > 0 && (
          <div className="mt-6 text-sm text-gray-500 text-center bg-white p-4 rounded-lg">
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Showing {filteredTransactionList.length} transaction{filteredTransactionList.length !== 1 ? 's' : ''} • Live updates enabled
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default InventoryTransaction;